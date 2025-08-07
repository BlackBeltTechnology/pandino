---
sidebar_position: 4
---

# Event System

The Event System in Pandino provides a publish-subscribe messaging mechanism that enables loose coupling between components. It allows components to communicate without direct dependencies, making your application more modular and maintainable.

## What is an Event System?

An event system is a communication mechanism that allows components to send and receive messages without knowing about each other. It consists of:

- **Event Publishers**: Components that send events
- **Event Handlers**: Components that receive and process events
- **Event Topics**: Hierarchical naming scheme for categorizing events
- **Event Properties**: Data associated with events

This pattern enables:

- **Loose coupling**: Publishers don't know who (if anyone) is listening
- **Dynamic discovery**: Handlers can be added or removed at runtime
- **Selective processing**: Handlers can filter which events they receive
- **Distributed communication**: Components can communicate across bundle boundaries

## The EventAdmin Service

In Pandino, the event system is implemented through the `EventAdmin` service, which is automatically registered by the framework. This service provides methods for sending events and manages the delivery of events to registered handlers.

```typescript
import { EventAdmin, Event } from '@pandino/pandino';
import type { BundleContext } from '@pandino/pandino';

function useEventAdmin(context: BundleContext) {
  // Get the EventAdmin service
  const eventAdminRef = context.getServiceReference<EventAdmin>('EventAdmin');
  const eventAdmin = context.getService(eventAdminRef)!;

  // Create an event
  const event = new Event('com/example/user/created', {
    userId: '123',
    username: 'john.doe',
    email: 'john.doe@example.com',
    timestamp: Date.now()
  });

  // Send the event synchronously
  eventAdmin.sendEvent(event);

  // Send the event asynchronously
  eventAdmin.postEvent(event);
}
```

## Event Topics

Event topics in Pandino follow a hierarchical naming scheme similar to Java package names, using slashes as separators:

```
category/subcategory/action
```

For example:

- `user/login` - User login event
- `user/logout` - User logout event
- `order/created` - Order creation event
- `order/payment/completed` - Order payment completion event
- `system/config/updated` - System configuration update event

Topics can be used with wildcards for subscription:

- `user/*` - All user events
- `order/*/completed` - All completion events for any order-related subcategory
- `*` - All events (use with caution)

## Creating Events

Events in Pandino are instances of the `Event` class:

```typescript
import { Event } from '@pandino/pandino';

// Create an event with a topic and properties
const loginEvent = new Event('user/login', {
  userId: '123',
  username: 'john.doe',
  timestamp: Date.now(),
  ipAddress: '192.168.1.1'
});

// Create an event with a topic only
const heartbeatEvent = new Event('system/heartbeat');

// Access event properties
const topic = loginEvent.getTopic(); // 'user/login'
const userId = loginEvent.getProperty('userId'); // '123'
const allProps = loginEvent.getPropertyNames(); // ['userId', 'username', 'timestamp', 'ipAddress']
```

## Publishing Events

Events can be published in two ways:

### Synchronous Publishing

```typescript
import { EventAdmin, Event } from '@pandino/pandino';
import type { BundleContext } from '@pandino/pandino';

class UserService {
  private eventAdmin: EventAdmin;

  constructor(context: BundleContext) {
    const eventAdminRef = context.getServiceReference<EventAdmin>('EventAdmin');
    this.eventAdmin = context.getService(eventAdminRef)!;
  }

  async login(username: string, password: string): Promise<User> {
    // Authenticate user...
    const user = await this.authenticate(username, password);

    // Send login event synchronously
    // This will block until all handlers have processed the event
    this.eventAdmin.sendEvent(new Event('user/login', {
      userId: user.id,
      username: user.username,
      timestamp: Date.now()
    }));

    return user;
  }
}
```

### Asynchronous Publishing

```typescript
import { EventAdmin, Event } from '@pandino/pandino';
import type { BundleContext } from '@pandino/pandino';

class NotificationService {
  private eventAdmin: EventAdmin;

  constructor(context: BundleContext) {
    const eventAdminRef = context.getServiceReference<EventAdmin>('EventAdmin');
    this.eventAdmin = context.getService(eventAdminRef)!;
  }

  sendNotification(userId: string, message: string): void {
    // Send notification...

    // Post notification event asynchronously
    // This will return immediately, not waiting for handlers
    this.eventAdmin.postEvent(new Event('notification/sent', {
      userId,
      message,
      timestamp: Date.now()
    }));
  }
}
```

## Handling Events

To receive events, components register as `EventHandler` services:

### Basic Event Handler

