---
title: Configuration
description: Runtime configuration management in Pandino using ConfigurationAdmin and ManagedService.
---

# Configuration

**ConfigurationAdmin** is a built-in Pandino service for managing runtime configuration. It lets you create, update, and delete configuration objects identified by a persistent identifier (PID). Services that implement `ManagedService` receive configuration updates automatically.

## Core Concepts

- A **Configuration** is a property map identified by a PID string.
- **ConfigurationAdmin** is the service used to create and retrieve configurations.
- **ManagedService** is the interface services implement to receive configuration.
- **ManagedServiceFactory** creates multiple service instances, one per factory configuration.

## Getting a Configuration

Obtain the `ConfigurationAdmin` service from the registry, then use `getConfiguration()` to create or retrieve a configuration by PID:

```typescript
import type { BundleActivator, BundleContext } from '@pandino/pandino';
import type { ConfigurationAdmin } from '@pandino/pandino';

export default class Activator implements BundleActivator {
  async start(context: BundleContext): Promise<void> {
    const ref = context.getServiceReference<ConfigurationAdmin>('ConfigurationAdmin');
    const configAdmin = context.getService(ref!);

    // Get or create a configuration
    const config = await configAdmin!.getConfiguration('com.example.database');

    // Read current properties (null if never updated)
    console.log(config.getProperties());
    console.log(config.getPid()); // 'com.example.database'
  }
}
```

`getConfiguration()` creates the configuration if it does not already exist. It does not deliver the configuration to any service until you call `update()`.

## Updating a Configuration

Call `config.update(properties)` to set the configuration properties. This immediately delivers the properties to any `ManagedService` registered with a matching `service.pid`:

```typescript
const config = await configAdmin.getConfiguration('com.example.database');

await config.update({
  connectionString: 'postgresql://localhost:5432/mydb',
  maxPoolSize: 10,
  timeout: 30000,
});
```

## ManagedService

A `ManagedService` receives configuration updates through its `updated()` callback. Register it with a `service.pid` property that matches the configuration PID:

```typescript
import type { BundleActivator, BundleContext, ServiceRegistration } from '@pandino/pandino';
import type { ManagedService } from '@pandino/pandino';

class DatabaseService implements ManagedService {
  private connectionString = '';
  private maxPoolSize = 5;

  async updated(properties: Record<string, any> | null): Promise<void> {
    if (properties === null) {
      // Configuration has been deleted; reset to defaults
      this.connectionString = '';
      this.maxPoolSize = 5;
      return;
    }

    this.connectionString = properties['connectionString'];
    this.maxPoolSize = properties['maxPoolSize'] || 5;
    console.log(`Database configured: ${this.connectionString}`);
  }
}

export default class Activator implements BundleActivator {
  private registration?: ServiceRegistration<ManagedService>;

  async start(context: BundleContext): Promise<void> {
    this.registration = context.registerService('ManagedService', new DatabaseService(), {
      'service.pid': 'com.example.database',
    });
  }

  async stop(context: BundleContext): Promise<void> {
    this.registration?.unregister();
  }
}
```

When `updated()` is called:

- With a **properties object** -- A configuration exists and has been created or changed.
- With **`null`** -- The configuration has been deleted. The service should revert to defaults.

## Deleting a Configuration

Call `config.delete()` to remove a configuration. This triggers `updated(null)` on the matching `ManagedService`:

```typescript
const config = await configAdmin.getConfiguration('com.example.database');
await config.delete();
```

## Factory Configurations

Factory configurations create multiple instances of a service, each with its own PID and properties. This is useful when you need several instances of the same service type with different settings (e.g., multiple database connections).

Use `createFactoryConfiguration()` to create a new configuration under a factory PID:

```typescript
const config1 = await configAdmin.createFactoryConfiguration('com.example.datasource');
await config1.update({ name: 'primary', url: 'postgresql://primary:5432/db' });

const config2 = await configAdmin.createFactoryConfiguration('com.example.datasource');
await config2.update({ name: 'readonly', url: 'postgresql://replica:5432/db' });
```

Each call to `createFactoryConfiguration()` generates a unique PID. You can check the factory PID with `config.getFactoryPid()`.

## ManagedServiceFactory

A `ManagedServiceFactory` handles multiple factory-created instances. It receives creation, update, and deletion callbacks for each configuration:

