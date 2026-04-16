---
title: Getting Started
description: Install Pandino and bootstrap your first modular TypeScript application with step-by-step instructions for three integration paths.
---

# Getting Started

This guide walks you through installing Pandino and writing your first service. Choose the integration path that matches your project.

## Prerequisites

- **Node.js** >= 18
- **npm** or **pnpm** package manager
- **TypeScript** configured with decorator support:

```json
// tsconfig.json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

::: warning
Without `experimentalDecorators` and `emitDecoratorMetadata` enabled, decorator metadata will not be emitted and Pandino will not be able to activate your components.
:::

## Path 1: Core Framework Only

Use this path when you want the service registry and bundle system without any UI framework integration.

### Install

```bash
npm install @pandino/pandino reflect-metadata
```

Import `reflect-metadata` **once** at the entry point of your application, before any other Pandino imports:

```typescript
import 'reflect-metadata';
```

### Bootstrap the framework

```typescript
import 'reflect-metadata';
import { OSGiBootstrap, LogLevel } from '@pandino/pandino';

const bootstrap = new OSGiBootstrap({
  frameworkLogLevel: LogLevel.INFO,
});

const framework = await bootstrap.start();
const context = framework.getBundleContext();
```

### Register and consume a service

```typescript
// Define a service interface
interface GreetingService {
  sayHello(name: string): string;
}

// Create an implementation
class SimpleGreetingService implements GreetingService {
  sayHello(name: string): string {
    return `Hello, ${name}!`;
  }
}

// Register the service
const registration = context.registerService(
  'GreetingService',
  new SimpleGreetingService(),
);

// Look up and use the service
const ref = context.getServiceReference<GreetingService>('GreetingService')!;
const service = context.getService(ref)!;
console.log(service.sayHello('World')); // "Hello, World!"

// Clean up when done
context.ungetService(ref);
registration.unregister();
```

This imperative approach gives you full control over service registration and lookup. For declarative service definitions using decorators, see [Path 2](#path-2-react-integration) or the [Decorators guide](/guide/decorators).

## Path 2: React Integration

Use this path when building a React application. The `@pandino/react-hooks` package provides a context provider and hooks that make service discovery feel native to React.

### Install

```bash
npm install @pandino/pandino @pandino/react-hooks reflect-metadata
```

Peer dependencies: `react` and `react-dom` (v19+).

### Wrap your app with PandinoProvider

```tsx
// main.tsx
import 'reflect-metadata';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { PandinoProvider } from '@pandino/react-hooks';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PandinoProvider
      bundles={[
        import('./bundles/greeting-bundle'),
        // ...more bundle modules
      ]}
    >
      <App />
    </PandinoProvider>
  </StrictMode>,
);
```

The provider bootstraps the framework, installs the bundle modules you pass via `bundles`, and makes the `BundleContext` available through React context.

### Consume a service with useService

```tsx
// App.tsx
import { useService } from '@pandino/react-hooks';

interface GreetingService {
  sayHello(name: string): string;
}

export default function App() {
  const { service, loading, error } = useService<GreetingService>('GreetingService');

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;
  if (!service) return <p>GreetingService unavailable</p>;

  return <h1>{service.sayHello('React')}</h1>;
}
```

The `useService` hook resolves a service by interface name and automatically re-renders when the service becomes available or changes. It also releases the service reference on unmount.

## Path 3: With Rollup Bundle Plugin

Use this path when you want to automate bundle packaging. The plugin scans your source files for `@Component` classes at build time and emits a Pandino bundle module -- no manual wiring required.

### Install

```bash
npm install -D @pandino/rollup-bundle-plugin
```

If you are also using decorators:

```bash
npm install @pandino/decorators reflect-metadata
```

### Configure in vite.config.ts

```typescript
// vite.config.ts
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import pandinoBundle from '@pandino/rollup-bundle-plugin';

const pkg = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8'));

export default defineConfig({
  plugins: [
    pandinoBundle({
      virtualId: 'pandino:bundle:my-feature',
      include: ['src/bundles/my-feature/**/*.{ts,tsx}'],
      activator: 'src/bundles/my-feature/activator.ts',
      headers: {
        bundleSymbolicName: `${pkg.name}.my-feature`,
        bundleVersion: pkg.version,
      },
    }),
  ],
});
```

The plugin produces a virtual module that you can import and pass to `PandinoProvider` or install programmatically:

```typescript
// Import the virtual module generated by the plugin
import myFeatureBundle from 'pandino:bundle:my-feature';

// Pass it to PandinoProvider
<PandinoProvider bundles={[myFeatureBundle]}>
  <App />
</PandinoProvider>
```

For a complete reference of plugin options, see the [Rollup Bundle Plugin guide](/guide/rollup-plugin).

## What's Next

Now that you have Pandino running, explore these guides to go deeper:

- [Core Framework](/guide/core-framework) -- Service registry, bundles, event system, configuration management, and all built-in services
- [Decorators](/guide/decorators) -- Declarative service components with `@Component`, `@Service`, `@Reference`, and lifecycle callbacks
- [React Hooks](/guide/react-hooks) -- All available hooks and components for React integration
- [Services concept](/concepts/services) -- How services, service references, and service properties work together