```typescript
import { Component, Service, Property } from '@pandino/decorators';
import type { EventHandler, Event } from '@pandino/pandino';

@Component({ name: 'user.event.logger' })
@Service({ interfaces: ['EventHandler'] })
@Property({ name: 'event.topics', value: 'user/*' })
class UserEventLogger implements EventHandler {
  handleEvent(event: Event): void {
    const topic = event.getTopic();
    const userId = event.getProperty('userId');
    const timestamp = new Date(event.getProperty('timestamp')).toISOString();

    console.log(`[${timestamp}] User event: ${topic} for user ${userId}`);
  }
}
```

### Filtered Event Handler

You can use LDAP filters to selectively receive events based on their properties:

```typescript
import { Component, Service, Property } from '@pandino/decorators';
import type { EventHandler, Event } from '@pandino/pandino';

@Component({ name: 'high.value.order.handler' })
@Service({ interfaces: ['EventHandler'] })
@Property({ name: 'event.topics', value: 'order/created' })
@Property({ name: 'event.filter', value: '(amount>=1000)' })
class HighValueOrderHandler implements EventHandler {
  handleEvent(event: Event): void {
    const orderId = event.getProperty('orderId');
    const amount = event.getProperty('amount');

    console.log(`High-value order detected: ${orderId} with amount ${amount}`);
    // Process high-value order...
  }
}
```

### Multiple Topic Handler

You can listen to multiple topics with a single handler:

```typescript
import { Component, Service, Property } from '@pandino/decorators';
import type { EventHandler, Event } from '@pandino/pandino';

@Component({ name: 'security.event.handler' })
@Service({ interfaces: ['EventHandler'] })
@Property({ name: 'event.topics', value: ['user/login', 'user/logout', 'user/password/changed'] })
class SecurityEventHandler implements EventHandler {
  handleEvent(event: Event): void {
    const topic = event.getTopic();
    const userId = event.getProperty('userId');

    switch (topic) {
      case 'user/login':
        this.logLogin(userId, event.getProperty('ipAddress'));
        break;
      case 'user/logout':
        this.logLogout(userId);
        break;
      case 'user/password/changed':
        this.notifyPasswordChange(userId);
        break;
    }
  }

  private logLogin(userId: string, ipAddress: string): void {
    console.log(`User ${userId} logged in from ${ipAddress}`);
  }

  private logLogout(userId: string): void {
    console.log(`User ${userId} logged out`);
  }

  private notifyPasswordChange(userId: string): void {
    console.log(`User ${userId} changed password`);
  }
}
```

### Manual Registration

You can also register event handlers manually:

```typescript
import type { BundleContext, EventHandler, Event } from '@pandino/pandino';

class AnalyticsService {
  private registrations: any[] = [];

  constructor(private context: BundleContext) {}

  start(): void {
    // Register event handlers
    this.registrations.push(
      // Track page views
      this.context.registerService<EventHandler>('EventHandler', {
        handleEvent: (event: Event) => {
          const page = event.getProperty('page');
          const userId = event.getProperty('userId');
          this.trackPageView(page, userId);
        }
      }, {
        'event.topics': 'ui/page/viewed'
      }),

      // Track button clicks
      this.context.registerService<EventHandler>('EventHandler', {
        handleEvent: (event: Event) => {
          const buttonId = event.getProperty('buttonId');
          const userId = event.getProperty('userId');
          this.trackButtonClick(buttonId, userId);
        }
      }, {
        'event.topics': 'ui/button/clicked'
      })
    );
  }

  stop(): void {
    // Unregister all event handlers
    for (const registration of this.registrations) {
      registration.unregister();
    }
    this.registrations = [];
  }

  private trackPageView(page: string, userId: string): void {
    console.log(`User ${userId} viewed page ${page}`);
  }

  private trackButtonClick(buttonId: string, userId: string): void {
    console.log(`User ${userId} clicked button ${buttonId}`);
  }
}
```

## Event Delivery Guarantees

The EventAdmin service provides different delivery guarantees depending on how events are sent:

- **sendEvent()**: Synchronous delivery, blocking until all handlers have processed the event
- **postEvent()**: Asynchronous delivery, returns immediately and delivers events in a separate thread

```typescript
import { EventAdmin, Event } from '@pandino/pandino';

function sendEvents(eventAdmin: EventAdmin) {
  // Synchronous - guaranteed delivery before method returns
  eventAdmin.sendEvent(new Event('critical/operation/completed', {
    operationId: '123',
    status: 'success'
  }));

  // Asynchronous - fire and forget
  eventAdmin.postEvent(new Event('analytics/user/action', {
    userId: '456',
    action: 'button_click'
  }));
}
```

## React Integration

In React applications, you can use the event system to communicate between components:

### Publishing Events from React Components

