# @pandino/decorators

[![npm version](https://badge.fury.io/js/@pandino%2Fdecorators.svg)](https://badge.fury.io/js/@pandino%2Fdecorators)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-EPL2.0-blue.svg)](LICENSE)

TypeScript decorators for declarative service components in the Pandino framework. Annotate plain classes to describe services, dependencies, and lifecycle callbacks — the Pandino runtime takes care of wiring and activation.

## Where it fits in the Pandino ecosystem

```
┌────────────────────────┐     ┌──────────────────────────┐     ┌────────────────────────┐
│ @pandino/decorators    │ ──▶ │ @pandino/pandino         │ ──▶ │ Your application       │
│ (declare components)   │     │ (Service Component       │     │ (discovers & uses      │
│                        │     │  Runtime activates them) │     │  services at runtime)  │
└────────────────────────┘     └──────────────────────────┘     └────────────────────────┘
```

Use this package whenever you want to define Pandino services declaratively, without writing manual registration code in a bundle activator. Decorator metadata is read by Pandino's **Service Component Runtime (SCR)** at runtime to create, activate, deactivate, and inject components automatically.

## Installation

```bash
npm install @pandino/decorators reflect-metadata
```

`reflect-metadata` is a peer dependency. Import it **once** at the entry point of your application, before any decorated class is loaded:

```typescript
import 'reflect-metadata';
```

## TypeScript configuration

Enable experimental decorators and metadata emission in your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

> Without these settings decorator metadata will not be emitted and Pandino will not be able to activate your components.

## Available decorators

| Decorator                  | Target   | Purpose                                                               |
| -------------------------- | -------- | --------------------------------------------------------------------- |
| `@Component(options)`      | class    | Declares a component with an optional name, lifecycle, and config PID |
| `@Service({ interfaces })` | class    | Publishes the component as a service under one or more interfaces     |
| `@Reference(options)`      | property | Injects a required or optional service dependency                     |
| `@Activate`                | method   | Called when the component is activated                                |
| `@Deactivate`              | method   | Called when the component is deactivated                              |
| `@Modified`                | method   | Called when the component's configuration changes                     |
| `@Property(key, value)`    | class    | Attaches a static property to the component                           |
| `@ConfigurationPolicy(p)`  | class    | Sets configuration handling: `optional`, `require`, or `ignore`       |
| `@Factory(factoryId)`      | class    | Marks the component as a component factory                            |
| `@Immediate`               | class    | Activates the component as soon as its dependencies are satisfied     |
| `@Scope(scope)`            | class    | Selects service scope: `singleton`, `bundle`, or `prototype`          |

## Basic usage

```typescript
import { Component, Service, Reference, Activate, Deactivate } from '@pandino/decorators';
import type { LogService } from '@pandino/pandino';

interface GreetingService {
  sayHello(name: string): string;
}

@Component({ name: 'greeting.service', immediate: true })
@Service({ interfaces: ['GreetingService'] })
export class GreetingServiceImpl implements GreetingService {
  @Reference({ interface: 'LogService', cardinality: '1..1' })
  private logger!: LogService;

  @Activate
  activate(): void {
    this.logger.info('GreetingService activated');
  }

  @Deactivate
  deactivate(): void {
    this.logger.info('GreetingService deactivated');
  }

  sayHello(name: string): string {
    return `Hello, ${name}!`;
  }
}
```

This component will be discovered and registered automatically when placed in a Pandino bundle — no manual `registerService()` calls required.

## How components reach the runtime

You typically don't register decorated classes yourself. Instead, one of the following mechanisms loads them into Pandino's SCR:

- **Bundles built with [`@pandino/rollup-bundle-plugin`](https://www.npmjs.com/package/@pandino/rollup-bundle-plugin)** — the plugin scans your source files for `@Component` classes at build time and exposes them as a bundle module.
- **Manual bundle modules** — add decorated classes to your bundle's `components` array.
- **Manual registration via `ServiceComponentRuntime`** — for advanced cases where you need full control.

See the [core framework README](https://www.npmjs.com/package/@pandino/pandino) for details on bundles and the Service Component Runtime.

## Related packages

- [`@pandino/pandino`](https://www.npmjs.com/package/@pandino/pandino) — The runtime that activates and manages decorated components.
- [`@pandino/rollup-bundle-plugin`](https://www.npmjs.com/package/@pandino/rollup-bundle-plugin) — Auto-discovers decorated classes at build time.
- [`@pandino/react-hooks`](https://www.npmjs.com/package/@pandino/react-hooks) — Consume services declared with these decorators from React components.

## License

Eclipse Public License - v 2.0
