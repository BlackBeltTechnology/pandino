---
title: Core Framework Guide
description: Complete guide to @pandino/pandino - the core runtime with service registry, bundles, and built-in services.
---

# Core Framework

The core Pandino runtime: an OSGi-style service registry, bundle system, and built-in services for building modular TypeScript applications. Services discover each other dynamically at runtime instead of being statically wired at compile time.

## Where it fits in the Pandino ecosystem

```
 @pandino/decorators            @pandino/rollup-bundle-plugin
 (declare components) --+         (auto-package bundles)
                        v                     |
              +--------------------------+    |
              |   @pandino/pandino       | <--+
              |   - Service Registry     |
              |   - Bundle Lifecycle     |
              |   - EventAdmin           |     @pandino/react-hooks
              |   - ConfigurationAdmin   | --> (consume services in React)
              |   - LogService           |
              |   - SCR (runtime)        |
              +--------------------------+
```

This package is the heart of any Pandino application. Every other package either produces artifacts it consumes (decorators, rollup plugin) or provides an adapter layer to interact with it (react-hooks).

## Installation

```bash
npm install @pandino/pandino reflect-metadata
```

If you plan to use decorators, also install [`@pandino/decorators`](/guide/decorators):

```bash
npm install @pandino/decorators
```

Import `reflect-metadata` once at your application's entry point:

```typescript
import 'reflect-metadata';
```

### TypeScript configuration

Enable decorators and metadata emission in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

## Core concepts

### Services and service references

A **service** is any object registered in Pandino's central registry under one or more interface names. Consumers don't import service implementations directly -- they look them up by interface, optionally filtering by properties.

| Concept                  | What it is                                  | Analogy                   |
| ------------------------ | ------------------------------------------- | ------------------------- |
| **Service**              | The object that does the work               | A person you want to call |
| **Service Reference**    | A handle used to look up and release access | The phone-book entry      |
| **Service Registration** | Handle returned when you publish a service  | Your listing in the book  |

### Bundles

A **bundle** is a self-contained module with its own lifecycle (`install`, `start`, `stop`, `uninstall`). Each bundle can publish services, consume services, and register event listeners through a `BundleContext`. Bundles are the unit of modularity in Pandino.

### Dynamic dependencies

Services can appear and disappear at runtime. Dependents are wired automatically as soon as their requirements become available -- bundle start-up order does not matter.

### Declarative services (SCR)

The **Service Component Runtime** activates classes annotated with `@Component` (from `@pandino/decorators`) and resolves their `@Reference` dependencies automatically. This eliminates the boilerplate of manual `registerService()` calls.

## Quick start

### 1. Bootstrap the framework

```typescript
import 'reflect-metadata';
import { OSGiBootstrap, LogLevel } from '@pandino/pandino';

const bootstrap = new OSGiBootstrap({
  frameworkLogLevel: LogLevel.INFO,
});

const framework = await bootstrap.start();
const context = framework.getBundleContext();
```

### 2. Register and consume a service imperatively

```typescript
interface GreetingService {
  sayHello(name: string): string;
}

class SimpleGreetingService implements GreetingService {
  sayHello(name: string): string {
    return `Hello, ${name}!`;
  }
}

// Publish
const registration = context.registerService('GreetingService', new SimpleGreetingService());

// Look up
const ref = context.getServiceReference<GreetingService>('GreetingService')!;
const service = context.getService(ref)!;
console.log(service.sayHello('World'));

// Clean up
context.ungetService(ref);
registration.unregister();
```

### 3. Or declare a component with decorators

```typescript
import { Component, Service, Reference, Activate } from '@pandino/decorators';
import type { LogService } from '@pandino/pandino';

@Component({ name: 'greeting.service', immediate: true })
@Service({ interfaces: ['GreetingService'] })
export class GreetingServiceImpl implements GreetingService {
  @Reference({ interface: 'LogService' })
  private logger!: LogService;

  @Activate
  activate(): void {
    this.logger.info('GreetingService ready');
  }

  sayHello(name: string): string {
    return `Hello, ${name}!`;
  }
}
```

Decorated classes are activated by the SCR when they are included in a bundle. See the [Decorators guide](/guide/decorators) and [Rollup Bundle Plugin guide](/guide/rollup-plugin) for how to ship them as bundles.

## Service properties and LDAP filters

Services carry metadata. Consumers can select specific implementations using LDAP filter expressions:

```typescript
context.registerService('DatabaseService', new MySQLService(), {
  'db.type': 'mysql',
  'db.host': 'localhost',
  'service.ranking': 100,
});

const refs = context.getServiceReferences<DatabaseService>('DatabaseService', '(db.type=mysql)');
```

Common filter forms:

| Filter                                  | Matches                         |
| --------------------------------------- | ------------------------------- |
| `(db.type=mysql)`                       | MySQL database services         |
| `(service.ranking>=100)`                | High-priority services          |
| `(&(db.host=localhost)(db.port>=3000))` | Local services on ports >= 3000 |
| `(\|(category=urgent)(priority=1))`     | Urgent OR priority-1 services   |

When multiple services are registered under the same interface, the one with the highest `service.ranking` wins by default.

## Built-in services

These services are registered by the framework itself and are available through the bundle context as soon as it is started.

### LogService

Centralised logging with bundle-aware context.

```typescript
const logRef = context.getServiceReference<LogService>('LogService')!;
const logger = context.getService(logRef)!;

logger.info('Server starting', undefined, { port: 8080 });
```

### EventAdmin

Topic-based publish-subscribe messaging.

