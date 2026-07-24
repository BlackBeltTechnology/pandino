---
title: Bundles
description: Understanding bundles in Pandino - self-contained modules with independent lifecycles.
---

# Bundles

A **bundle** is the fundamental unit of modularity in Pandino. It is a self-contained module that carries its own metadata (headers), an optional activator for lifecycle logic, optional declarative service components, and optional resources. Bundles are loaded, started, stopped, and uninstalled independently.

## Bundle Lifecycle

Every bundle passes through a series of states:

```
INSTALLED --> RESOLVED --> STARTING --> ACTIVE --> STOPPING --> UNINSTALLED
```

| State         | Value | Description                                                       |
| ------------- | ----- | ----------------------------------------------------------------- |
| `INSTALLED`   | 2     | The bundle has been installed but not yet resolved.               |
| `RESOLVED`    | 4     | The bundle's dependencies are satisfied and it is ready to start. |
| `STARTING`    | 8     | The bundle's activator `start()` method is being called.          |
| `ACTIVE`      | 32    | The bundle is running. Its services are registered and available. |
| `STOPPING`    | 16    | The bundle's activator `stop()` method is being called.           |
| `UNINSTALLED` | 1     | The bundle has been removed from the framework.                   |

You can check a bundle's current state:

```typescript
const bundle = context.getBundle();
console.log(bundle.getState()); // e.g., 32 (ACTIVE)
```

## BundleActivator

A `BundleActivator` is an object with `start()` and `stop()` methods. These are the entry and exit points for a bundle's custom logic:

```typescript
import type { BundleActivator, BundleContext, ServiceRegistration } from '@pandino/pandino';

export default class Activator implements BundleActivator {
  private registration?: ServiceRegistration<GreeterService>;

  async start(context: BundleContext): Promise<void> {
    // Register services, add listeners, initialize resources
    this.registration = context.registerService('GreeterService', new GreeterServiceImpl());
    console.log('Greeter bundle started');
  }

  async stop(context: BundleContext): Promise<void> {
    // Clean up: unregister services, remove listeners
    this.registration?.unregister();
    console.log('Greeter bundle stopped');
  }
}
```

- `start(context)` is called when the bundle transitions to `STARTING`. Use it to register services, add listeners, and set up resources.
- `stop(context)` is called when the bundle transitions to `STOPPING`. Use it to clean up anything created during `start()`.

Both methods can be synchronous or return a `Promise`.

## BundleContext

`BundleContext` is the API handle a bundle uses to interact with the framework. It is passed to the activator and is available throughout the bundle's active lifetime.

Key capabilities:

| Method                                         | Description                                   |
| ---------------------------------------------- | --------------------------------------------- |
| `registerService(clazz, service, properties?)` | Publish a service to the registry             |
| `getServiceReference(clazz)`                   | Look up the best matching service reference   |
| `getServiceReferences(clazz, filter?)`         | Look up all matching service references       |
| `getService(reference)`                        | Obtain the service object from a reference    |
| `ungetService(reference)`                      | Release a service obtained via `getService()` |
| `installBundle(moduleOrLocation)`              | Install a new bundle into the framework       |
| `getBundle()`                                  | Get this bundle's `Bundle` object             |
| `getBundle(id)`                                | Get any bundle by ID                          |
| `getBundles()`                                 | Get all installed bundles                     |
| `addServiceListener(listener, filter?)`        | Listen for service registry events            |
| `addBundleListener(listener)`                  | Listen for bundle lifecycle events            |
| `createFilter(filter)`                         | Create an LDAP filter object                  |
| `getProperty(key)`                             | Read a framework property                     |

See [Services](/concepts/services) for details on service registration and discovery.

## Bundle Headers

Headers are metadata that describe a bundle. They are declared in the bundle module's `headers` object:

| Header                  | Required | Description                                                      |
| ----------------------- | -------- | ---------------------------------------------------------------- |
| `bundleSymbolicName`    | Yes      | Unique identifier for the bundle (e.g., `'com.example.greeter'`) |
| `bundleVersion`         | Yes      | Semantic version string (e.g., `'1.0.0'`)                        |
| `bundleName`            | No       | Human-readable display name                                      |
| `bundleDescription`     | No       | Description of the bundle's purpose                              |
| `bundleManifestVersion` | No       | Manifest format version                                          |
| `fragmentHost`          | No       | Symbolic name of the host bundle (makes this a fragment bundle)  |

