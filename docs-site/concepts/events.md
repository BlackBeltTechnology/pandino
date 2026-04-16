---
title: Events
description: Publish-subscribe messaging in Pandino using EventAdmin and topic-based routing.
---

# Events

**EventAdmin** is a built-in Pandino service for topic-based publish-subscribe messaging. It lets bundles communicate without direct dependencies -- publishers send events to named topics, and subscribers receive them by declaring interest in those topics.

## Core Concepts

The event system has three parts:

1. **Event** -- A message with a topic string and a properties map.
2. **EventAdmin** -- The service used to send events.
3. **EventHandler** -- The interface subscribers implement to receive events.

## The Event Class

An `Event` carries a topic and optional properties:

```typescript
import { Event } from '@pandino/pandino';

const event = new Event('user/login', {
  userId: '12345',
  timestamp: Date.now(),
  source: 'auth-service',
});

console.log(event.getTopic());             // 'user/login'
console.log(event.getProperty('userId'));   // '12345'
console.log(event.getPropertyNames());      // ['userId', 'timestamp', 'source']
console.log(event.containsProperty('ip'));  // false
```

Topics use a path-like structure (e.g., `'user/login'`, `'order/created'`, `'system/shutdown'`). This hierarchical naming enables wildcard subscriptions.

## Sending Events

First, obtain the `EventAdmin` service:

```typescript
import type { BundleContext } from '@pandino/pandino';
import type { EventAdmin } from '@pandino/pandino';
import { Event } from '@pandino/pandino';

async start(context: BundleContext): Promise<void> {
  const ref = context.getServiceReference<EventAdmin>('EventAdmin');
  const eventAdmin = context.getService(ref!);
}
```

Then send events using one of two methods:

### Synchronous: `sendEvent()`

`sendEvent()` delivers the event to all matching handlers **synchronously** and blocks until all handlers have finished processing:

```typescript
eventAdmin.sendEvent(new Event('order/created', {
  orderId: 'ORD-001',
  total: 99.99,
}));
// All handlers have finished by this point
```

Use `sendEvent()` when you need to ensure all handlers have processed the event before continuing (e.g., validation, pre-commit checks).

### Asynchronous: `postEvent()`

`postEvent()` delivers the event **asynchronously** -- it returns immediately and handlers are invoked later:

```typescript
eventAdmin.postEvent(new Event('user/login', {
  userId: '12345',
  timestamp: Date.now(),
}));
// Returns immediately; handlers run asynchronously
```

Use `postEvent()` for fire-and-forget notifications where you do not need to wait for handler completion.

## Subscribing to Events

To receive events, implement the `EventHandler` interface and register it as a service with the `event.topics` property:

```typescript
import type {
  BundleActivator,
  BundleContext,
  ServiceRegistration,
} from '@pandino/pandino';
import type { EventHandler } from '@pandino/pandino';
import type { Event } from '@pandino/pandino';

class UserLoginHandler implements EventHandler {
  handleEvent(event: Event): void {
    const userId = event.getProperty('userId');
    const timestamp = event.getProperty('timestamp');
    console.log(`User ${userId} logged in at ${new Date(timestamp).toISOString()}`);
  }
}

export default class Activator implements BundleActivator {
  private registration?: ServiceRegistration<EventHandler>;

  async start(context: BundleContext): Promise<void> {
    this.registration = context.registerService(
      'EventHandler',
      new UserLoginHandler(),
      { 'event.topics': 'user/login' },
    );
  }

  async stop(context: BundleContext): Promise<void> {
    this.registration?.unregister();
  }
}
```

The `event.topics` property tells EventAdmin which topics this handler cares about.

## Topic Wildcards

Use `*` as the last segment to subscribe to all events under a topic prefix:

| Pattern | Matches |
| --- | --- |
| `'user/login'` | Only `'user/login'` |
| `'user/*'` | `'user/login'`, `'user/logout'`, `'user/registered'`, etc. |
| `'order/*'` | `'order/created'`, `'order/shipped'`, `'order/cancelled'`, etc. |
| `'*'` | All events on all topics |