```typescript
import type { ManagedServiceFactory } from '@pandino/pandino';

class DataSourceFactory implements ManagedServiceFactory {
  private dataSources = new Map<string, DataSource>();

  getName(): string {
    return 'DataSource Factory';
  }

  async updated(pid: string, properties: Record<string, any>): Promise<void> {
    // Create or update a data source instance
    const existing = this.dataSources.get(pid);
    if (existing) {
      existing.reconfigure(properties);
      console.log(`Updated data source: ${properties['name']}`);
    } else {
      const ds = new DataSource(properties['url'], properties['name']);
      this.dataSources.set(pid, ds);
      console.log(`Created data source: ${properties['name']}`);
    }
  }

  async deleted(pid: string): Promise<void> {
    const ds = this.dataSources.get(pid);
    ds?.close();
    this.dataSources.delete(pid);
    console.log(`Deleted data source: ${pid}`);
  }
}
```

Register the factory with a `service.pid` matching the factory PID:

```typescript
context.registerService('ManagedServiceFactory', new DataSourceFactory(), { 'service.pid': 'com.example.datasource' });
```

## Integration with Declarative Services

SCR components can receive configuration automatically through the `configurationPid` and `configurationPolicy` options. This eliminates the need to implement `ManagedService` manually.

```typescript
import { Component, Service, Activate, Modified } from '@pandino/decorators';
import type { ComponentContext } from '@pandino/pandino';

@Component({
  name: 'com.example.cache-service',
  configurationPid: 'com.example.cache',
  configurationPolicy: 'optional',
  immediate: true,
})
@Service({ interfaces: ['CacheService'] })
class CacheServiceComponent implements CacheService {
  private maxEntries = 100;
  private ttlMs = 60000;

  @Activate
  activate(context: ComponentContext): void {
    const props = context.getProperties();
    this.maxEntries = props['maxEntries'] || 100;
    this.ttlMs = props['ttlMs'] || 60000;
    console.log(`Cache configured: max=${this.maxEntries}, ttl=${this.ttlMs}ms`);
  }

  @Modified
  modified(context: ComponentContext): void {
    // Called when the configuration is updated at runtime
    const props = context.getProperties();
    this.maxEntries = props['maxEntries'] || 100;
    this.ttlMs = props['ttlMs'] || 60000;
    console.log(`Cache reconfigured: max=${this.maxEntries}, ttl=${this.ttlMs}ms`);
  }

  // ... cache implementation ...
}
```

Configuration policies control when the component activates:

| Policy       | Behavior                                                                            |
| ------------ | ----------------------------------------------------------------------------------- |
| `'optional'` | Activates with or without configuration. Merges properties if configuration exists. |
| `'require'`  | Blocks activation until a matching configuration is available.                      |
| `'ignore'`   | Ignores configuration entirely, even if one exists for the PID.                     |

To push configuration to a declarative service component, use ConfigurationAdmin as usual:

```typescript
const config = await configAdmin.getConfiguration('com.example.cache');
await config.update({ maxEntries: 500, ttlMs: 120000 });
// The CacheServiceComponent's @Modified method is called automatically
```

## Listing Configurations

Use `listConfigurations()` with an optional LDAP filter to find existing configurations:

```typescript
// List all configurations
const allConfigs = await configAdmin.listConfigurations();

// List configurations matching a filter
const dbConfigs = await configAdmin.listConfigurations('(service.factoryPid=com.example.datasource)');
```

## ConfigurationListener

To be notified when any configuration changes across the framework, register a `ConfigurationListener`:

```typescript
import type { ConfigurationListener, ConfigurationEvent } from '@pandino/pandino';

class ConfigAuditLogger implements ConfigurationListener {
  configurationEvent(event: ConfigurationEvent): void {
    const pid = event.getPid();
    const type = event.getType(); // 1 = UPDATED, 2 = DELETED

    if (type === 1) {
      console.log(`Configuration updated: ${pid}`);
    } else if (type === 2) {
      console.log(`Configuration deleted: ${pid}`);
    }
  }
}

context.registerService('ConfigurationListener', new ConfigAuditLogger());
```

## Next Steps

- [Core Framework API](/api/core) -- Full API reference for ConfigurationAdmin, Configuration, and ManagedService
- [Declarative Services](/concepts/declarative-services) -- How SCR components integrate with configuration
