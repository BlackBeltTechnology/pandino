---
title: React Hooks Guide
description: Guide to @pandino/react-hooks - React bindings for the Pandino framework with hooks and components.
---

# React Hooks

React bindings for the Pandino framework. Start the runtime, install bundles, and consume services from React components using a small set of hooks and helpers.

## Where it fits in the Pandino ecosystem

```
                 +--------------------------+
                 |   @pandino/pandino       |
                 |   (service registry,     |
                 |    bundles, SCR)         |
                 +------------+-------------+
                              | starts & wraps
                              v
                 +--------------------------+
                 |   @pandino/react-hooks   |
                 |   <PandinoProvider>      |
                 |   useService / useBundle |
                 |   useServiceTracker ...  |
                 +------------+-------------+
                              | consumed by
                              v
                        Your React tree
```

This package wraps the Pandino framework with a React context and exposes idiomatic hooks for service discovery, dynamic registration, and bundle introspection.

## Installation

```bash
npm install @pandino/pandino @pandino/react-hooks reflect-metadata
```

Peer dependencies: `react` and `react-dom` (v19+), `@pandino/pandino`.

Import `reflect-metadata` once at the entry point of your application:

```typescript
import 'reflect-metadata';
```

## Quick start

### 1. Wrap your app with `PandinoProvider`

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

The provider bootstraps the framework, installs every bundle module passed via `bundles`, and makes the `BundleContext` available through React context. Each entry is a dynamic `import()` returning a Pandino `BundleModule` -- typically produced by [`@pandino/rollup-bundle-plugin`](/guide/rollup-plugin).

### 2. Consume a service inside a component

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

## Hooks

### `useService<T>(serviceClass, filter?)`

Resolves a single service by interface name (and optional LDAP filter). Releases the service reference automatically when the component unmounts or the reference changes.

```tsx
const { service, loading, error } = useService<PaymentService>(
  'PaymentService',
  '(region=EU)',
);
```

Returns `{ service, loading, error }`.

### `useServiceTracker<T>(serviceClass, filter?)`

Tracks **all** services that match an interface (and optional filter). Re-renders whenever services appear, change, or disappear.

```tsx
const { services, loading, error } = useServiceTracker<PluginService>('PluginService');

return (
  <ul>
    {services.map((plugin, i) => <li key={i}>{plugin.name}</li>)}
  </ul>
);
```

### `useRegisterService<T>(serviceClass, implementation, properties?)`

Registers a service for the lifetime of the component. Useful when a React component itself wants to contribute a service to the registry.

```tsx
const { isRegistered, updateProperties } = useRegisterService('AnalyticsSink', {
  track: (event) => console.log(event),
}, { priority: 10 });
```

The service is unregistered automatically on unmount.

### `useBundle(idOrSymbolicName)`

Looks up a bundle by numeric id or symbolic name and exposes its lifecycle state.

```tsx
const { bundle, loading, error } = useBundle('com.example.database');
if (bundle) console.log(bundle.getState());
```

### `useBundleContext()` / `usePandinoContext()`

Low-level escape hatches that return the raw `BundleContext` or the full context value (`{ framework, bundleContext, isInitialized, error }`). Use them when you need APIs that don't have a dedicated hook.

```tsx
const context = useBundleContext();
const refs = context?.getServiceReferences('EventHandler', '(event.topics=user/*)');
```

## Components

### `<PandinoProvider>`

Root provider. Accepts:

| Prop              | Type                           | Purpose                                  |
| ----------------- | ------------------------------ | ---------------------------------------- |
| `bundles`         | `Array<Promise<BundleModule>>` | Bundle modules to install and start      |
| `bootstrapConfig` | `BootstrapConfig` (optional)   | Forwarded to the Pandino `OSGiBootstrap` |
| `children`        | `ReactNode`                    | Your application                         |

### `<BundleInfo bundleIdOrName>`

Renders a bundle's id, symbolic name, version, and state. Pass a `children` render prop to customise the output; otherwise a default table is rendered.

```tsx
<BundleInfo bundleIdOrName="com.example.database" />
```

### `<ServiceConsumer serviceClass filter?>`

Render-prop wrapper around `useService`. Handy when you prefer composition over hooks.

```tsx
<ServiceConsumer<GreetingService> serviceClass="GreetingService">
  {({ service, loading }) =>
    loading ? <Spinner /> : <h1>{service?.sayHello('world')}</h1>
  }
</ServiceConsumer>
```

### `<ComponentProxy serviceClass filter? ...props>`

Resolves a service that is itself a React component (or React element) and renders it with the remaining props. Useful for plugin-style UIs where the rendered component is provided by a bundle.

```tsx
<ComponentProxy serviceClass="DashboardWidget" filter="(slot=primary)" user={user} />
```

## Common patterns

### Gating UI on service availability

```tsx
function PremiumFeature({ children }: { children: React.ReactNode }) {
  const { service: auth } = useService<AuthService>('AuthService');
  const { service: flags } = useService<FeatureFlags>('FeatureFlags');

  if (!auth || !flags) return <p>Loading...</p>;
  if (!auth.isAuthenticated()) return <p>Please sign in.</p>;
  if (!flags.isEnabled('premium')) return <p>Feature unavailable.</p>;
  return <>{children}</>;
}
```

### Rendering a list from a whiteboard

```tsx
function Toolbar() {
  const { services: actions } = useServiceTracker<ToolbarAction>('ToolbarAction');

  return (
    <nav>
      {actions.map((a) => (
        <button key={a.id} onClick={a.invoke}>{a.label}</button>
      ))}
    </nav>
  );
}
```

### Filtering by service properties

```tsx
const { service: logger } = useService<LogService>('LogService', '(log.target=console)');
```

For the full hooks and components API reference, see [React Hooks API](/api/react-hooks).
