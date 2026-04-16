---
title: Services
description: Understanding the Pandino service registry, service references, LDAP filters, and service ranking.
---

# Services

A **service** in Pandino is any object registered in a central registry under one or more interface names. Services are the primary mechanism for communication between modules -- producers register services, and consumers discover them at runtime without knowing the concrete implementation.

## Registering a Service

Use `context.registerService()` inside a `BundleActivator` to publish a service:

```typescript
import type { BundleActivator, BundleContext, ServiceRegistration } from '@pandino/pandino';

interface GreeterService {
  greet(name: string): string;
}

class GreeterServiceImpl implements GreeterService {
  greet(name: string): string {
    return `Hello, ${name}!`;
  }
}

export default class Activator implements BundleActivator {
  private registration?: ServiceRegistration<GreeterService>;

  async start(context: BundleContext): Promise<void> {
    this.registration = context.registerService<GreeterService>(
      'GreeterService',             // interface name
      new GreeterServiceImpl(),     // implementation
      { 'service.ranking': 10 },    // optional properties
    );
  }

  async stop(context: BundleContext): Promise<void> {
    this.registration?.unregister();
  }
}
```

The first argument can be a single interface name (`string`), an array of interface names (`string[]`), or a constructor function. The third argument is an optional property map that attaches metadata to the service.

## Discovering Services

Consumers look up services through the `BundleContext`:

```typescript
// Get a single reference (highest-ranked match)
const ref = context.getServiceReference<GreeterService>('GreeterService');

if (ref) {
  const greeter = context.getService(ref);
  console.log(greeter?.greet('World')); // "Hello, World!"

  // Release when done
  context.ungetService(ref);
}
```

To find multiple services matching a filter:

```typescript
// Get all references matching a filter
const refs = context.getServiceReferences<GreeterService>(
  'GreeterService',
  '(language=en)',
);

if (refs) {
  for (const ref of refs) {
    const service = context.getService(ref);
    // use service...
    context.ungetService(ref);
  }
}
```

## ServiceReference vs ServiceRegistration

| Aspect | `ServiceReference` | `ServiceRegistration` |
| --- | --- | --- |
| **Purpose** | Read-only handle for consumers to inspect and obtain a service | Control handle for the producer that registered the service |
| **Who holds it** | Any bundle that discovers the service | The bundle that registered the service |
| **Key methods** | `getProperty(key)`, `getPropertyKeys()`, `getBundle()`, `getProperties()` | `getReference()`, `setProperties(props)`, `unregister()` |
| **Mutability** | Cannot modify the service or its properties | Can update properties or unregister the service |

## Service Properties

Properties are key-value metadata attached to a service at registration time. They serve two purposes:

1. **Filtering** -- Consumers use LDAP filter expressions to select services based on their properties.
2. **Configuration** -- Properties carry metadata like version, language, priority, or any custom data.

```typescript
context.registerService('GreeterService', impl, {
  'language': 'en',
  'service.ranking': 5,
  'service.description': 'English greeter',
});
```

The producer can update properties after registration:

```typescript
registration.setProperties({
  'language': 'en',
  'service.ranking': 20,
});
```

## LDAP Filter Expressions

Pandino uses LDAP-style filter syntax to match services by their properties. Filters are passed to `getServiceReferences()` and `addServiceListener()`.

| Expression | Meaning | Example |
| --- | --- | --- |
| `(key=value)` | Equality | `(language=en)` |
| `(key>=value)` | Greater than or equal | `(service.ranking>=10)` |
| `(key<=value)` | Less than or equal | `(version<=2)` |
| `(key=*value*)` | Substring match | `(name=*greeter*)` |
| `(key=*)` | Presence (key exists) | `(language=*)` |
| `(&(...)(...))`  | AND -- all must match | `(&(language=en)(service.ranking>=5))` |
| <code>(&#124;(...)(...))  </code> | OR -- any must match | <code>(&#124;(language=en)(language=fr))</code> |
| `(!(...))`  | NOT -- must not match | `(!(language=de))` |

Filters can be nested to build complex queries:

```typescript
const refs = context.getServiceReferences(
  'GreeterService',
  '(&(language=en)(service.ranking>=5))',
);
```

You can also validate or create filter objects programmatically:

```typescript
const filter = context.createFilter('(language=en)');
const matches = filter.match({ language: 'en', version: '1.0' }); // true
```

## Service Ranking

When multiple services are registered under the same interface, Pandino uses **ranking** to determine which one `getServiceReference()` returns:

1. The service with the **highest** `service.ranking` value wins.
2. If rankings are equal, the service with the **lowest** `service.id` (registered first) wins.

```typescript
// This service will be preferred over one with ranking 5
context.registerService('GreeterService', implA, { 'service.ranking': 10 });
context.registerService('GreeterService', implB, { 'service.ranking': 5 });

const ref = context.getServiceReference('GreeterService');
// ref points to implA (ranking 10 > 5)
```

Ranking is useful for overriding default implementations. A plugin can register a higher-ranked service to replace a built-in one without modifying the original bundle.

## ServiceFactory

A `ServiceFactory` lets you create a unique service instance for each consuming bundle. Instead of registering a plain object, you register a factory:

```typescript
import type { Bundle, ServiceFactory, ServiceRegistration } from '@pandino/pandino';

class GreeterFactory implements ServiceFactory<GreeterService> {
  getService(bundle: Bundle, registration: ServiceRegistration<GreeterService>): GreeterService {
    // Return a unique instance per consuming bundle
    return new GreeterServiceImpl(bundle.getSymbolicName());
  }

  ungetService(bundle: Bundle, registration: ServiceRegistration<GreeterService>, service: GreeterService): void {
    // Clean up when the bundle releases the service
  }
}
```

This is useful when services need to be scoped or customized per consumer, such as loggers that include the consuming bundle's name.

## Service Lifecycle

Services are dynamic -- they can appear and disappear at any time. When a service is **unregistered** (either explicitly or because its bundle stops):

- Existing `ServiceReference` objects become stale.
- Calling `context.getService(ref)` on a stale reference returns `null`.
- Consumers should call `context.ungetService(ref)` to release their hold on the service.

Always check for `null` when obtaining services, and release them when you are done:

```typescript
const ref = context.getServiceReference<GreeterService>('GreeterService');
if (ref) {
  const service = context.getService(ref);
  if (service) {
    service.greet('World');
  }
  context.ungetService(ref);
}
```

## ServiceListener

To react when services are registered, modified, or unregistered, add a `ServiceListener`:

```typescript
import type { ServiceListener, ServiceEvent } from '@pandino/pandino';

const listener: ServiceListener = {
  serviceChanged(event: ServiceEvent): void {
    const ref = event.getServiceReference();
    const type = event.getType();

    switch (type) {
      case 1: // REGISTERED
        console.log('Service registered:', ref.getProperty('service.id'));
        break;
      case 2: // MODIFIED
        console.log('Service properties changed');
        break;
      case 4: // UNREGISTERING
        console.log('Service going away');
        break;
    }
  },
};

// Listen only for GreeterService events
context.addServiceListener(listener, '(objectClass=GreeterService)');

// Remove when no longer needed
context.removeServiceListener(listener);
```

The optional filter argument restricts which service events the listener receives.

## Next Steps

- [Core Framework API](/api/core) -- Full API reference for `BundleContext`, `ServiceReference`, and more
- [Core Framework Guide](/guide/core-framework) -- Step-by-step usage guide
- [Declarative Services](/concepts/declarative-services) -- Decorator-based alternative to manual service registration