You can read headers at runtime:

```typescript
const headers = bundle.getHeaders();
console.log(headers['bundleSymbolicName']); // 'com.example.greeter'
console.log(headers['bundleVersion']); // '1.0.0'
```

## BundleModule Format

A bundle module is a standard ES module with a default export containing the bundle's metadata, activator, components, and resources:

```typescript
import type { BundleModule } from '@pandino/pandino';
import { Activator } from './activator';
import { GreeterComponent } from './greeter-component';

export default {
  headers: {
    bundleSymbolicName: 'com.example.greeter',
    bundleVersion: '1.0.0',
    bundleName: 'Greeter Bundle',
    bundleDescription: 'Provides greeting services',
  },
  activator: new Activator(),
  components: [GreeterComponent],
  resources: {
    'templates/greeting.html': '<p>Hello, {{name}}!</p>',
  },
} satisfies BundleModule['default'];
```

| Property     | Required | Description                                             |
| ------------ | -------- | ------------------------------------------------------- |
| `headers`    | Yes      | Bundle metadata (symbolic name, version, etc.)          |
| `activator`  | No       | A `BundleActivator` instance for custom lifecycle logic |
| `components` | No       | Array of decorated component classes for the SCR        |
| `resources`  | No       | Map of logical paths to string resources                |

You can have an activator, components, or both. Simple bundles that only use declarative services may not need an activator at all.

## Installing Bundles

There are several ways to install bundles into the framework:

### At Bootstrap

Start the framework with `OSGiBootstrap`, then install your bundles through the framework's `BundleContext`:

```typescript
import { OSGiBootstrap, LogLevel } from '@pandino/pandino';

const bootstrap = new OSGiBootstrap({ frameworkLogLevel: LogLevel.INFO });
const framework = await bootstrap.start();
const context = framework.getBundleContext();

const greeter = await context.installBundle(import('./bundles/greeter-bundle'));
const logger = await context.installBundle(import('./bundles/logger-bundle'));
await greeter.start();
await logger.start();
```

### At Runtime via BundleContext

Install additional bundles dynamically from a running bundle:

```typescript
async start(context: BundleContext): Promise<void> {
  const bundle = await context.installBundle(
    import('./bundles/plugin-bundle'),
  );
  await bundle.start();
}
```

### Via Rollup Bundle Plugin

The `@pandino/rollup-bundle-plugin` generates virtual modules that are automatically discovered and loaded. This is the recommended approach for Vite and Rollup projects, as it automates bundle packaging.

## Fragment Bundles

A **fragment bundle** is a special bundle that attaches to a **host bundle** instead of having its own lifecycle. Fragments extend their host with additional resources, components, or configuration.

A fragment is created by setting the `fragmentHost` header to the symbolic name of the target host:

```typescript
export default {
  headers: {
    bundleSymbolicName: 'com.example.greeter-french',
    bundleVersion: '1.0.0',
    fragmentHost: 'com.example.greeter', // attaches to the greeter host
  },
  resources: {
    'i18n/fr.json': '{"greeting": "Bonjour"}',
  },
};
```

Key characteristics of fragment bundles:

- **No independent lifecycle** -- A fragment does not have its own activator. It is resolved when its host resolves.
- **Resource sharing** -- Fragment resources are merged into the host's resource namespace.
- **Use cases** -- Localization data, additional templates, supplementary configuration, platform-specific resources.

See [Fragment Pattern](/patterns/fragment-pattern) for detailed usage patterns.

## BundleListener

To react when bundles are installed, started, stopped, or uninstalled, add a `BundleListener`:

```typescript
import type { BundleListener, BundleEvent } from '@pandino/pandino';

const listener: BundleListener = {
  bundleChanged(event: BundleEvent): void {
    const bundle = event.getBundle();
    const type = event.getType();
    console.log(`Bundle ${bundle.getSymbolicName()} event type: ${type}`);
  },
};

context.addBundleListener(listener);

// Remove when no longer needed
context.removeBundleListener(listener);
```

## Next Steps

- [Core Framework Guide](/guide/core-framework) -- Step-by-step guide to building with bundles
- [Fragment Pattern](/patterns/fragment-pattern) -- Detailed fragment bundle usage patterns
- [Services](/concepts/services) -- How bundles publish and consume services
- [Declarative Services](/concepts/declarative-services) -- Decorator-based alternative to manual activators