```tsx
import React from 'react';
import { usePandinoContext } from '@pandino/react-hooks';
import { Event } from '@pandino/pandino';
import type { EventAdmin } from '@pandino/pandino';

function LoginForm() {
  const { bundleContext } = usePandinoContext();
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Authenticate user...

    // Send login event
    if (bundleContext) {
      const eventAdminRef = bundleContext.getServiceReference<EventAdmin>('EventAdmin');
      const eventAdmin = bundleContext.getService(eventAdminRef);

      if (eventAdmin) {
        eventAdmin.postEvent(new Event('user/login', {
          username,
          timestamp: Date.now()
        }));
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Username"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <button type="submit">Login</button>
    </form>
  );
}
```

### Creating a Custom Event Hook

You can create a custom hook to simplify event publishing:

```tsx
import { useCallback } from 'react';
import { usePandinoContext } from '@pandino/react-hooks';
import { Event } from '@pandino/pandino';
import type { EventAdmin } from '@pandino/pandino';

export function useEventPublisher() {
  const { bundleContext } = usePandinoContext();

  const publishEvent = useCallback((topic: string, properties?: Record<string, any>, sync = false) => {
    if (!bundleContext) return false;

    const eventAdminRef = bundleContext.getServiceReference<EventAdmin>('EventAdmin');
    const eventAdmin = bundleContext.getService(eventAdminRef);

    if (!eventAdmin) return false;

    const event = new Event(topic, properties);

    if (sync) {
      eventAdmin.sendEvent(event);
    } else {
      eventAdmin.postEvent(event);
    }

    return true;
  }, [bundleContext]);

  return publishEvent;
}
```

Then use it in your components:

```tsx
import React from 'react';
import { useEventPublisher } from './hooks/useEventPublisher';

function ProductCard({ product }) {
  const publishEvent = useEventPublisher();

  const handleAddToCart = () => {
    // Add to cart logic...

    // Publish event
    publishEvent('cart/product/added', {
      productId: product.id,
      productName: product.name,
      price: product.price,
      timestamp: Date.now()
    });
  };

  return (
    <div className="product-card">
      <h3>{product.name}</h3>
      <p>${product.price}</p>
      <button onClick={handleAddToCart}>Add to Cart</button>
    </div>
  );
}
```

## Common Event Patterns

### Event-Driven Architecture

You can use events to build a fully event-driven architecture:

```typescript
import { Component, Service, Property, Reference } from '@pandino/decorators';
import type { EventHandler, Event, EventAdmin } from '@pandino/pandino';

// Order Service - publishes events
@Component({ name: 'order.service' })
@Service({ interfaces: ['OrderService'] })
class OrderService {
  @Reference({ interface: 'EventAdmin' })
  private eventAdmin?: EventAdmin;

  async createOrder(userId: string, items: OrderItem[]): Promise<Order> {
    // Create order...
    const order = new Order(userId, items);

    // Publish event
    this.eventAdmin?.sendEvent(new Event('order/created', {
      orderId: order.id,
      userId: order.userId,
      amount: order.totalAmount,
      itemCount: order.items.length,
      timestamp: Date.now()
    }));

    return order;
  }
}

// Inventory Handler - reacts to order events
@Component({ name: 'inventory.handler' })
@Service({ interfaces: ['EventHandler'] })
@Property({ name: 'event.topics', value: 'order/created' })
class InventoryHandler implements EventHandler {
  @Reference({ interface: 'InventoryService' })
  private inventoryService?: InventoryService;

  handleEvent(event: Event): void {
    const orderId = event.getProperty('orderId');

    // Get order details and update inventory
    this.inventoryService?.updateInventoryForOrder(orderId);
  }
}

// Notification Handler - reacts to order events
@Component({ name: 'notification.handler' })
@Service({ interfaces: ['EventHandler'] })
@Property({ name: 'event.topics', value: 'order/created' })
class NotificationHandler implements EventHandler {
  @Reference({ interface: 'NotificationService' })
  private notificationService?: NotificationService;

  handleEvent(event: Event): void {
    const orderId = event.getProperty('orderId');
    const userId = event.getProperty('userId');

    // Send notification to user
    this.notificationService?.sendOrderConfirmation(userId, orderId);
  }
}

// Analytics Handler - reacts to order events
@Component({ name: 'analytics.handler' })
@Service({ interfaces: ['EventHandler'] })
@Property({ name: 'event.topics', value: 'order/created' })
class AnalyticsHandler implements EventHandler {
  @Reference({ interface: 'AnalyticsService' })
  private analyticsService?: AnalyticsService;

  handleEvent(event: Event): void {
    const amount = event.getProperty('amount');
    const itemCount = event.getProperty('itemCount');

    // Track order metrics
    this.analyticsService?.trackOrderMetrics(amount, itemCount);
  }
}
```

### Event Sourcing

You can implement event sourcing by storing all events and reconstructing state:

