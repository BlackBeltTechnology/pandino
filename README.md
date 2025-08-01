# 🎯 Pandino: OSGi-Style Framework for TypeScript

[![npm version](https://badge.fury.io/js/@pandino%2Fpandino.svg)](https://badge.fury.io/js/@pandino%2Fpandino)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-EPL2.0-blue.svg)](LICENSE.txt)

> 🚀 A lightweight TypeScript framework that brings **modular architecture** to your applications. Think of it as a service registry that helps you build loosely-coupled, maintainable applications where different parts can communicate without knowing about each other directly.

## 📋 Table of Contents

- [✨ Features](#-features)
- [📦 Installation](#-installation)
- [🚀 Quick Start](#-quick-start)
- [🔧 Core Concepts](#-core-concepts)
  - [Services vs Service References](#services-vs-service-references)
  - [Service Configuration](#service-configuration)
  - [Bundles: Modular Containers](#bundles-modular-containers)
  - [Bundle Authoring Best Practices](#bundle-authoring-best-practices)
  - [Dynamic Dependencies](#dynamic-dependencies-order-doesnt-matter)
- [📡 Built-in Services](#-built-in-services)
  - [EventAdmin](#eventadmin-publish-subscribe-messaging)
  - [ConfigAdmin](#configadmin-dynamic-configuration-management)
  - [LogService](#logservice-centralized-logging-framework)
  - [ServiceTracker](#servicetracker-simplified-service-discovery)
- [🏗️ Declarative Services](#️-declarative-services-component-based-development)
  - [Basic Component Definition](#basic-component-definition)
  - [Dependency Injection](#dependency-injection-with-references)
  - [Dynamic Service References](#dynamic-service-references)
  - [Configuration Management](#configuration-management)
  - [Factory Components](#factory-components)
  - [Service Component Runtime](#service-component-runtime-scr)
- [🛠️ Advanced Features](#️-advanced-features)
- [⚛️ React Integration](#️-react-integration)
  - [PandinoProvider](#pandinoprovider)
  - [React Hooks](#react-hooks)
- [📚 Examples](#-examples)
- [🤝 Contributing](#-contributing)

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔌 **Service Registry** | Register and discover services dynamically |
| 📦 **Bundle System** | Modular containers with lifecycle management |
| 🔄 **Dynamic Dependencies** | Start bundles in any order - dependencies resolve automatically |
| 📡 **Event System** | Publish-subscribe messaging between bundles |
| ⚙️ **Configuration Management** | Dynamic, centralized configuration updates |
| 📊 **Structured Logging** | Centralized logging with bundle-aware context |
| 🎯 **Service Tracking** | Simplified dependency management with automatic lifecycle handling |
| 🔍 **LDAP Filtering** | Powerful service discovery with LDAP-style filters |

## 📦 Installation

```bash
npm install @pandino/pandino
```

## 🚀 Quick Start

```typescript
import { OSGiBootstrap, LogLevel } from '@pandino/pandino';

// 1. Start the framework
const bootstrap = new OSGiBootstrap({
  frameworkLogLevel: LogLevel.INFO
});
const framework = await bootstrap.start();
const context = framework.getBundleContext();

// 2. Define a service interface
interface GreetingService {
  sayHello(name: string): string;
}

// 3. Implement the service
class SimpleGreetingService implements GreetingService {
  sayHello(name: string): string {
    return `Hello, ${name}!`;
  }
}

// 4. Register the service
const service = new SimpleGreetingService();
context.registerService('GreetingService', service);

// 5. Find and use the service
const serviceRef = context.getServiceReference<GreetingService>('GreetingService');
const greetingService = context.getService(serviceRef)!;

console.log(greetingService.sayHello('World')); // "Hello, World!"

// 6. Clean shutdown
await bootstrap.stop();
```

> 🎉 **That's it!** You've just created a service-oriented application where the greeting functionality is completely decoupled from the code that uses it.

## 🔧 Core Concepts

### Services vs Service References

| Component | Purpose | Analogy |
|-----------|---------|---------|
| **Service** | The actual object that does the work | The person you want to call |
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

Unlike most DI frameworks, Pandino services carry **configuration metadata** for powerful discovery:

```typescript
// Register services with rich metadata
context.registerService('DatabaseService', new MySQLService(), {
  'db.type': 'mysql',
  'db.host': 'localhost',
  'db.port': 3306,
  'service.ranking': 100,
  'connection.pool.size': 20
});

context.registerService('DatabaseService', new PostgreSQLService(), {
  'db.type': 'postgresql',
  'db.host': 'localhost',
  'db.port': 5432,
  'service.ranking': 50
});

// Find services using LDAP filters
const mysqlRefs = context.getServiceReferences<DatabaseService>(
  'DatabaseService',
  '(db.type=mysql)'
);
const highPriorityRefs = context.getServiceReferences<DatabaseService>(
  'DatabaseService',
  '(service.ranking>=100)'
);
```

**Benefits:**
- ✅ Select services by capabilities
- ✅ Implement feature flags
- ✅ Handle multiple environments
- ✅ Automatic service ranking

### Bundles: Modular Containers

Bundles are self-contained modules with their own lifecycle:

```typescript
// database-bundle.ts
import type { BundleActivator, BundleContext } from '@pandino/pandino';

class DatabaseService {
  connect() { console.log('Database connected'); }
  query(sql: string) { return [{ id: 1, name: 'Test' }]; }
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
      this.serviceRegistration = null;
    }
    console.log('Database bundle stopped');
  }
};

export default {
  headers: {
    bundleSymbolicName: 'com.example.database',
    bundleVersion: '1.0.0',
    bundleName: 'Database Bundle',
    bundleDescription: 'Provides database services'
  },
  activator
};
```

### Bundle Authoring Best Practices

**Recommended Approach: Environment Variables**

Use your bundler's environment variable abstraction to inject package metadata at build time:

```typescript
// vite.config.ts (Vite example)
import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';

const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));

export default defineConfig({
  define: {
    'import.meta.env.VITE_BUNDLE_NAME': JSON.stringify(packageJson.name),
    'import.meta.env.VITE_BUNDLE_VERSION': JSON.stringify(packageJson.version),
  },
});

// Create type-safe environment variables
// src/vite-env.d.ts
interface ImportMetaEnv {
  readonly VITE_BUNDLE_NAME: string;
  readonly VITE_BUNDLE_VERSION: string;
}
```

```typescript
// my-service-bundle.ts
export default {
  headers: {
    bundleSymbolicName: import.meta.env.VITE_BUNDLE_NAME,
    bundleVersion: import.meta.env.VITE_BUNDLE_VERSION,
    bundleName: 'My Service Bundle',
    bundleDescription: 'Provides core application services'
  },
  activator
};
```

**Other Bundlers:**
- **Webpack:** `process.env.npm_package_name`, `process.env.npm_package_version`
- **Rollup:** Use `@rollup/plugin-replace` with package.json values
- **esbuild:** Use `--define` flags or environment variables

**Benefits:**
- ✅ Single source of truth in package.json
- ✅ Automatic version updates
- ✅ Type-safe bundle metadata
- ✅ Build-time optimization (no runtime lookups)

### Dynamic Dependencies: Order Doesn't Matter

> 🚀 **Key Feature:** Bundle registration order doesn't matter! Dependencies resolve automatically.

```typescript
// This works fine - API bundle can start before Database bundle!
await apiBundle.start();      // ✅ Starts, but database service not available yet
await databaseBundle.start(); // ✅ Database service becomes available
// 🎯 API bundle automatically discovers and uses the database service
```

## 📡 Built-in Services

### EventAdmin: Publish-Subscribe Messaging

**Publishing Events:**
```typescript
import { EventAdmin, Event } from '@pandino/pandino';

const eventAdminRef = context.getServiceReference<EventAdmin>('EventAdmin');
const eventAdmin = context.getService(eventAdminRef)!;

// Send events
eventAdmin.sendEvent(new Event('user/login', {
  userId: '123',
  username: 'john.doe',
  timestamp: Date.now()
}));
```

**Listening for Events:**
```typescript
// Register event handler
context.registerService('EventHandler', new UserEventHandler(), {
  'event.topics': 'user/*',  // Listen to all user events
  'event.filter': '(amount>=100)'  // Only high-value events
});
```

**Topic Patterns:**
| Pattern | Matches |
|---------|---------|
| `user/*` | All user events (login, logout, etc.) |
| `order/created` | Specific event only |
| `*/error` | Error events from any module |

### ConfigAdmin: Dynamic Configuration Management

**Managing Configurations:**
```typescript
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
```

**Receiving Configuration Updates:**
```typescript
import type { ManagedService } from '@pandino/pandino';

class DatabaseService implements ManagedService {
  updated(properties: Record<string, any> | null): void {
    if (properties) {
      this.reconnectWithNewSettings(properties);
    } else {
      this.useDefaultSettings();
    }
  }
}

// Link service to configuration
context.registerService('DatabaseService', new DatabaseService(), {
  'service.pid': 'database.connection'
});
```

### LogService: Centralized Logging Framework

```typescript
class WebServerBundleActivator implements BundleActivator {
  private logger: LogService;

  async start(context: BundleContext): Promise<void> {
    // Get bundle-aware logger - automatically includes bundle metadata
    const logServiceRef = context.getServiceReference<LogService>('LogService');
    this.logger = context.getService(logServiceRef)!;

    this.logger.setLogLevel(LogLevel.INFO);

    // Bundle identification is automatic - no manual tagging needed
    this.logger.info('Web server starting', undefined, { port: 8080 });
    // Output: [2025-07-28T23:58:10.231Z] [web-server-bundle] INFO: Web server starting {"port":8080}
  }

  private handleRequest(req: Request): void {
    this.logger.debug('Processing request', undefined, { method: req.method, url: req.url });
    // Output: [2025-07-28T23:58:10.231Z] [web-server-bundle] DEBUG: Processing request {"method":"GET","url":"/api/users"}
  }
}
```

**Key Features:**
- Bundle names in logs (`[web-server-bundle]`) come from the `installBundle()` parameter
- Structured context data as JSON
- Automatic exception handling
- Configurable log levels per bundle

### ServiceTracker: Simplified Service Discovery

ServiceTracker eliminates boilerplate for dynamic service dependencies:

```typescript
import { ServiceTracker } from '@pandino/pandino';

class ApiService {
  private dbTracker: ServiceTracker<DatabaseService>;

  constructor(context: BundleContext) {
    // Track database services automatically
    this.dbTracker = new ServiceTracker(context, 'DatabaseService', {
      addingService: (ref: ServiceReference<DatabaseService>) => {
        const service = context.getService(ref);
        console.log('Database service available');
        return service;
      },
      removedService: (ref: ServiceReference<DatabaseService>, service: DatabaseService) => {
        console.log('Database service removed - switching to fallback');
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

**Benefits:**
- ✅ Automatic service lifecycle management
- ✅ Built-in service ranking support
- ✅ Clean resource cleanup
- ✅ No manual ServiceListener boilerplate

## 🛠️ Advanced Features

**LDAP Filtering Examples:**

| Filter | Matches |
|--------|---------|
| `(db.type=mysql)` | MySQL database services |
| `(service.ranking>=100)` | High-priority services |
| `(&(db.host=localhost)(db.port>=3000))` | Local services on ports 3000+ |
| `(\|(category=urgent)(priority=1))` | Urgent OR priority 1 services |

**Service Lifecycle Management:**

```typescript
// Services can be replaced at runtime
const registration1 = context.registerService('CacheService', new RedisCache());
const registration2 = context.registerService('CacheService', new MemoryCache(), {
  'service.ranking': 200  // Higher priority
});

// Clients automatically get the highest-ranked service
// When registration2 is unregistered, clients fall back to registration1
```

## 🏗️ Declarative Services: Component-Based Development

> 🚀 **Eliminate boilerplate code** with TypeScript decorators! Transform complex BundleActivator classes into simple decorated components where the framework handles all the service registration and dependency wiring automatically.

**What this solves:** Manual service management requires significant boilerplate code - registering services, tracking dependencies, handling lifecycle events, and managing service references. DS reduces a 50-line BundleActivator to a simple decorated class.

### Basic Component Definition

```typescript
import { Component, Service, Activate, Deactivate } from '@pandino/pandino';

// Before: Complex BundleActivator with manual service registration
// After: Simple component with automatic service registration
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
    console.log('User service stopped');
    this.users.clear();
  }

  createUser(userData: UserData): User {
    const user = new User(userData);
    this.users.set(user.id, user);
    return user;
  }

  findUser(id: string): User | null {
    return this.users.get(id) || null;
  }
}
```

**Benefits:**
- ✅ No manual service registration
- ✅ Automatic lifecycle management
- ✅ Clean, declarative syntax
- ✅ Reduced boilerplate code

### Dependency Injection with References

```typescript
@Component({ name: 'order.service' })
@Service({ interfaces: ['OrderService'] })
class OrderService {
  private orders: Order[] = [];

  // Automatic dependency injection - no ServiceTracker needed
  @Reference({ interface: 'UserService', bind: 'setUserService' })
  private userService?: UserService;

  @Reference({ interface: 'PaymentService', bind: 'setPaymentService' })
  private paymentService?: PaymentService;

  @Reference({
    interface: 'LogService',
    cardinality: '0..1',  // Optional dependency
    bind: 'setLogger'
  })
  private logger?: LogService;

  @Activate
  activate() {
    this.logger?.info('Order service activated');
  }

  setUserService(service: UserService) {
    this.userService = service;
    this.logger?.info('User service bound');
  }

  setPaymentService(service: PaymentService) {
    this.paymentService = service;
    this.logger?.info('Payment service bound');
  }

  setLogger(service: LogService) {
    this.logger = service;
  }

  async createOrder(userId: string, items: OrderItem[]): Promise<Order> {
    const user = this.userService?.findUser(userId);
    if (!user) throw new Error('User not found');

    const order = new Order(user, items);
    await this.paymentService?.processPayment(order);

    this.orders.push(order);
    this.logger?.info(`Order created: ${order.id}`);
    return order;
  }
}
```

**Cardinality Options:**
| Cardinality | Meaning | Component Activation |
|-------------|---------|---------------------|
| `1..1` | Exactly one service required | Waits for service |
| `0..1` | At most one service (optional) | Activates immediately |
| `1..n` | One or more services required | Waits for at least one |
| `0..n` | Zero or more services | Activates immediately |

### Dynamic Service References

```typescript
@Component({ name: 'api.gateway' })
@Service({ interfaces: ['ApiGateway'] })
class ApiGateway {
  private backends: BackendService[] = [];

  // Multiple dynamic services with automatic lifecycle management
  @Reference({
    interface: 'BackendService',
    cardinality: '0..n',     // Zero to many services
    policy: 'dynamic',       // Services can change at runtime
    policyOption: 'greedy',  // Use all available services
    bind: 'addBackend',
    unbind: 'removeBackend'
  })
  private backendServices?: BackendService[];

  addBackend(service: BackendService) {
    this.backends.push(service);
    console.log(`Backend added: ${service.getName()}`);
  }

  removeBackend(service: BackendService) {
    const index = this.backends.indexOf(service);
    if (index > -1) {
      this.backends.splice(index, 1);
      console.log(`Backend removed: ${service.getName()}`);
    }
  }

  async handleRequest(request: Request): Promise<Response> {
    // Load balance across all available backends
    if (this.backends.length === 0) {
      return new Response('No backends available', { status: 503 });
    }

    const backend = this.backends[Math.floor(Math.random() * this.backends.length)];
    return backend.processRequest(request);
  }
}
```

**Policy Options:**
| Policy | Description |
|--------|-------------|
| `static` | Services bound at activation, don't change |
| `dynamic` | Services can be added/removed at runtime |

### Configuration Management

```typescript
@Component({
  name: 'cache.service',
  configurationPid: 'cache.config'  // Links to ConfigAdmin
})
@Service({ interfaces: ['CacheService'] })
@Property('service.ranking', 100)
class CacheService {
  private maxSize = 1000;
  private ttl = 300000; // 5 minutes
  private cache = new Map();

  @Modified  // Called when configuration changes
  configUpdated(config: Record<string, any>) {
    this.maxSize = config.maxSize || 1000;
    this.ttl = config.ttl || 300000;
    console.log(`Cache reconfigured: maxSize=${this.maxSize}, ttl=${this.ttl}`);

    // Apply new configuration
    if (this.cache.size > this.maxSize) {
      this.evictOldestEntries();
    }
  }

  set(key: string, value: any): void {
    this.cache.set(key, { value, timestamp: Date.now() });
    if (this.cache.size > this.maxSize) {
      this.evictOldestEntries();
    }
  }

  get(key: string): any {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }
}
```

**Configuration Policies:**
| Policy | Behavior |
|--------|----------|
| `optional` | Component activates with or without configuration |
| `require` | Component waits for configuration before activating |
| `ignore` | Component ignores configuration updates |

### Factory Components

```typescript
@Component({ name: 'database.connection' })
@Factory('database.connection.factory')
class DatabaseConnection {
  private connection?: Connection;

  constructor(private config: DatabaseConfig) {}

  @Activate
  async activate() {
    this.connection = await createConnection({
      host: this.config.host,
      port: this.config.port,
      database: this.config.database,
      credentials: this.config.credentials
    });
    console.log(`Connected to ${this.config.host}:${this.config.port}`);
  }

  @Deactivate
  async deactivate() {
    await this.connection?.close();
    console.log('Database connection closed');
  }

  async query(sql: string): Promise<any[]> {
    return this.connection?.query(sql) || [];
  }
}

// Create multiple database connections
const primaryDb = await scr.createFactoryInstance('database.connection.factory', 'primary', {
  host: 'primary.db.com',
  port: 5432,
  database: 'main'
});

const analyticsDb = await scr.createFactoryInstance('database.connection.factory', 'analytics', {
  host: 'analytics.db.com',
  port: 5432,
  database: 'analytics'
});
```

**Use Cases:**
- ✅ Multiple database connections
- ✅ Different environment configurations
- ✅ Feature toggles and A/B testing
- ✅ Multi-tenant applications

### Service Component Runtime (SCR)

**Option 1: Access SCR as a Service (Recommended)**

Bundles can access the ServiceComponentRuntime as a registered service, eliminating the need to instantiate it manually:

```typescript
import type { BundleActivator, BundleContext, ServiceComponentRuntime } from '@pandino/pandino';

const activator: BundleActivator = {
  async start(context: BundleContext) {
    // Get SCR service from the service registry
    const scrRef = context.getServiceReference<ServiceComponentRuntime>('ServiceComponentRuntime');
    const scr = context.getService(scrRef)!;

    // Register your components using the SCR service
    await scr.registerComponent(UserService);
    await scr.registerComponent(OrderService);
    await scr.registerComponent(ApiGateway);

    // Immediate components activate automatically when ready
    console.log('Components registered with SCR');
  },

  async stop(context: BundleContext) {
    // SCR automatically handles component cleanup when bundle stops
  }
};
```

**Option 2: Manual SCR Instantiation (Advanced)**

For advanced use cases, you can still create your own ServiceComponentRuntime instance:

```typescript
import { ServiceComponentRuntime } from '@pandino/pandino';

// Initialize SCR manually (not recommended for most use cases)
const scr = new ServiceComponentRuntime(framework, bundleContext);

// Register components - immediate components activate automatically when their dependencies are ready
await scr.registerComponent(UserService);
await scr.registerComponent(OrderService);
await scr.registerComponent(ApiGateway);

// Manual activation for non-immediate components
await scr.activateComponent('user.service');

// Components automatically wire together based on @Reference decorators
// No manual service registration or ServiceTracker management needed
```

**Bundle-based Component Discovery**

Components must be explicitly registered with the ServiceComponentRuntime:

```typescript
const activator: BundleActivator = {
  async start(context: BundleContext) {
    const scrRef = context.getServiceReference<ServiceComponentRuntime>('ServiceComponentRuntime');
    const scr = context.getService(scrRef)!;

    // Explicitly register components - no automatic discovery
    await scr.registerComponent(UserService);
    await scr.registerComponent(OrderService);
    await scr.registerComponent(ApiGateway);

    // All immediate components will activate when their dependencies are satisfied
    console.log('Components registered with SCR');
  },

  async stop(context: BundleContext) {
    // SCR automatically handles component cleanup when bundle stops
  }
};
```

**Immediate Component Activation Rules:**

Components marked with `immediate: true` follow OSGi SCR specification and only activate when **all requirements are satisfied**:

```typescript
@Component({
  name: 'database.service',
  immediate: true  // Activates automatically when dependencies are ready
})
@Service({ interfaces: ['DatabaseService'] })
class DatabaseService {
  // This component will NOT activate until ConfigService is available
  @Reference({
    interface: 'ConfigService',
    cardinality: '1..1',  // Mandatory dependency
    bind: 'setConfig'
  })
  private config?: ConfigService;

  @Activate
  activate() {
    console.log('Database service started with config');
  }

  setConfig(configService: ConfigService) {
    this.config = configService;
  }
}
```

**Key OSGi SCR Rules:**
- ✅ **Mandatory references must be satisfied** - Components with `1..1` or `1..n` cardinality won't activate until services are available
- ✅ **Optional references can be missing** - Components with `0..1` or `0..n` cardinality activate regardless
- ✅ **Configuration policies respected** - Components with `configurationPolicy: 'require'` wait for configuration
- ✅ **Dynamic activation** - Components automatically activate when dependencies become available later
- ✅ **Order independence** - Registration order doesn't matter; dependencies resolve dynamically

**Benefits of Using SCR as a Service:**
- ✅ No need to manually instantiate ServiceComponentRuntime
- ✅ Centralized component management across all bundles
- ✅ Automatic cleanup when bundles stop
- ✅ Follows OSGi best practices

## ⚛️ React Integration

Get started with React in seconds using `@pandino/react-hooks`:

```bash
npm install @pandino/react-hooks
```

### PandinoProvider

Wrap your React application to initialize Pandino with your bundles:

```tsx
import { createRoot } from 'react-dom/client';
import { LogLevel } from '@pandino/pandino';
import { PandinoProvider } from '@pandino/react-hooks';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <PandinoProvider
    bootstrapConfig={{ frameworkLogLevel: LogLevel.INFO }}
    bundles={[
      import('./bundles/greeting-service-bundle'),
      import('./bundles/user-service-bundle'),
    ]}
  >
    <App />
  </PandinoProvider>
);
```

### React Integration

Bundles used with React integration require explicit component registration:

```tsx
import { PandinoProvider } from '@pandino/react-hooks';

// Components in bundles must be explicitly registered via bundle activators
<PandinoProvider
  bundles={[
    import('./bundles/user-services-bundle'),     // ✅ Components registered via bundle activator
    import('./bundles/order-services-bundle'),    // ✅ Components registered via bundle activator
    import('./bundles/payment-services-bundle'),  // ✅ Components registered via bundle activator
  ]}
>
  <App />
</PandinoProvider>
```

### React Hooks

**useService** - Get a service instance with loading and error states:
```tsx
import { useService } from '@pandino/react-hooks';

function Greeting({ name }: { name: string }) {
  const { service: greetingService, loading, error } = useService<GreetingService>('GreetingService');

  if (loading) return <div>Loading service...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!greetingService) return <div>Service not available</div>;

  return <div>{greetingService.sayHello(name)}</div>;
}
```

**useService with LDAP filter** - Filter services by properties:
```tsx
function ThemeSelector() {
  const { service: darkTheme, loading, error } = useService<ThemeService>(
    'ThemeService',
    '(theme.mode=dark)'
  );

  if (loading) return <div>Loading theme...</div>;
  if (!darkTheme) return <div>Dark theme not available</div>;

  return (
    <div style={{ backgroundColor: darkTheme.getBackgroundColor() }}>
      Dark theme active: {darkTheme.getName()}
    </div>
  );
}
```

**useServiceTracker** - Track multiple services dynamically:
```tsx
import { useServiceTracker } from '@pandino/react-hooks';

function WidgetDashboard() {
  const { services: widgets, loading, error } = useServiceTracker<Widget>('Widget');

  if (loading) return <div>Loading widgets...</div>;
  if (error) return <div>Error loading widgets: {error.message}</div>;

  return (
    <div className="dashboard">
      <h3>Dashboard Widgets ({widgets.length})</h3>
      <div className="widget-grid">
        {widgets.map((widget, index) => (
          <div key={index} className="widget-card">
            <h4>{widget.getTitle()}</h4>
            <div>{widget.render()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**useServiceTracker with filter** - Track filtered services:
```tsx
function PremiumFeatures() {
  const { services, loading } = useServiceTracker<Feature>(
    'Feature',
    '(feature.tier=premium)'
  );

  return (
    <div>
      <h3>Premium Features ({services.length})</h3>
      {services.map((feature, index) => (
        <button
          key={index}
          className="premium-feature"
          onClick={() => feature.activate()}
        >
          {feature.getName()} - {feature.getDescription()}
        </button>
      ))}
    </div>
  );
}
```

**useRegisterService** - Register services from React components:
```tsx
import { useRegisterService } from '@pandino/react-hooks';

function UserPreferencesProvider() {
  const userPrefs = useMemo(() => new UserPreferencesService(), []);

  const { registration, isRegistered, error, updateProperties } = useRegisterService(
    'UserPreferencesService',
    userPrefs,
    { 'service.scope': 'user', 'service.priority': 100 }
  );

  const handleUpdatePreferences = () => {
    updateProperties({
      'service.priority': 200,
      'last.updated': Date.now(),
      'preferences.count': userPrefs.getPreferenceCount()
    });
  };

  if (error) return <div>Preferences service error: {error.message}</div>;

  return (
    <div>
      <p>User preferences {isRegistered ? 'available' : 'loading...'}</p>
      <button onClick={handleUpdatePreferences}>Update Preferences Metadata</button>
    </div>
  );
}
```

**useBundle** - Access bundle information:
```tsx
import { useBundle } from '@pandino/react-hooks';

function FeatureBundleStatus({ featureName }: { featureName: string }) {
  const { bundle, loading, error } = useBundle(`com.myapp.${featureName}`);

  if (loading) return <div>Loading {featureName} feature...</div>;
  if {error} return <div>Error: {error.message}</div>;
  if (!bundle) return <div>Feature bundle not found</div>;

  return (
    <div className="feature-status">
      <h4>{bundle.getSymbolicName()}</h4>
      <p>Version: {bundle.getVersion()}</p>
      <p>Status: {bundle.getState() === 32 ? 'Active' : 'Inactive'}</p>
    </div>
  );
}
```

**usePandinoContext** - Access framework directly:
```tsx
import { usePandinoContext } from '@pandino/react-hooks';

function AppHealthMonitor() {
  const { framework, bundleContext, isInitialized, error } = usePandinoContext();

  if (error) return <div>App initialization error: {error.message}</div>;
  if (!isInitialized) return <div>Starting application...</div>;

  const activeBundles = framework?.getBundles().filter(b => b.getState() === 32).length || 0;
  const totalBundles = framework?.getBundles().length || 0;

  return (
    <div className="app-status">
      <p>🚀 Application ready with {activeBundles}/{totalBundles} active features</p>
      <p>Service registry available: {bundleContext ? '✅' : '❌'}</p>
    </div>
  );
}
```

### React Components

**ServiceConsumer** - Render prop component for service consumption:
```tsx
import { ServiceConsumer } from '@pandino/react-hooks';

function NotificationCenter() {
  return (
    <ServiceConsumer<NotificationService> serviceClass="NotificationService">
      {({ service, loading, error }) => {
        if (loading) return <div>Loading notifications...</div>;
        if (error) return <div>Error: {error.message}</div>;
        if (!service) return <div>Notification service unavailable</div>;

        return (
          <div className="notification-center">
            <h3>Notification Center</h3>
            <p>Unread notifications: {service.getUnreadCount()}</p>
            <button onClick={() => service.showNotification('Hello from Pandino!')}>
              Send Test Notification
            </button>
            <div className="notifications">
              {service.getRecentNotifications().map((notif, index) => (
                <div key={index} className="notification-item">
                  {notif.message}
                </div>
              ))}
            </div>
          </div>
        );
      }}
    </ServiceConsumer>
  );
}
```

**ServiceConsumer with filter**:
```tsx
<ServiceConsumer<AnalyticsService>
  serviceClass="AnalyticsService"
  filter="(analytics.provider=google)"
>
  {({ service, loading, error }) => {
    if (loading) return <div>Loading Google Analytics...</div>;
    if (!service) return <div>Google Analytics not available</div>;

    return (
      <div className="analytics-panel">
        Analytics Provider: {service.getProviderName()}
        <button onClick={() => service.trackEvent('button_click', { component: 'analytics-panel' })}>
          Track Event
        </button>
      </div>
    );
  }}
</ServiceConsumer>
```

**BundleInfo** - Display bundle information:
```tsx
import { BundleInfo } from '@pandino/react-hooks';

// Default bundle info display
function CoreSystemInfo() {
  return <BundleInfo bundleIdOrName="system.core-services" />;
}

// Custom bundle info renderer for feature modules
function FeatureModuleInfo() {
  return (
    <BundleInfo bundleIdOrName="com.myapp.user-dashboard">
      {({ bundle, loading, error, stateToString }) => {
        if (loading) return <div>Loading feature info...</div>;
        if {error} return <div>Error: {error.message}</div>;
        if (!bundle) return <div>Feature not installed</div>;

        const isActive = bundle.getState() === 32;

        return (
          <div className={`feature-info ${isActive ? 'active' : 'inactive'}`}>
            <h2>📦 {bundle.getSymbolicName()}</h2>
            <div className={`status-badge ${stateToString(bundle.getState()).toLowerCase()}`}>
              {isActive ? '🟢' : '🔴'} {stateToString(bundle.getState())}
            </div>
            <div className="feature-details">
              <span>Version: {bundle.getVersion()}</span>
              <span>Location: {bundle.getLocation()}</span>
            </div>
          </div>
        );
      }}
    </BundleInfo>
  );
}
```

## License

Eclipse Public License - v 2.0
