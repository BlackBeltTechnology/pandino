# Event Admin

This is the reference implementation of the [Pandino Event API](../event-api).

## Context

This package is part of the [pandino-root](https://github.com/BlackBeltTechnology/pandino) monorepo. For detailed
information about what is Pandino / how this package fits into the ecosystem, please consult with the related
documentation(s).

## Creating Events

Events consist of quite a lot of properties, therefore the easiest way to construct one is by utilizing the
`EventFactory`. Sending the `Event` can be achieved by calling the `postEvent()` method on the obtained `EventAdmin`
instance.

Every Event consists of a `topic` (string), and a `properties` object.

**Please note, that Event delivery is fully async, and the order of delivery is not pre-defined!**

> It should be considered as a best practice to ensure that the `properies` objects is serializable. E.g.:
  `JSON.stringify()` and `JSON.parse()` compliant.

### Example

```javascript
import { EVENT_ADMIN_INTERFACE_KEY, EVENT_FACTORY_INTERFACE_KEY } from '@pandino/event-api';

export default class Activator {
  async start(context) {
    this.eventAdminReference = context.getServiceReference(EVENT_ADMIN_INTERFACE_KEY);
    this.eventAdmin = context.getService(this.eventAdminReference);
    this.eventFactoryReference = context.getServiceReference(EVENT_FACTORY_INTERFACE_KEY);
    this.eventFactory = context.getService(this.eventFactoryReference);

    // create the Event
    const event = eventFactory.build('@scope/app/TestTopic', {
      prop1: 'yayy',
    });
    
    // send the Event
    this.eventAdmin.postEvent(event);
  }

  async stop(context) {
    context.ungetService(this.eventFactoryReference);
    context.ungetService(this.eventAdminReference);
  }
}
```

## Listening to Events

Any Service which implements the `@pandino/pandino-event-admin/EventHandler` interface and has the service property
`event.topics` (either a single `string`, or an `Array<string>` can be provided as value) defined can listen to Pandino
Events.

In order to narrow down unnecessary triggering of `EventHandler`s, an additional service property `event.filter` can be
defined!

### Example

```javascript
import { EVENT_HANDLER_INTERFACE_KEY, EVENT_TOPIC } from '@pandino/event-api';

export default class BundleActivator {
  async start(context) {
    this.registration = context.registerService(EVENT_HANDLER_INTERFACE_KEY, new TestTopicEventHandler(), {
      [EVENT_TOPIC]: '@scope/app/TestTopic'
    });
  }

  async stop(context) {
    context.unregisterService(this.registration);
  }
}

class TestTopicEventHandler {
  handleEvent(event) {
    console.log(event.getTopic());
    console.log(event.getPropertyNames());
    // ...
  }
}
```

## Topics

Topics should be unique. The recommended way of setting them up to prefix every topic with an actual package scope, and
make them as explicit as possible. Topic segment separator **MUST** be the `/` character. Topics **CAN** start with the
`@` character to mirror NPM-style scopes, but it is not mandatory.

### Topic matching

Matching by default is done in an case-sensitive, as-is manner for plain topics, e.g.: `@scope/package/topic1`. In this
case, only exact matches will trigger listeners.

However there are two reserved keys which you can use as suffixes to loosen up the matching:
- `.`: matches for exactly one additional segment, no more, no less
- `*`: matches for at least one additional segment, no less

### Examples

In the Table below headers represent `topic`s, and the first column the test cases:

|                           | @pandino/pandino/Foo | @pandino/pandino. | @pandino/pandino* |
|---------------------------|----------------------|-------------------|-------------------|
| @pandino/pandino/Foo      | true                 | true              | true              |
| @pandino/pandino/Bar      | false                | true              | true              |
| @pandino/pandino/Foo$1    | false                | true              | true              |
| @pandino/pandino/Foo/Test | false                | false             | true              |
| @pandino/pandino          | false                | false             | false             |

## License

Eclipse Public License - v 2.0