```typescript
import { Component, Service, Reference } from '@pandino/decorators';
import type { EventAdmin, Event } from '@pandino/pandino';

@Component({ name: 'user.event.store' })
@Service({ interfaces: ['UserEventStore'] })
class UserEventStore {
  private events: Event[] = [];

  @Reference({ interface: 'EventAdmin' })
  private eventAdmin?: EventAdmin;

  storeEvent(event: Event): void {
    // Store event
    this.events.push(event);

    // Republish as a stored event
    this.eventAdmin?.postEvent(new Event(`stored/${event.getTopic()}`, {
      ...Object.fromEntries(event.getPropertyNames().map(name => [name, event.getProperty(name)])),
      'stored.timestamp': Date.now()
    }));
  }

  getEventsForUser(userId: string): Event[] {
    return this.events.filter(event => event.getProperty('userId') === userId);
  }

  reconstructUserState(userId: string): UserState {
    const userEvents = this.getEventsForUser(userId);
    const state: UserState = {
      id: userId,
      profile: {},
      orders: [],
      loginCount: 0,
      lastLogin: null
    };

    // Apply events to reconstruct state
    for (const event of userEvents) {
      switch (event.getTopic()) {
        case 'user/created':
          state.profile = {
            name: event.getProperty('name'),
            email: event.getProperty('email'),
            createdAt: event.getProperty('timestamp')
          };
          break;
        case 'user/profile/updated':
          state.profile = {
            ...state.profile,
            ...event.getProperty('profile')
          };
          break;
        case 'user/login':
          state.loginCount++;
          state.lastLogin = event.getProperty('timestamp');
          break;
        case 'order/created':
          if (event.getProperty('userId') === userId) {
            state.orders.push({
              id: event.getProperty('orderId'),
              amount: event.getProperty('amount'),
              date: event.getProperty('timestamp')
            });
          }
          break;
      }
    }

    return state;
  }
}
```

## Best Practices

### Use Specific Topics

Create a clear topic hierarchy and use specific topics:

```typescript
// Good - specific topics
eventAdmin.postEvent(new Event('user/profile/updated', { userId, profile }));
eventAdmin.postEvent(new Event('order/payment/completed', { orderId, amount }));

// Bad - too generic
eventAdmin.postEvent(new Event('user/event', { userId, type: 'profile-updated', profile }));
eventAdmin.postEvent(new Event('order/event', { orderId, type: 'payment-completed', amount }));
```

### Include Sufficient Context

Include all necessary information in event properties:

```typescript
// Good - includes all relevant information
eventAdmin.postEvent(new Event('order/created', {
  orderId: order.id,
  userId: order.userId,
  items: order.items.map(item => item.id), // Just IDs, not full objects
  amount: order.totalAmount,
  currency: order.currency,
  timestamp: Date.now()
}));

// Bad - missing important context
eventAdmin.postEvent(new Event('order/created', {
  orderId: order.id
}));
```

### Use Filters Effectively

Use event filters to reduce unnecessary event processing:

```typescript
// Register with specific filter
context.registerService<EventHandler>('EventHandler', handler, {
  'event.topics': 'order/created',
  'event.filter': '(&(amount>=1000)(currency=USD))'
});

// Better than handling filtering in the handler
@Component({ name: 'high.value.order.handler' })
@Service({ interfaces: ['EventHandler'] })
@Property({ name: 'event.topics', value: 'order/created' })
@Property({ name: 'event.filter', value: '(&(amount>=1000)(currency=USD))' })
class HighValueOrderHandler implements EventHandler {
  handleEvent(event: Event): void {
    // Only receives high-value USD orders
    // No need to check amount or currency here
  }
}
```

### Choose Delivery Method Wisely

Use the appropriate delivery method based on your requirements:

```typescript
// Use sendEvent for critical operations where you need confirmation
eventAdmin.sendEvent(new Event('payment/processing', { paymentId }));

// Use postEvent for non-critical events
eventAdmin.postEvent(new Event('user/page/viewed', { userId, page }));
```

### Handle Exceptions Gracefully

Event handlers should handle exceptions gracefully to avoid disrupting event delivery:

```typescript
@Component({ name: 'robust.event.handler' })
@Service({ interfaces: ['EventHandler'] })
@Property({ name: 'event.topics', value: 'example/topic' })
class RobustEventHandler implements EventHandler {
  handleEvent(event: Event): void {
    try {
      // Process event...
    } catch (error) {
      console.error('Error handling event:', error);
      // Log error, but don't rethrow
    }
  }
}
```

## Conclusion

The Event System in Pandino provides a powerful mechanism for loose coupling between components. By using events, you can build more modular, maintainable, and extensible applications where components can communicate without direct dependencies.

Whether you're implementing simple notifications, complex event-driven architectures, or event sourcing patterns, Pandino's event system provides the flexibility and reliability you need.
