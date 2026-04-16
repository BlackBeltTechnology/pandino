---
title: Declarative Services
description: Understanding the Service Component Runtime (SCR) - Pandino's decorator-based dependency injection system.
---

# Declarative Services

The **Service Component Runtime (SCR)** is Pandino's declarative dependency injection system. Instead of manually registering and wiring services in a `BundleActivator`, you use decorators to declare what a component provides and what it depends on. The SCR handles service registration, dependency injection, and lifecycle management automatically.

## Component Lifecycle

SCR components have their own lifecycle driven by dependency satisfaction:

```
  UNSATISFIED --> ACTIVATING --> ACTIVE --> DEACTIVATING --> UNSATISFIED
```

- **Unsatisfied** -- The component is waiting for its required dependencies to become available.
- **Activating** -- All dependencies are satisfied. The `@Activate` method is being called.
- **Active** -- The component is running and its service (if any) is registered.
- **Deactivating** -- A dependency was lost or the bundle is stopping. The `@Deactivate` method is being called.

A component can cycle between active and unsatisfied multiple times if its dependencies come and go.

## @Component

The `@Component` decorator marks a class as an SCR component and configures its behavior:

```typescript
import { Component } from '@pandino/decorators';

@Component({
  name: 'com.example.greeter',
  immediate: true,
})
class GreeterComponent {
  // ...
}
```

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `name` | `string` | Class name | Unique component name, also used as the default configuration PID |
| `immediate` | `boolean` | `false` | Activate immediately when satisfied, even without consumers |
| `enabled` | `boolean` | `true` | Whether the component is enabled at bundle start |
| `configurationPid` | `string` | Component name | PID for Configuration Admin integration |
| `configurationPolicy` | `'optional' \| 'require' \| 'ignore'` | `'optional'` | How configuration availability affects activation |
| `factory` | `string` | `undefined` | Factory identifier for factory components |
| `scope` | `'singleton' \| 'bundle' \| 'prototype'` | `'singleton'` | Service scope when the component is also a service |

## @Service

The `@Service` decorator declares which interfaces the component publishes to the service registry:

```typescript
import { Component, Service } from '@pandino/decorators';

@Component({ name: 'com.example.greeter', immediate: true })
@Service({ interfaces: ['GreeterService'] })
class GreeterComponent implements GreeterService {
  greet(name: string): string {
    return `Hello, ${name}!`;
  }
}
```

The `interfaces` array lists the service interface names under which the component is registered. Consumers look up services by these names.

Optionally, you can set the service `scope`:

```typescript
@Service({ interfaces: ['GreeterService'], scope: 'bundle' })
```

## @Reference

The `@Reference` decorator declares a dependency on another service. The SCR injects the dependency into the field when a matching service becomes available:

```typescript
import { Component, Service, Reference } from '@pandino/decorators';

@Component({ name: 'com.example.order-service', immediate: true })
@Service({ interfaces: ['OrderService'] })
class OrderServiceComponent implements OrderService {
  @Reference({ interface: 'UserService' })
  private userService?: UserService;

  @Reference({ interface: 'NotificationService', cardinality: '0..1' })
  private notifications?: NotificationService;

  createOrder(userId: string): Order {
    const user = this.userService!.findUser(userId);
    this.notifications?.notify(`Order created for ${user.name}`);
    return new Order(user);
  }
}
```

### Reference Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `interface` | `string` | `'any'` | The service interface to bind to |
| `cardinality` | `'1..1' \| '0..1' \| '1..n' \| '0..n'` | `'1..1'` | Whether the dependency is mandatory/optional and single/multiple |
| `policy` | `'static' \| 'dynamic'` | `'static'` | Whether bindings can change without deactivating the component |
| `policyOption` | `'reluctant' \| 'greedy'` | `'reluctant'` | Whether to eagerly rebind when a better match appears |
| `target` | `string` | `undefined` | LDAP filter to narrow which services match |

### Cardinality

| Cardinality | Meaning | Field type |
| --- | --- | --- |
| `'1..1'` | Mandatory, single -- component will not activate without this service | `T` |
| `'0..1'` | Optional, single -- component activates even if this service is absent | `T \| undefined` |
| `'1..n'` | Mandatory, multiple -- at least one must be available | `T[]` |
| `'0..n'` | Optional, multiple -- component activates even with zero matches | `T[]` |

### Target Filters

Use the `target` option to narrow dependency matching with LDAP filters:

```typescript
@Reference({
  interface: 'GreeterService',
  target: '(language=en)',
})
private greeter?: GreeterService;
```

### Policy

- **`static`** (default) -- When a bound service disappears, the component must be deactivated and reactivated with a new binding.
- **`dynamic`** -- The field value is updated in place without deactivating the component. Use this when you can tolerate the service changing at any time.

### Policy Option

- **`reluctant`** (default) -- The component keeps its existing binding unless the bound service becomes unavailable.
- **`greedy`** -- The component rebinds to a better match (e.g., higher-ranked service) as soon as it appears.

## Lifecycle Callbacks

