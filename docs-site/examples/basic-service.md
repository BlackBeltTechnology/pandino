---
title: Basic Service Example
description: Step-by-step walkthrough of registering and consuming a service in Pandino.
---

# Basic Service

This example walks through the minimal steps to register a service and consume it in Pandino.

## 1. Bootstrap the framework

```typescript
import 'reflect-metadata';
import { OSGiBootstrap, LogLevel } from '@pandino/pandino';

const bootstrap = new OSGiBootstrap({
  frameworkLogLevel: LogLevel.INFO,
});

const framework = await bootstrap.start();
const context = framework.getBundleContext();
```

## 2. Define a service interface

```typescript
interface GreetingService {
  greet(name: string): string;
}
```

In Pandino, services are registered under string interface names. The TypeScript interface is for your own type safety -- Pandino uses the string identifier for lookup.

## 3. Register a service

```typescript
class SimpleGreetingService implements GreetingService {
  greet(name: string): string {
    return `Hello, ${name}!`;
  }
}

const registration = context.registerService('GreetingService', new SimpleGreetingService(), {
  'service.ranking': 10,
  lang: 'en',
});
```

The third argument is optional metadata. Other consumers can filter on these properties.

## 4. Look up and use the service

```typescript
const ref = context.getServiceReference<GreetingService>('GreetingService')!;
const service = context.getService(ref)!;

console.log(service.greet('World')); // "Hello, World!"
```

## 5. Filter by properties

If multiple implementations are registered, use an LDAP filter:

```typescript
// Register a second implementation
context.registerService('GreetingService', new FrenchGreetingService(), {
  'service.ranking': 5,
  lang: 'fr',
});

// Find the French implementation
const frenchRefs = context.getServiceReferences<GreetingService>('GreetingService', '(lang=fr)');
const frenchService = context.getService(frenchRefs[0])!;
console.log(frenchService.greet('World')); // "Bonjour, World!"
```

## 6. Clean up

```typescript
// Release service reference
context.ungetService(ref);

// Unregister service
registration.unregister();

// Stop framework
await bootstrap.stop();
```

## Using decorators instead

The same service can be declared with decorators, eliminating manual registration:

```typescript
import { Component, Service, Activate } from '@pandino/decorators';

@Component({ name: 'greeting.service', immediate: true })
@Service({ interfaces: ['GreetingService'] })
class GreetingServiceImpl implements GreetingService {
  @Activate
  activate(): void {
    console.log('GreetingService activated');
  }

  greet(name: string): string {
    return `Hello, ${name}!`;
  }
}
```

When this class is included in a bundle's `components` array, SCR activates it and registers the service automatically.

## Next steps

- [React Application example](/examples/react-app) -- use services in React components
- [Services concept](/concepts/services) -- deep dive into the service registry
- [Decorators guide](/guide/decorators) -- all available decorators
