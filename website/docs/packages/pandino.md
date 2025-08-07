---
sidebar_position: 1
---

# @pandino/pandino

[![npm version](https://badge.fury.io/js/@pandino%2Fpandino.svg)](https://badge.fury.io/js/@pandino%2Fpandino)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-EPL2.0-blue.svg)](LICENSE.txt)

Core TypeScript framework providing service registry, bundle system, and built-in services for modular applications.

## Installation

```bash
npm install @pandino/pandino
```

## TypeScript Configuration

To use Pandino's decorators (`@Component`, `@Service`, `@Reference`, etc.) from the `@pandino/decorators` package, you must enable experimental decorators in your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

> ⚠️ **Important:** Without these settings, decorators will not work and you'll get TypeScript compilation errors.

## Quick Start

```typescript
import { OSGiBootstrap, LogLevel } from '@pandino/pandino';
import type { BundleContext } from '@pandino/pandino';

// 1. Define a service interface
interface GreetingService {
  sayHello(name: string): string;
}

// 2. Create a service implementation
class SimpleGreetingService implements GreetingService {
  sayHello(name: string): string {
    return `Hello, ${name}!`;
  }
}

// 3. Start the framework
async function startApp() {
  const bootstrap = new OSGiBootstrap({
    frameworkLogLevel: LogLevel.INFO
  });
  const framework = await bootstrap.start();
  const context = framework.getBundleContext();

  // 4. Register the service
  const service = new SimpleGreetingService();
  context.registerService<GreetingService>('GreetingService', service);

  // 5. Find and use the service
  const serviceRef = context.getServiceReference<GreetingService>('GreetingService');
  if (serviceRef) {
    const greetingService = context.getService(serviceRef)!;
    console.log(greetingService.sayHello('World')); // "Hello, World!"
  }

  return { bootstrap, context };
}

startApp().catch(console.error);
```

## Core Concepts

### Services vs Service References

| Component | Purpose | Analogy |
|-----------|---------|---------|
| **Service** | The actual object that does the work | The person you want to call |
| **Service Reference** | A pointer/handle to find the service | The phone number in the phone book |

```typescript
// The service - does the actual work
const service = new SimpleGreetingService();

// Register it - puts it in the "phone book"
context.registerService<GreetingService>('GreetingService', service);

// Get a reference - look up the "phone number"
const serviceRef = context.getServiceReference<GreetingService>('GreetingService');

// Get the service - make the "phone call"
const greetingService = context.getService(serviceRef);
```

### Service Configuration

Services carry configuration metadata for powerful discovery:

```typescript
// Register services with rich metadata
context.registerService<DatabaseService>('DatabaseService', new MySQLService(), {
  'db.type': 'mysql',
  'db.host': 'localhost',
  'db.port': 3306,
  'service.ranking': 100
});

// Find services using LDAP filters
const mysqlRefs = context.getServiceReferences<DatabaseService>(
  'DatabaseService',
  '(db.type=mysql)'
);
```

### Bundle System

Bundles are self-contained modules with their own lifecycle:

```typescript
import type { BundleActivator, BundleContext } from '@pandino/pandino';

// Define a service
class DatabaseService {
  connect() { console.log('Database connected'); }
  query(sql: string) { return [{ id: 1, name: 'Test' }]; }
}

// Create a bundle activator
const activator: BundleActivator = {
  serviceRegistration: null,

  async start(context: BundleContext) {
    const dbService = new DatabaseService();
    this.serviceRegistration = context.registerService('DatabaseService', dbService);
    console.log('Database bundle started');
  },

  async stop(context: BundleContext) {
    if (this.serviceRegistration) {
      this.serviceRegistration.unregister();
    }
    console.log('Database bundle stopped');
  }
};

// Export the bundle definition
export default {
  headers: {
    bundleSymbolicName: 'com.example.database',
    bundleVersion: '1.0.0',
    bundleName: 'Database Bundle'
  },
  activator
};
```

### Dynamic Dependencies

> 🚀 Bundle registration order doesn't matter! Dependencies resolve automatically.

```typescript
// This works fine - API bundle can start before Database bundle!
await apiBundle.start();      // ✅ Starts, waits for database service
await databaseBundle.start(); // ✅ API bundle automatically gets database service
```

## Built-in Services

### EventAdmin: Publish-Subscribe Messaging

```typescript
import { EventAdmin, Event } from '@pandino/pandino';
import type { BundleContext } from '@pandino/pandino';

// Get the EventAdmin service
const eventAdminRef = context.getServiceReference<EventAdmin>('EventAdmin');
const eventAdmin = context.getService(eventAdminRef)!;

// Send events
eventAdmin.sendEvent(new Event('user/login', {
  userId: '123',
  username: 'john.doe'
}));

// Register event handler
context.registerService('EventHandler', {
  handleEvent: (event) => {
    console.log(`Received event: ${event.getTopic()}`);
    console.log('Event properties:', event.getPropertyNames());
  }
}, {
  'event.topics': 'user/*',  // Listen to all user events
  'event.filter': '(amount>=100)'  // Only high-value events
});
```

### ConfigAdmin: Dynamic Configuration Management

```typescript
import type { ConfigurationAdmin, ManagedService } from '@pandino/pandino';

// Get the ConfigAdmin service
const configAdmin = context.getService(
  context.getServiceReference<ConfigurationAdmin>('ConfigurationAdmin')
)!;

// Create/update configuration
const config = await configAdmin.getConfiguration('database.connection');
await config.update({
  host: 'localhost',
  port: 5432,
  maxConnections: 20
});

// Create a service that receives configuration updates
class DatabaseService implements ManagedService {
  private host: string = 'localhost';
  private port: number = 5432;
  private maxConnections: number = 10;

  updated(properties: Record<string, any> | null): void {
    if (properties) {
      this.host = properties.host || this.host;
      this.port = properties.port || this.port;
      this.maxConnections = properties.maxConnections || this.maxConnections;
      this.reconnectWithNewSettings();
    }
  }

  private reconnectWithNewSettings(): void {
    console.log(`Reconnecting to ${this.host}:${this.port} with ${this.maxConnections} max connections`);
    // Implementation details...
  }
}

// Register the service with its PID
context.registerService<ManagedService>('ManagedService', new DatabaseService(), {
  'service.pid': 'database.connection'
});
```

### LogService: Centralized Logging

```typescript
import type { LogService, BundleActivator, BundleContext } from '@pandino/pandino';

class WebServerBundleActivator implements BundleActivator {
  private logger: LogService | null = null;

  async start(context: BundleContext): Promise<void> {
    const logServiceRef = context.getServiceReference<LogService>('LogService');
    this.logger = context.getService(logServiceRef)!;

    this.logger.info('Web server starting', undefined, { port: 8080 });
    // Output: [2025-07-28T23:58:10.231Z] [web-server-bundle] INFO: Web server starting {"port":8080}
  }

  async stop(context: BundleContext): Promise<void> {
    if (this.logger) {
      this.logger.info('Web server stopping');
    }
  }
}
```

### ServiceTracker: Simplified Service Discovery

```typescript
import { ServiceTracker } from '@pandino/pandino';
import type { BundleContext, ServiceReference } from '@pandino/pandino';
import type { DatabaseService } from './types';

class ApiService {
  private dbTracker: ServiceTracker<DatabaseService>;

  constructor(private context: BundleContext) {
    this.dbTracker = new ServiceTracker<DatabaseService>(context, 'DatabaseService', {
      addingService: (ref: ServiceReference<DatabaseService>) => {
        const service = context.getService(ref);
        console.log('Database service available');
        return service;
      },
      removedService: (ref: ServiceReference<DatabaseService>, service: DatabaseService) => {
        console.log('Database service removed');
        context.ungetService(ref);
      }
    });
  }

  async start() {
    this.dbTracker.open();
  }

  async stop() {
    this.dbTracker.close();
  }

  getCurrentDatabase(): DatabaseService | null {
    return this.dbTracker.getService();
  }
}
```

## Declarative Services

Eliminate boilerplate with TypeScript decorators from the `@pandino/decorators` package:

```typescript
import { Component, Service, Reference, Activate, Deactivate } from '@pandino/decorators';
import type { ComponentContext } from '@pandino/pandino';

@Component({ name: 'user.service' })
@Service({ interfaces: ['UserService'] })
class UserService {
  private users = new Map<string, User>();

  @Activate
  activate(context: ComponentContext) {
    console.log('User service started');
  }

  @Deactivate
  deactivate(context: ComponentContext) {
    this.users.clear();
  }

  createUser(userData: UserData): User {
    const user = new User(userData);
    this.users.set(user.id, user);
    return user;
  }
}
```

### Dependency Injection

```typescript
import { Component, Service, Reference, Activate } from '@pandino/decorators';
import type { ComponentContext } from '@pandino/pandino';
import type { UserService, PaymentService } from './types';

@Component({ name: 'order.service' })
@Service({ interfaces: ['OrderService'] })
class OrderService {
  @Reference({ interface: 'UserService', bind: 'setUserService' })
  private userService?: UserService;

  @Reference({ interface: 'PaymentService', bind: 'setPaymentService' })
  private paymentService?: PaymentService;

  @Activate
  activate(context: ComponentContext) {
    console.log('Order service activated');
  }

  setUserService(service: UserService) {
    this.userService = service;
  }

  setPaymentService(service: PaymentService) {
    this.paymentService = service;
  }

  async createOrder(userId: string, items: OrderItem[]): Promise<Order> {
    const user = this.userService?.findUser(userId);
    if (!user) throw new Error('User not found');

    const order = new Order(user, items);
    await this.paymentService?.processPayment(order);
    return order;
  }
}
```

### Service Component Runtime (SCR)

SCR automatically detects and registers components from bundle configurations:

```typescript
// bundle.ts - Automatic component registration
export default {
  headers: {
    bundleSymbolicName: 'com.example.services',
    bundleVersion: '1.0.0',
  },
  // Components are automatically registered by SCR
  components: [UserService, OrderService]
};
```

For manual registration, use the SCR service directly:

```typescript
import type { BundleActivator, BundleContext, ServiceComponentRuntime } from '@pandino/pandino';

const activator: BundleActivator = {
  async start(context: BundleContext) {
    // Get SCR service from the service registry
    const scrRef = context.getServiceReference<ServiceComponentRuntime>('ServiceComponentRuntime');
    const scr = context.getService(scrRef)!;
    const bundleId = context.getBundle().getBundleId();

    // Register your components
    await scr.registerComponent(UserService, bundleId);
    await scr.registerComponent(OrderService, bundleId);

    console.log('Components registered with SCR');
  },

  async stop(context: BundleContext) {
    // Cleanup happens automatically when the bundle stops
  }
};
```

## Advanced Features

### LDAP Filtering

| Filter | Matches |
|--------|---------|
| `(db.type=mysql)` | MySQL database services |
| `(service.ranking>=100)` | High-priority services |
| `(&(db.host=localhost)(db.port>=3000))` | Local services on ports 3000+ |
| `(\\|(category=urgent)(priority=1))` | Urgent OR priority 1 services |

### Service Lifecycle Management

```typescript
// Services can be replaced at runtime
const registration1 = context.registerService<CacheService>('CacheService', new RedisCache());
const registration2 = context.registerService<CacheService>('CacheService', new MemoryCache(), {
  'service.ranking': 200  // Higher priority
});

// Clients automatically get the highest-ranked service
const cacheServiceRef = context.getServiceReference<CacheService>('CacheService');
// This will be the MemoryCache instance because it has a higher ranking
const cacheService = context.getService(cacheServiceRef)!;
```

## API Reference

### Core Interfaces

- `BundleContext` - Service registry access and bundle management
- `ServiceReference<T>` - Handle to discover and access services
- `ServiceRegistration<T>` - Handle to manage registered services
- `BundleActivator` - Bundle lifecycle management interface

### Built-in Services

- `EventAdmin` - Event publishing and subscription
- `ConfigurationAdmin` - Dynamic configuration management
- `LogService` - Centralized logging with bundle context
- `ServiceComponentRuntime` - Declarative services management
