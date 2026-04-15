# @pandino/pandino

[![npm version](https://badge.fury.io/js/@pandino%2Fpandino.svg)](https://badge.fury.io/js/@pandino%2Fpandino)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-EPL2.0-blue.svg)](LICENSE.txt)

Core TypeScript framework providing service registry, bundle system, and built-in services for modular applications.

## 📦 Installation

```bash
npm install @pandino/pandino
```

## ⚙️ TypeScript Configuration

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
>
> For more information about available decorators, see the [decorators package documentation](../decorators/README.md).

## Quick Start

```typescript
import { OSGiBootstrap, LogLevel } from '@pandino/pandino';

// 1. Start the framework
const bootstrap = new OSGiBootstrap({
  frameworkLogLevel: LogLevel.INFO,
});
const framework = await bootstrap.start();
const context = framework.getBundleContext();

// 2. Define and register a service
interface GreetingService {
  sayHello(name: string): string;
}

class SimpleGreetingService implements GreetingService {
  sayHello(name: string): string {
    return `Hello, ${name}!`;
  }
}

const service = new SimpleGreetingService();
context.registerService('GreetingService', service);

// 3. Find and use the service
const serviceRef = context.getServiceReference<GreetingService>('GreetingService');
const greetingService = context.getService(serviceRef)!;

console.log(greetingService.sayHello('World')); // "Hello, World!"

// 4. Clean shutdown
await bootstrap.stop();
```

## Core Concepts

### Services vs Service References

| Component             | Purpose                              | Analogy                            |
| --------------------- | ------------------------------------ | ---------------------------------- |
| **Service**           | The actual object that does the work | The person you want to call        |
| **Service Reference** | A pointer/handle to find the service | The phone number in the phone book |

```typescript
// The service - does the actual work
const service = new SimpleGreetingService();

// Register it - puts it in the "phone book"
context.registerService('GreetingService', service);

// Get a reference - look up the "phone number"
const serviceRef = context.getServiceReference<GreetingService>('GreetingService');

// Get the service - make the "phone call"
const greetingService = context.getService(serviceRef);
```

### Service Configuration

Services carry configuration metadata for powerful discovery:

```typescript
// Register services with rich metadata
context.registerService('DatabaseService', new MySQLService(), {
  'db.type': 'mysql',
  'db.host': 'localhost',
  'db.port': 3306,
  'service.ranking': 100,
});

// Find services using LDAP filters
const mysqlRefs = context.getServiceReferences<DatabaseService>('DatabaseService', '(db.type=mysql)');
```

### Bundle System

Bundles are self-contained modules with their own lifecycle:

```typescript
// database-bundle.ts
import type { BundleActivator, BundleContext } from '@pandino/pandino';

class DatabaseService {
  connect() {
    console.log('Database connected');
  }
  query(sql: string) {
    return [{ id: 1, name: 'Test' }];
  }
}

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
  },
};

export default {
  headers: {
    bundleSymbolicName: 'com.example.database',
    bundleVersion: '1.0.0',
    bundleName: 'Database Bundle',
  },
  activator,
};
```

### Fragment Bundles

Fragments are special bundles that attach to a host bundle and contribute their resources directly to the host:

```typescript
// localization-fragment.ts
import GermanTranslations from './translations/de.json';

export default {
  headers: {
    bundleSymbolicName: 'com.example.database.german',
    bundleVersion: '1.0.0',
    // Specify the host bundle this fragment attaches to
    fragmentHost: 'com.example.database',
  },
  // Activator is ignored for fragments
  activator: {
    start: async () => {},
    stop: async () => {},
  },
  // Components will be merged with the host's components
  components: [{ name: 'GermanTranslations', translations: GermanTranslations }],
};
```

Fragments are useful for:

- **Localization**: Adding language packs to a host bundle
- **Platform-specific code**: Providing different implementations for different environments
- **Adding components**: Extending a bundle with new services without modifying its code
- **Theming**: Applying different visual styles to UI components

For more details, see the [Fragment Pattern Documentation](../../docs/fragment-pattern.md).

### Dynamic Dependencies

> 🚀 Bundle registration order doesn't matter! Dependencies resolve automatically.

```typescript
// This works fine - API bundle can start before Database bundle!
await apiBundle.start(); // ✅ Starts, waits for database service
await databaseBundle.start(); // ✅ API bundle automatically gets database service
```

## Built-in Services

### EventAdmin: Publish-Subscribe Messaging

```typescript
import { EventAdmin, Event } from '@pandino/pandino';

const eventAdminRef = context.getServiceReference<EventAdmin>('EventAdmin');
const eventAdmin = context.getService(eventAdminRef)!;

// Send events
eventAdmin.sendEvent(
  new Event('user/login', {
    userId: '123',
    username: 'john.doe',
  }),
);

// Register event handler
context.registerService('EventHandler', new UserEventHandler(), {
  'event.topics': 'user/*', // Listen to all user events
  'event.filter': '(amount>=100)', // Only high-value events
});
```

### ConfigAdmin: Dynamic Configuration Management

```typescript
const configAdmin = context.getService(context.getServiceReference<ConfigurationAdmin>('ConfigurationAdmin'))!;

// Create/update configuration
const config = await configAdmin.getConfiguration('database.connection');
await config.update({
  host: 'localhost',
  port: 5432,
  maxConnections: 20,
});

// Receive configuration updates
class DatabaseService implements ManagedService {
  updated(properties: Record<string, any> | null): void {
    if (properties) {
      this.reconnectWithNewSettings(properties);
    }
  }
}

context.registerService('DatabaseService', new DatabaseService(), {
  'service.pid': 'database.connection',
});
```

### LogService: Centralized Logging

```typescript
class WebServerBundleActivator implements BundleActivator {
  private logger: LogService;

  async start(context: BundleContext): Promise<void> {
    const logServiceRef = context.getServiceReference<LogService>('LogService');
    this.logger = context.getService(logServiceRef)!;

    this.logger.info('Web server starting', undefined, { port: 8080 });
    // Output: [2025-07-28T23:58:10.231Z] [web-server-bundle] INFO: Web server starting {"port":8080}
  }
}
```

### ServiceTracker: Simplified Service Discovery

```typescript
import { ServiceTracker } from '@pandino/pandino';

class ApiService {
  private dbTracker: ServiceTracker<DatabaseService>;

  constructor(context: BundleContext) {
    this.dbTracker = new ServiceTracker(context, 'DatabaseService', {
      addingService: (ref) => {
        const service = context.getService(ref);
        console.log('Database service available');
        return service;
      },
      removedService: (ref, service) => {
        console.log('Database service removed');
        context.ungetService(ref);
      },
    });
  }

  async start() {
    this.dbTracker.open();
  }

  getCurrentDatabase(): DatabaseService | null {
    return this.dbTracker.getService();
  }
}
```

## Declarative Services

Eliminate boilerplate with TypeScript decorators:

> **Note:** Decorators have been moved to a dedicated package `@pandino/decorators`. See the [decorators package documentation](../decorators/README.md) for installation and available decorators.

### Reflection Helpers

Pandino provides a comprehensive API to retrieve decorator data from components. The main function `getDecoratorInfo()` returns a complete structured
representation of all decorator information:

```typescript
import { Component, Service, Reference } from '@pandino/decorators';
import { getDecoratorInfo } from '@pandino/pandino';

@Component({
  name: 'example.component',
  immediate: true,
  configurationPid: 'example.config',
})
@Service({ interfaces: ['ExampleService'] })
class ExampleComponent {
  @Reference({ interface: 'LogService' })
  private logger?: any;
}

// Get ALL decorator information in a single call
const info = getDecoratorInfo(ExampleComponent);
```

#### Complete Decorator Information Structure

The `getDecoratorInfo()` function returns a comprehensive `DecoratorInfo` object.

### Basic Component Definition

```typescript
import { Component, Service, Activate, Deactivate } from '@pandino/decorators';

@Component({ name: 'user.service' })
@Service({ interfaces: ['UserService'] })
class UserService {
  private users = new Map<string, User>();

  @Activate
  activate() {
    console.log('User service started');
  }

  @Deactivate
  deactivate() {
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
@Component({ name: 'order.service' })
@Service({ interfaces: ['OrderService'] })
class OrderService {
  @Reference({ interface: 'UserService', bind: 'setUserService' })
  private userService?: UserService;

  @Reference({ interface: 'PaymentService', bind: 'setPaymentService' })
  private paymentService?: PaymentService;

  setUserService(service: UserService) {
    this.userService = service;
  }

  setPaymentService(service: PaymentService) {
    this.paymentService = service;
  }

  async createOrder(userId: string, items: OrderItem[]): Promise<Order> {
    const user = this.userService?.findUser(userId);
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
  components: [UserService, OrderService],
};
```

SCR acts as an extender for Pandino, tracking bundle lifecycle and managing registered components accordingly. When a bundle's state changes (resolved, active,
stopping, uninstalled), SCR automatically handles component registration, deactivation, and removal.

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
};
```

## Advanced Features

### LDAP Filtering

| Filter                                  | Matches                       |
| --------------------------------------- | ----------------------------- |
| `(db.type=mysql)`                       | MySQL database services       |
| `(service.ranking>=100)`                | High-priority services        |
| `(&(db.host=localhost)(db.port>=3000))` | Local services on ports 3000+ |
| `(\|(category=urgent)(priority=1))`     | Urgent OR priority 1 services |

### Service Lifecycle Management

```typescript
// Services can be replaced at runtime
const registration1 = context.registerService('CacheService', new RedisCache());
const registration2 = context.registerService('CacheService', new MemoryCache(), {
  'service.ranking': 200, // Higher priority
});

// Clients automatically get the highest-ranked service
```

### Bundle Best Practices

Use environment variables for bundle metadata:

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';

const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));

export default defineConfig({
  define: {
    'import.meta.env.VITE_BUNDLE_NAME': JSON.stringify(packageJson.name),
    'import.meta.env.VITE_BUNDLE_VERSION': JSON.stringify(packageJson.version),
  },
});

// bundle.ts
export default {
  headers: {
    bundleSymbolicName: import.meta.env.VITE_BUNDLE_NAME,
    bundleVersion: import.meta.env.VITE_BUNDLE_VERSION,
    bundleName: 'My Service Bundle',
  },
  activator,
};
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

## License

Eclipse Public License - v 2.0
