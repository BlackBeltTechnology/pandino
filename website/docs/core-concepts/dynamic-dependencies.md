---
sidebar_position: 3
---

# Dynamic Dependencies

Dynamic Dependencies is a core concept in Pandino that allows components to automatically discover and use services without worrying about the order in which they're registered or when they become available.

## The Problem with Static Dependencies

In traditional applications, dependencies are often static and hard-coded:

```typescript
// Traditional approach with static dependencies
import { DatabaseService } from './database-service';
import { LogService } from './log-service';

class UserService {
  private db: DatabaseService;
  private logger: LogService;

  constructor() {
    // Hard-coded dependencies
    this.db = new DatabaseService();
    this.logger = new LogService();
  }

  async getUser(id: string) {
    this.logger.info(`Getting user with ID: ${id}`);
    return this.db.query('SELECT * FROM users WHERE id = ?', [id]);
  }
}
```

This approach has several limitations:

- **Tight coupling**: Components are directly dependent on specific implementations
- **Startup order**: Components must be initialized in the correct order
- **Testing challenges**: Hard to mock dependencies for testing
- **No runtime flexibility**: Can't change implementations at runtime

## Dynamic Dependencies in Pandino

Pandino solves these problems with dynamic dependencies:

- **Service references**: Components reference services by interface, not implementation
- **Automatic resolution**: Dependencies are resolved when services become available
- **Lifecycle management**: Components activate when dependencies are satisfied
- **Runtime flexibility**: Services can be replaced or updated at runtime

## Service References

The simplest form of dynamic dependency is using service references:

```typescript
import type { BundleContext, ServiceReference } from '@pandino/pandino';
import type { LogService, DatabaseService } from './types';

class UserService {
  private logger: LogService | null = null;
  private db: DatabaseService | null = null;

  constructor(private context: BundleContext) {
    // Find the log service
    const logRef = context.getServiceReference<LogService>('LogService');
    if (logRef) {
      this.logger = context.getService(logRef);
    }

    // Find the database service
    const dbRef = context.getServiceReference<DatabaseService>('DatabaseService');
    if (dbRef) {
      this.db = context.getService(dbRef);
    }
  }

  async getUser(id: string) {
    this.logger?.info(`Getting user with ID: ${id}`);
    return this.db?.query('SELECT * FROM users WHERE id = ?', [id]) || null;
  }
}
```

## Service Trackers

For more robust dynamic dependency management, use ServiceTracker:

```typescript
import { ServiceTracker } from '@pandino/pandino';
import type { BundleContext, ServiceReference } from '@pandino/pandino';
import type { LogService, DatabaseService } from './types';

class UserService {
  private logger: LogService | null = null;
  private db: DatabaseService | null = null;
  private logTracker: ServiceTracker<LogService>;
  private dbTracker: ServiceTracker<DatabaseService>;

  constructor(private context: BundleContext) {
    // Create trackers for dependencies
    this.logTracker = new ServiceTracker<LogService>(context, 'LogService', {
      addingService: (ref: ServiceReference<LogService>) => {
        const service = context.getService(ref);
        this.logger = service;
        service?.info('LogService connected to UserService');
        return service;
      },
      removedService: (ref: ServiceReference<LogService>, service: LogService) => {
        this.logger = null;
        context.ungetService(ref);
      }
    });

    this.dbTracker = new ServiceTracker<DatabaseService>(context, 'DatabaseService', {
      addingService: (ref: ServiceReference<DatabaseService>) => {
        const service = context.getService(ref);
        this.db = service;
        this.logger?.info('DatabaseService connected to UserService');
        return service;
      },
      removedService: (ref: ServiceReference<DatabaseService>, service: DatabaseService) => {
        this.db = null;
        context.ungetService(ref);
      }
    });
  }

  start() {
    // Open trackers to start tracking services
    this.logTracker.open();
    this.dbTracker.open();
  }

  stop() {
    // Close trackers to stop tracking services
    this.logTracker.close();
    this.dbTracker.close();
  }

  async getUser(id: string) {
    if (!this.logger || !this.db) {
      throw new Error('Required services not available');
    }

    this.logger.info(`Getting user with ID: ${id}`);
    return this.db.query('SELECT * FROM users WHERE id = ?', [id]);
  }
}
```

## Declarative Services

The most elegant way to handle dynamic dependencies is with declarative services:

