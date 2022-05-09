# configuration-management

Pandino reference implementation for Configuration Management.

## Requirements

A `persistence-manager-api` implementation to persist configurations.

Currently there are two available first-party implementations:
- `persistence-manager-memory`: cross platform in-memory storage
- `persistence-manager-localstorage`: for the DOM

## Managed Services

Any service which implements the `@pandino/configuration-management/ManagedService` interface will be notified
of configuration changes via it's `updated()` method. Every ManagedService must register it self with the framework by
providing a special (reserved) property: `service.pid`.

> Service PIDs are used for configuration pairing. Multiple services can register for the same PID, in such cases, any
  change in configuration will trigger the corresponding `updated()` in all services.

Whenever a ManagedService gets registered in the framework, the `updated()` method will be called with an `undefined`
value.

If a configuration for a ManagedService is deleted, similarly to the above the `updated()` method will be called with an
`undefined` value.

Every ManagedService **SHOULD** take care of default configuration values (to make sure they are operable even at the
initial loading of the service)!

### Example:

```javascript
import { MANAGED_SERVICE_INTERFACE_KEY, SERVICE_PID } from '@pandino/configuration-management-api';

export default class BundleActivator {
  async start(context) {
    const mst = new ManagedServiceTest();
    this.registration = context.registerService(MANAGED_SERVICE_INTERFACE_KEY, mst, {
      [SERVICE_PID]: 'test.pid'
    });

    return Promise.resolve();
  }

  async stop(context) {
    context.unregisterService(this.registration);

    return Promise.resolve();
  }
}

class ManagedServiceTest {
  constructor() {
    this.properties = this.getDefaultProperties();
  }

  updated(properties) {
    if (properties) {
      this.properties = {
        ...this.properties,
        ...properties,
      };
    }
    // ...
  }

  getDefaultProperties() {
    return {
      prop1: 'yayy',
      prop2: true,
    };
  }
}
```

## Config Admin

The ConfigAdmin service is responsible to manage / alter configurations for PIDs.

Obtaining a `Configuration` done via the corresponding API:

```typescript
export interface ConfigurationAdmin {
  getConfiguration(pid: string, location?: string): Configuration;
  // ...
}
```

Once we have a Configuration instance we can query and alter it.

### Example

```javascript
import { CONFIG_ADMIN_INTERFACE_KEY } from '@pandino/configuration-management-api';

export default class Activator {
  async start(context) {
    this.configAdminReference = context.getServiceReference(CONFIG_ADMIN_INTERFACE_KEY);
    this.configAdmin = context.getService(this.configAdminReference);

    const mstConfig = this.configAdmin.getConfiguration('test.pid');
    
    // only update configuration if it's not already set
    if (!mstConfig.getProperties()) {
      mstConfig.update({
        prop1: 'fresh value',
        prop2: true,
      });
    }

    return Promise.resolve();
  }

  stop(context) {
    context.ungetService(this.configAdminReference);

    return Promise.resolve();
  }
}
```
## Configuration Event Handling

We can subscribe to Configuration change events via a service implementing the `@pandino/pandino-configuration-management/ConfigurationListener`
API, and providing the `PID` we want to track.

### Example

```javascript
import { CONFIGURATION_LISTENER_INTERFACE_KEY, SERVICE_PID } from '@pandino/configuration-management-api';

export default class Activator {
  async start(context) {
    this.listenerRegistration = context.registerService(CONFIGURATION_LISTENER_INTERFACE_KEY, new MyListener(), {
      [SERVICE_PID]: 'test.pid',
    });

    return Promise.resolve();
  }

  stop(context) {
    this.listenerRegistratio.unregister();

    return Promise.resolve();
  }
}

class MyListener {
  configurationEvent(event) {
    console.log(event.getPid());
    console.log(event.getType());
    console.log(event.getReference()); // returns a ServiceReference
  }
}
```
