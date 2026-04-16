---
title: Architecture Overview
description: Understand Pandino's service-oriented architecture, bundle modularity, dynamic dependencies, and how all packages in the ecosystem relate to each other.
---

# Architecture Overview

Pandino is built around four architectural pillars: a **service registry** for dynamic discovery, a **bundle system** for modularity, **dynamic dependencies** that resolve automatically, and **declarative services** for eliminating boilerplate. This page explains how they work together.

## Service-Oriented Architecture

At the heart of Pandino is a central **service registry**. Services are plain objects registered under one or more interface names, along with optional properties that describe their capabilities.

Consumers never import service implementations directly. Instead, they query the registry by interface name and, when needed, filter by properties using **LDAP filter expressions**:

```typescript
// Register a service with metadata
context.registerService('DatabaseService', new MySQLService(), {
  'db.type': 'mysql',
  'service.ranking': 100,
});

// Discover services by capabilities
const refs = context.getServiceReferences('DatabaseService', '(db.type=mysql)');
```

Key characteristics of the service registry:

- **Interface-based discovery** -- services are looked up by interface name, not by class or module path
- **Property filtering** -- LDAP filter syntax lets consumers select services based on arbitrary metadata
- **Service ranking** -- when multiple services implement the same interface, the one with the highest `service.ranking` wins
- **Dynamic lifecycle** -- services can be registered and unregistered at any time; consumers are notified of changes

For a deep dive, see [Services](/concepts/services).

## Bundle Modularity

A **bundle** is a self-contained module with its own lifecycle. Each bundle can publish services, consume services from other bundles, and register event listeners -- all through a `BundleContext` that the framework provides.

Bundles go through a well-defined lifecycle: `install` -> `start` -> `stop` -> `uninstall`. A **BundleActivator** defines what happens at each transition:

```typescript
const databaseBundle = {
  activator: {
    async start(context) {
      // Register database services, subscribe to events
    },
    async stop(context) {
      // Unregister services, clean up resources
    },
  },
};
```

Bundles are the unit of deployment and modularity in Pandino. They can be loaded and unloaded independently, making it possible to add or remove functionality at runtime without restarting the application.

For a deep dive, see [Bundles](/concepts/bundles).

## Dynamic Dependencies

In traditional applications, startup order matters -- if module A depends on module B, B must be initialized first. Pandino removes this constraint entirely.

Dependencies are resolved **automatically** when services become available in the registry. Bundle startup order does not matter:

```typescript
await apiBundle.start();       // Starts immediately, even without a database
await databaseBundle.start();  // API bundle automatically gets the database service
```

This means:

- Bundles can start in **any order** without errors
- When a required service appears, dependents are wired automatically
- When a service disappears, dependents are notified and can react gracefully
- No global initialization sequence to maintain

## Declarative Services (SCR)

While you can always register services imperatively through `BundleContext`, Pandino's **Service Component Runtime (SCR)** offers a declarative alternative using decorators from the `@pandino/decorators` package.

Decorators let you describe services, dependencies, and lifecycle callbacks directly on your classes:

```typescript
import { Component, Service, Reference, Activate } from '@pandino/decorators';

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

The SCR reads decorator metadata at runtime and handles:

- **Component creation** -- instantiating the class when all required dependencies are satisfied
- **Dependency injection** -- resolving `@Reference` fields from the service registry
- **Lifecycle management** -- calling `@Activate` and `@Deactivate` methods at the right time
- **Configuration binding** -- updating components when their configuration changes

This eliminates the boilerplate of manual `registerService()` calls and `BundleActivator` implementations for the majority of services.

For a deep dive, see [Declarative Services](/concepts/declarative-services).

## Ecosystem Overview

The following diagram shows how the Pandino packages relate to each other and to your application:

```
 @pandino/decorators              @pandino/rollup-bundle-plugin
 (declare service components      (auto-package bundles from
  with @Component, @Service,       @Component classes at
  @Reference, @Activate)           build time)
         │                                  │
         ▼                                  ▼
 ┌─────────────────────────────────────────────────────┐
 │                  @pandino/pandino                    │
 │                                                     │
 │  Service Registry   Bundle Lifecycle   EventAdmin   │
 │  ConfigurationAdmin  LogService    SCR (runtime)    │
 │                                                     │
 └──────────────────────────┬──────────────────────────┘
                            │
              ┌─────────────┼─────────────┐
              ▼                           ▼
 ┌──────────────────────┐    ┌──────────────────────────┐
 │ @pandino/react-hooks │    │   Your application       │
 │ <PandinoProvider>    │    │   (Node.js, Deno, Bun,   │
 │ useService           │    │    or any JS runtime)    │
 │ useServiceTracker    │    │                          │
 │ useRegisterService   │    │                          │
 └──────────┬───────────┘    └──────────────────────────┘
            ▼
      Your React tree
```

**@pandino/pandino** is the core runtime. Every other package either produces artifacts it consumes or provides an adapter layer to interact with it:

- **@pandino/decorators** provides the decorator annotations (`@Component`, `@Service`, `@Reference`, etc.) that the SCR inside `@pandino/pandino` reads at runtime
- **@pandino/rollup-bundle-plugin** scans your source files at build time, finds decorated classes, and emits ready-to-install bundle modules
- **@pandino/react-hooks** wraps the framework with a React context and exposes idiomatic hooks for service discovery in React components

## Next Steps

Explore the concepts that underpin this architecture:

- [Services](/concepts/services) -- How services, service references, properties, and LDAP filters work
- [Bundles](/concepts/bundles) -- Bundle lifecycle, activators, and module structure
- [Declarative Services](/concepts/declarative-services) -- The decorator-based approach to service definition and dependency injection