```typescript
import { Component, Service, Reference, Activate } from '@pandino/decorators';
import type { ComponentContext } from '@pandino/pandino';
import type { LogService, DatabaseService, User } from './types';

@Component({ name: 'user.service' })
@Service({ interfaces: ['UserService'] })
class UserService {
  @Reference({ interface: 'LogService' })
  private logger?: LogService;

  @Reference({ interface: 'DatabaseService' })
  private db?: DatabaseService;

  @Activate
  activate(context: ComponentContext): void {
    this.logger?.info('UserService activated');
  }

  async getUser(id: string): Promise<User | null> {
    if (!this.logger || !this.db) {
      throw new Error('Required services not available');
    }

    this.logger.info(`Getting user with ID: ${id}`);
    const results = await this.db.query('SELECT * FROM users WHERE id = ?', [id]);
    return results[0] || null;
  }
}
```

With this approach:

1. The component is only activated when all required services are available
2. If a service becomes unavailable, the component is deactivated
3. When the service becomes available again, the component is reactivated
4. No manual tracking or lifecycle management is needed

## Dependency Cardinality

You can specify the cardinality of dependencies:

```typescript
import { Component, Service, Reference } from '@pandino/decorators';

@Component({ name: 'notification.service' })
@Service({ interfaces: ['NotificationService'] })
class NotificationService {
  // Required dependency (1..1) - component won't activate without it
  @Reference({
    interface: 'LogService',
    cardinality: '1..1'  // Default
  })
  private logger?: LogService;

  // Optional dependency (0..1) - component will activate even if not available
  @Reference({
    interface: 'MetricsService',
    cardinality: '0..1'
  })
  private metrics?: MetricsService;

  // Multiple required dependencies (1..n) - at least one must be available
  @Reference({
    interface: 'NotificationChannel',
    cardinality: '1..n'
  })
  private channels: NotificationChannel[] = [];

  // Multiple optional dependencies (0..n) - component will activate even if none available
  @Reference({
    interface: 'NotificationFilter',
    cardinality: '0..n'
  })
  private filters: NotificationFilter[] = [];

  async sendNotification(userId: string, message: string): Promise<void> {
    this.logger?.info(`Sending notification to user ${userId}`);

    // Apply filters if available
    let filteredMessage = message;
    for (const filter of this.filters) {
      filteredMessage = filter.process(filteredMessage);
    }

    // Track metrics if available
    this.metrics?.incrementCounter('notifications.sent');

    // Send through all available channels
    for (const channel of this.channels) {
      await channel.send(userId, filteredMessage);
    }
  }
}
```

## Dependency Policy

You can also specify how dynamic dependencies are handled:

```typescript
import { Component, Service, Reference } from '@pandino/decorators';

@Component({ name: 'data.processor' })
@Service({ interfaces: ['DataProcessor'] })
class DataProcessor {
  // Static policy - component is deactivated when dependency changes
  @Reference({
    interface: 'DatabaseService',
    policy: 'static'  // Default
  })
  private db?: DatabaseService;

  // Dynamic policy - component stays active when dependency changes
  @Reference({
    interface: 'CacheService',
    policy: 'dynamic'
  })
  private cache?: CacheService;

  // Policy option - how eagerly to bind to services
  @Reference({
    interface: 'FilterService',
    policyOption: 'greedy'  // Bind to highest-ranking service (default)
  })
  private greedyFilter?: FilterService;

  @Reference({
    interface: 'FilterService',
    policyOption: 'reluctant'  // Bind to first available service
  })
  private reluctantFilter?: FilterService;
}
```

## Custom Bind/Unbind Methods

You can specify custom methods to handle service binding and unbinding:

```typescript
import { Component, Service, Reference } from '@pandino/decorators';
import type { LogService, DatabaseService } from './types';

@Component({ name: 'user.repository' })
@Service({ interfaces: ['UserRepository'] })
class UserRepository {
  private logger: LogService | null = null;
  private db: DatabaseService | null = null;
  private connected: boolean = false;

  @Reference({
    interface: 'LogService',
    bind: 'setLogger',
    unbind: 'unsetLogger'
  })
  private loggerRef?: LogService;

  @Reference({
    interface: 'DatabaseService',
    bind: 'setDatabase',
    unbind: 'unsetDatabase'
  })
  private dbRef?: DatabaseService;

  // Custom bind method for logger
  setLogger(service: LogService): void {
    this.logger = service;
    this.logger.info('Logger bound to UserRepository');
    this.checkConnection();
  }

  // Custom unbind method for logger
  unsetLogger(service: LogService): void {
    this.logger?.info('Logger unbinding from UserRepository');
    this.logger = null;
    this.connected = false;
  }

  // Custom bind method for database
  setDatabase(service: DatabaseService): void {
    this.db = service;
    this.logger?.info('Database bound to UserRepository');
    this.checkConnection();
  }

  // Custom unbind method for database
  unsetDatabase(service: DatabaseService): void {
    this.logger?.info('Database unbinding from UserRepository');
    this.db = null;
    this.connected = false;
  }

  private checkConnection(): void {
    if (this.logger && this.db) {
      this.connected = true;
      this.logger.info('UserRepository fully connected');
    }
  }

  async findUser(id: string): Promise<User | null> {
    if (!this.connected) {
      throw new Error('Repository not connected');
    }

    this.logger?.info(`Finding user with ID: ${id}`);
    return this.db?.findUser(id) || null;
  }
}
```

## Filtered Dependencies

You can filter dependencies based on service properties:

```typescript
import { Component, Service, Reference } from '@pandino/decorators';

@Component({ name: 'payment.processor' })
@Service({ interfaces: ['PaymentProcessor'] })
class PaymentProcessor {
  // Filter by service property
  @Reference({
    interface: 'PaymentGateway',
    filter: '(gateway.type=credit-card)'
  })
  private creditCardGateway?: PaymentGateway;

  // More complex filter
  @Reference({
    interface: 'PaymentGateway',
    filter: '(&(gateway.type=paypal)(gateway.environment=production))'
  })
  private paypalGateway?: PaymentGateway;

  // Multiple services with filter
  @Reference({
    interface: 'PaymentValidator',
    filter: '(validator.priority>=100)',
    cardinality: '0..n'
  })
  private highPriorityValidators: PaymentValidator[] = [];

  async processPayment(payment: Payment): Promise<PaymentResult> {
    // Validate payment
    for (const validator of this.highPriorityValidators) {
      await validator.validate(payment);
    }

    // Process with appropriate gateway
    if (payment.method === 'credit-card' && this.creditCardGateway) {
      return this.creditCardGateway.process(payment);
    } else if (payment.method === 'paypal' && this.paypalGateway) {
      return this.paypalGateway.process(payment);
    }

    throw new Error(`No gateway available for payment method: ${payment.method}`);
  }
}
```

## React Integration

In React components, you can use the `useService` hook for dynamic dependencies:

```tsx
import React, { useState, useEffect } from 'react';
import { useService } from '@pandino/react-hooks';
import type { UserService, User } from './types';

function UserProfile({ userId }: { userId: string }) {
  // Dynamic dependency on UserService
  const { service: userService, loading: userServiceLoading } =
    useService<UserService>('UserService');

  // Dynamic dependency on ThemeService (optional)
  const { service: themeService } =
    useService<ThemeService>('ThemeService');

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user data when service becomes available
  useEffect(() => {
    if (!userService) return;

    setLoading(true);
    setError(null);

    userService.getUser(userId)
      .then(userData => {
        setUser(userData);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [userService, userId]);

  // Show loading state while waiting for service or data
  if (userServiceLoading || loading) {
    return <div>Loading...</div>;
  }

  // Show error if service failed
  if (!userService) {
    return <div>User service not available</div>;
  }

  // Show error if data loading failed
  if (error) {
    return <div>Error: {error}</div>;
  }

  // Show user data
  if (!user) {
    return <div>User not found</div>;
  }

  // Use theme service if available, otherwise use defaults
  const theme = themeService?.getCurrentTheme() || {
    primaryColor: '#007bff',
    textColor: '#333333'
  };

  return (
    <div style={{ color: theme.textColor }}>
      <h2 style={{ color: theme.primaryColor }}>{user.name}</h2>
      <p>{user.email}</p>
      <p>Member since: {new Date(user.createdAt).toLocaleDateString()}</p>
    </div>
  );
}
```

## Startup Order Independence

One of the most powerful features of dynamic dependencies is that the startup order of bundles doesn't matter:

```typescript
import { OSGiBootstrap } from '@pandino/pandino';
import ApiBundle from './bundles/api-bundle';
import DatabaseBundle from './bundles/database-bundle';
import LoggingBundle from './bundles/logging-bundle';
import UserBundle from './bundles/user-bundle';

async function startApplication() {
  const bootstrap = new OSGiBootstrap();
  const framework = await bootstrap.start();
  const context = framework.getBundleContext();

  // Bundles can be started in any order!
  // The framework will resolve dependencies automatically

  // Using the Promise version of installBundle (recommended for better bundler optimizations)
  // This approach allows bundlers to perform code splitting and lazy loading

  // Start API bundle (depends on Database)
  await context.installBundle(Promise.resolve({ default: ApiBundle })).then(b => b.start());

  // Start User bundle (depends on API and Logging)
  await context.installBundle(Promise.resolve({ default: UserBundle })).then(b => b.start());

  // Start Database bundle (API bundle will get this service when it's available)
  await context.installBundle(Promise.resolve({ default: DatabaseBundle })).then(b => b.start());

  // Start Logging bundle (User bundle will get this service when it's available)
  await context.installBundle(Promise.resolve({ default: LoggingBundle })).then(b => b.start());

  // In a real application, you would typically use dynamic imports:
  // await context.installBundle(import('./bundles/api-bundle')).then(b => b.start());
  // await context.installBundle(import('./bundles/user-bundle')).then(b => b.start());
  // await context.installBundle(import('./bundles/database-bundle')).then(b => b.start());
  // await context.installBundle(import('./bundles/logging-bundle')).then(b => b.start());

  return { bootstrap, context };
}
```

## Best Practices

### Use Declarative Services

Whenever possible, use declarative services with `@Component` and `@Reference` decorators:

```typescript
import { Component, Service, Reference, Activate } from '@pandino/decorators';
import type { ComponentContext } from '@pandino/pandino';

@Component({ name: 'example.service' })
@Service({ interfaces: ['ExampleService'] })
class ExampleService {
  @Reference({ interface: 'DependencyService' })
  private dependency?: DependencyService;

  @Activate
  activate(context: ComponentContext): void {
    console.log('ExampleService activated with dependencies');
  }
}
```

### Specify Cardinality Correctly

Be explicit about whether dependencies are required or optional:

```typescript
@Component({ name: 'example.service' })
@Service({ interfaces: ['ExampleService'] })
class ExampleService {
  // Required dependency - service won't activate without it
  @Reference({
    interface: 'CriticalService',
    cardinality: '1..1'
  })
  private critical?: CriticalService;

  // Optional dependency - service will activate even if not available
  @Reference({
    interface: 'OptionalService',
    cardinality: '0..1'
  })
  private optional?: OptionalService;
}
```

### Handle Missing Dependencies Gracefully

Always check if optional dependencies are available before using them:

```typescript
@Component({ name: 'notification.service' })
@Service({ interfaces: ['NotificationService'] })
class NotificationService {
  @Reference({
    interface: 'AnalyticsService',
    cardinality: '0..1'
  })
  private analytics?: AnalyticsService;

  sendNotification(userId: string, message: string): void {
    // Send notification...

    // Track analytics if service is available
    if (this.analytics) {
      this.analytics.trackEvent('notification_sent', {
        userId,
        messageLength: message.length
      });
    }
  }
}
```

### Use Service Properties for Selection

Use service properties and filters to select the right implementation:

```typescript
// Register services with properties
context.registerService<PaymentGateway>('PaymentGateway', new CreditCardGateway(), {
  'gateway.type': 'credit-card',
  'gateway.provider': 'stripe',
  'service.ranking': 100
});

context.registerService<PaymentGateway>('PaymentGateway', new PayPalGateway(), {
  'gateway.type': 'paypal',
  'gateway.environment': 'production',
  'service.ranking': 90
});

// Reference with filter in a component class
@Component({ name: 'payment.service' })
@Service({ interfaces: ['PaymentService'] })
class PaymentService {
  @Reference({
    interface: 'PaymentGateway',
    filter: '(gateway.type=credit-card)'
  })
  private creditCardGateway?: PaymentGateway;
}
```

## Conclusion

Dynamic Dependencies are a fundamental concept in Pandino that enables truly modular and loosely-coupled applications. By allowing components to discover and use services dynamically, Pandino eliminates many of the challenges associated with traditional dependency management, such as tight coupling, startup order dependencies, and testing difficulties.

Whether you're using service references, service trackers, or declarative services, Pandino provides powerful tools for managing dynamic dependencies in a clean and maintainable way.