```typescript
import { Event } from '@pandino/pandino';
import type { EventAdmin } from '@pandino/pandino';

const eventAdmin = context.getService(context.getServiceReference<EventAdmin>('EventAdmin')!)!;

// Publish
eventAdmin.sendEvent(new Event('user/login', { userId: '123' }));

// Subscribe
context.registerService(
  'EventHandler',
  {
    handleEvent: (event) => console.log(event.getTopic(), event.getProperty('userId')),
  },
  {
    'event.topics': 'user/*',
  },
);
```

### ConfigurationAdmin

Runtime configuration updates delivered to `ManagedService` instances.

```typescript
import type { ConfigurationAdmin, ManagedService } from '@pandino/pandino';

const configAdmin = context.getService(context.getServiceReference<ConfigurationAdmin>('ConfigurationAdmin')!)!;

const config = await configAdmin.getConfiguration('database.connection');
await config.update({ host: 'localhost', port: 5432 });

// Services can receive updates by implementing ManagedService
class DatabaseService implements ManagedService {
  updated(props: Record<string, any> | null): void {
    if (props) this.reconnect(props);
  }
}
context.registerService('DatabaseService', new DatabaseService(), {
  'service.pid': 'database.connection',
});
```

### ServiceTracker

A helper that tracks the availability of services matching an interface or filter.

```typescript
import { ServiceTracker } from '@pandino/pandino';

const tracker = new ServiceTracker<DatabaseService>(context, 'DatabaseService', {
  addingService: (ref) => context.getService(ref),
  modifiedService: (ref, svc, tracked) => {
    // react to updated service properties
  },
  removedService: (ref, svc, tracked) => {
    // cleanup; the tracker releases the reference automatically
  },
});

tracker.open();
const current = tracker.getService();
```

### ServiceComponentRuntime (SCR)

Activates and manages declaratively defined components. You usually don't interact with it directly -- bundles register their components via SCR automatically. For manual control:

```typescript
import type { BundleActivator, BundleContext, ServiceComponentRuntime } from '@pandino/pandino';

const activator: BundleActivator = {
  async start(context: BundleContext) {
    const scr = context.getService(context.getServiceReference<ServiceComponentRuntime>('ServiceComponentRuntime')!)!;
    const bundleId = context.getBundle().getBundleId();
    await scr.registerComponent(GreetingServiceImpl, bundleId);
  },
};
```

## Writing a bundle

A bundle is a plain module whose default export describes itself:

```typescript
import type { BundleActivator, BundleContext } from '@pandino/pandino';

class DatabaseService {
  query(sql: string) {
    /* ... */
  }
}

const activator: BundleActivator = {
  async start(context: BundleContext) {
    context.registerService('DatabaseService', new DatabaseService());
  },
  async stop() {
    // optional manual cleanup; services registered via the context are released automatically
  },
};

export default {
  headers: {
    bundleSymbolicName: 'com.example.database',
    bundleVersion: '1.0.0',
    bundleName: 'Database Bundle',
  },
  activator,
  components: [
    // classes decorated with @Component -- optional
  ],
};
```

Bundles can be loaded at startup by passing them to the bootstrap, installed via `context.installBundle()`, or produced automatically by the [Rollup Bundle Plugin](/guide/rollup-plugin).

### Fragment bundles

A **fragment** is a bundle that attaches to a host and contributes components or resources without its own lifecycle. Typical uses: localisation packs, platform-specific overrides, theming.

```typescript
export default {
  headers: {
    bundleSymbolicName: 'com.example.database.german',
    bundleVersion: '1.0.0',
    fragmentHost: 'com.example.database',
  },
  activator: { start: async () => {}, stop: async () => {} },
  components: [{ name: 'GermanTranslations', translations: {/* ... */} }],
};
```

More details in the [Fragment Pattern](/patterns/fragment-pattern) documentation.

## Recommended patterns

Common architectural patterns used with Pandino bundles:

- [Extender pattern](/patterns/extender-pattern) -- observe other bundles and react to their metadata.
- [Whiteboard pattern](/patterns/whiteboard-pattern) -- collect contributions as services instead of plugin registries.
- [Fragment pattern](/patterns/fragment-pattern) -- attach to a host bundle.
- [Creating decorator extenders](/patterns/decorator-extenders) -- add your own decorator-driven behaviours.

## Public API cheatsheet

| Export                                                          | Purpose                                               |
| --------------------------------------------------------------- | ----------------------------------------------------- |
| `OSGiBootstrap`                                                 | Start and stop the framework                          |
| `OSGiFramework`                                                 | The running framework instance                        |
| `BundleContext`                                                 | Register / look up services, install bundles          |
| `Bundle`, `BundleActivator`                                     | Bundle lifecycle model                                |
| `ServiceReference<T>`                                           | Handle used to look up and release a service          |
| `ServiceRegistration<T>`                                        | Handle to unregister or update a registered service   |
| `ServiceTracker<T>`                                             | Tracks service availability with customiser callbacks |
| `EventAdmin`, `Event`, `EventHandler`                           | Publish/subscribe messaging                           |
| `ConfigurationAdmin`, `ManagedService`, `ManagedServiceFactory` | Runtime configuration                                 |
| `LogService`, `LogLevel`                                        | Framework-provided logger                             |
| `ServiceComponentRuntime`, `ComponentContext`                   | Declarative-service runtime                           |
| `BUNDLE_STATES`, `SERVICE_EVENT_TYPES`                          | Lifecycle / event enumerations                        |
| `getDecoratorInfo(ClassRef)`                                    | Inspect decorator metadata on a component class       |

See the full [Core API Reference](/api/core) for detailed signatures.