```typescript
// Subscribe to all user-related events
context.registerService('EventHandler', new UserEventHandler(), {
  'event.topics': 'user/*',
});
```

## Using Events with Declarative Services

You can use SCR decorators to create event handlers without a manual `BundleActivator`. Use `@Component`, `@Service`, and `@Property` to declare the handler:

```typescript
import { Component, Service, Property } from '@pandino/decorators';
import type { EventHandler } from '@pandino/pandino';
import type { Event } from '@pandino/pandino';

@Component({ name: 'com.example.order-audit', immediate: true })
@Service({ interfaces: ['EventHandler'] })
@Property('event.topics', 'order/*')
class OrderAuditHandler implements EventHandler {
  handleEvent(event: Event): void {
    const topic = event.getTopic();
    const orderId = event.getProperty('orderId');
    console.log(`[Audit] ${topic}: order ${orderId}`);
  }
}
```

This is equivalent to manually registering an `EventHandler` service with the `event.topics` property, but the SCR manages the lifecycle for you.

## Practical Example: System Notifications

Here is a complete example showing a notification dispatcher and multiple subscribers:

**Publisher -- sends events when system actions occur:**

```typescript
import { Component, Service, Activate } from '@pandino/decorators';
import type { ComponentContext } from '@pandino/pandino';
import type { EventAdmin } from '@pandino/pandino';
import { Event } from '@pandino/pandino';

@Component({ name: 'com.example.user-service', immediate: true })
@Service({ interfaces: ['UserService'] })
class UserServiceComponent implements UserService {
  private eventAdmin?: EventAdmin;

  @Activate
  activate(context: ComponentContext): void {
    const ref = context.getBundleContext().getServiceReference<EventAdmin>('EventAdmin');
    if (ref) {
      this.eventAdmin = context.getBundleContext().getService(ref) ?? undefined;
    }
  }

  login(userId: string): void {
    // ... perform login logic ...

    this.eventAdmin?.postEvent(new Event('user/login', {
      userId,
      timestamp: Date.now(),
    }));
  }

  logout(userId: string): void {
    // ... perform logout logic ...

    this.eventAdmin?.postEvent(new Event('user/logout', {
      userId,
      timestamp: Date.now(),
    }));
  }
}
```

**Subscriber -- logs all user activity:**

```typescript
import { Component, Service, Property } from '@pandino/decorators';
import type { EventHandler } from '@pandino/pandino';
import type { Event } from '@pandino/pandino';

@Component({ name: 'com.example.user-activity-logger', immediate: true })
@Service({ interfaces: ['EventHandler'] })
@Property('event.topics', 'user/*')
class UserActivityLogger implements EventHandler {
  handleEvent(event: Event): void {
    console.log(`[Activity] ${event.getTopic()} - user: ${event.getProperty('userId')}`);
  }
}
```

**Subscriber -- tracks login metrics:**

```typescript
import { Component, Service, Property } from '@pandino/decorators';
import type { EventHandler } from '@pandino/pandino';
import type { Event } from '@pandino/pandino';

@Component({ name: 'com.example.login-metrics', immediate: true })
@Service({ interfaces: ['EventHandler'] })
@Property('event.topics', 'user/login')
class LoginMetricsHandler implements EventHandler {
  private loginCount = 0;

  handleEvent(event: Event): void {
    this.loginCount++;
    console.log(`Total logins: ${this.loginCount}`);
  }
}
```

The publisher does not know about either subscriber. New subscribers can be added or removed at any time without modifying the publisher.

## Next Steps

- [Core Framework API](/api/core) -- Full API reference for EventAdmin, Event, and EventHandler
- [Whiteboard Pattern](/patterns/whiteboard-pattern) -- A pattern for building extensible systems with event-driven discovery