Decorate methods with `@Activate`, `@Deactivate`, and `@Modified` to hook into the component lifecycle:

```typescript
import { Component, Service, Activate, Deactivate, Modified } from '@pandino/decorators';
import type { ComponentContext } from '@pandino/pandino';

@Component({ name: 'com.example.greeter', immediate: true })
@Service({ interfaces: ['GreeterService'] })
class GreeterComponent implements GreeterService {
  private greeting = 'Hello';

  @Activate
  activate(context: ComponentContext): void {
    const props = context.getProperties();
    this.greeting = props['greeting'] || 'Hello';
    console.log(`Activated with greeting: ${this.greeting}`);
  }

  @Deactivate
  deactivate(): void {
    console.log('GreeterComponent deactivated');
  }

  @Modified
  modified(context: ComponentContext): void {
    const props = context.getProperties();
    this.greeting = props['greeting'] || 'Hello';
    console.log(`Configuration updated: ${this.greeting}`);
  }

  greet(name: string): string {
    return `${this.greeting}, ${name}!`;
  }
}
```

## ComponentContext

The `@Activate` method receives a `ComponentContext` that provides access to the component's runtime environment:

| Method | Description |
| --- | --- |
| `getBundleContext()` | Returns the owning bundle's `BundleContext` |
| `getProperties()` | Returns the component's merged properties (component + configuration) |
| `getServiceReference()` | Returns the `ServiceReference` for this component's service |
| `getComponentName()` | Returns the component name |
| `locateService<S>(name)` | Looks up a bound service by its reference name |
| `locateServices<S>(name)` | Looks up all bound services for a multi-cardinality reference |
| `disableComponent(name)` | Programmatically disables a component by name |
| `enableComponent(name)` | Programmatically enables a component by name |

## Configuration Policies

The `configurationPolicy` option controls how the component reacts to Configuration Admin:

| Policy | Behavior |
| --- | --- |
| `'optional'` | The component activates with or without a matching configuration. If a configuration exists, its properties are merged. |
| `'require'` | The component will **not** activate until a matching configuration is available. |
| `'ignore'` | The component ignores any configuration, even if one exists for its PID. |

```typescript
@Component({
  name: 'com.example.database',
  configurationPid: 'com.example.database',
  configurationPolicy: 'require',
})
@Service({ interfaces: ['DatabaseService'] })
class DatabaseComponent implements DatabaseService {
  private connectionString = '';

  @Activate
  activate(context: ComponentContext): void {
    // Configuration is guaranteed to exist because policy is 'require'
    this.connectionString = context.getProperties()['connectionString'];
  }
}
```

See [Configuration](/concepts/configuration) for details on providing configuration values.

## Service Scopes

The `scope` option controls how many instances of the component exist:

| Scope | Behavior |
| --- | --- |
| `'singleton'` | One shared instance serves all consumers. This is the default. |
| `'bundle'` | One instance is created per consuming bundle. |
| `'prototype'` | A new instance is created for each service lookup. |

```typescript
@Component({ name: 'com.example.logger', scope: 'bundle' })
@Service({ interfaces: ['LogService'] })
class BundleScopedLogger implements LogService {
  // Each consuming bundle gets its own logger instance
}
```

## Factory Components

Factory components let you create multiple named instances of a component, each with its own configuration:

```typescript
@Component({
  name: 'com.example.datasource',
  factory: 'datasource-factory',
})
@Service({ interfaces: ['DataSource'] })
class DataSourceComponent implements DataSource {
  @Activate
  activate(context: ComponentContext): void {
    const props = context.getProperties();
    // Each factory instance gets its own properties
    this.connect(props['url'], props['username']);
  }
}
```

Factory components are not activated automatically. Instead, they are instantiated through Configuration Admin factory configurations, each producing a separate service instance.

## Loading Components

There are three ways to make the SCR aware of your component classes:

### 1. Bundle's `components` Array

The most common approach -- list component classes in the bundle module:

```typescript
import { GreeterComponent } from './greeter-component';
import { LoggerComponent } from './logger-component';

export default {
  headers: {
    bundleSymbolicName: 'com.example.greeter',
    bundleVersion: '1.0.0',
  },
  components: [GreeterComponent, LoggerComponent],
};
```

### 2. Rollup Bundle Plugin Auto-Discovery

The `@pandino/rollup-bundle-plugin` can automatically discover decorated classes in your project and include them in the generated bundle modules.

### 3. Programmatic Registration

Register a component class at runtime through the SCR service:

```typescript
async start(context: BundleContext): Promise<void> {
  const scrRef = context.getServiceReference('ServiceComponentRuntime');
  const scr = context.getService(scrRef!);
  scr?.registerComponent(MyComponent);
}
```

## Next Steps

- [Decorators Guide](/guide/decorators) -- Step-by-step guide to using all decorators
- [Decorators API](/api/decorators) -- Full API reference for `@Component`, `@Service`, `@Reference`, and more
- [Configuration](/concepts/configuration) -- Runtime configuration with ConfigurationAdmin
