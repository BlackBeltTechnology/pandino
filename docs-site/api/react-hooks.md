---
title: React Hooks API Reference
description: API reference for @pandino/react-hooks - all hooks and components.
---

# React Hooks API Reference

All exports from `@pandino/react-hooks`.

```ts
import { PandinoProvider, useService, useServiceTracker, useRegisterService } from '@pandino/react-hooks';
```

## Hooks

| Hook | Return Type | Description |
|------|-------------|-------------|
| `useService` | `{ service, loading, error }` | Looks up a single service |
| `useServiceTracker` | `{ services, loading, error }` | Tracks all matching services dynamically |
| `useRegisterService` | `{ registration, isRegistered, error, updateProperties }` | Registers a service from a component |
| `useBundle` | `{ bundle, loading, error }` | Looks up a bundle by ID or symbolic name |
| `useAllBundles` | `{ bundles, loading, error }` | Returns all installed bundles |
| `useBundleContext` | `BundleContext \| null` | Returns the current bundle context |
| `usePandinoContext` | `PandinoContextType` | Returns the full Pandino context |

### useService

Looks up a single service by class name or function, with optional LDAP filter.

```ts
const { service, loading, error } = useService<MyService>('MyService');
const { service } = useService<MyService>('MyService', '(version>=2.0)');
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `serviceClass` | `string \| Function` | Service interface name or constructor |
| `filter?` | `string` | Optional LDAP filter |

| Return Property | Type | Description |
|-----------------|------|-------------|
| `service` | `T \| null` | The service instance, or `null` if not found |
| `loading` | `boolean` | `true` while the framework is initializing |
| `error` | `Error \| null` | Error if lookup failed |

### useServiceTracker

Tracks all matching services and re-renders when services are added, modified, or removed.

```ts
const { services, loading, error } = useServiceTracker<MyPlugin>('MyPlugin');
const { services } = useServiceTracker<MyPlugin>('MyPlugin', '(vendor=Example)');
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `serviceClass` | `string` | Service interface name |
| `filter?` | `string` | Optional LDAP filter (combined with objectClass automatically) |

| Return Property | Type | Description |
|-----------------|------|-------------|
| `services` | `T[]` | Array of tracked service instances |
| `loading` | `boolean` | `true` while the framework is initializing |
| `error` | `Error \| null` | Error if tracking failed |

### useRegisterService

Registers a service and automatically unregisters on unmount.

```ts
const myImpl = useMemo(() => ({ greet: () => 'Hello' }), []);
const { isRegistered, updateProperties } = useRegisterService('GreeterService', myImpl, { version: '1.0' });
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `serviceClass` | `string \| string[] \| Function` | Interface(s) to register under |
| `serviceImpl` | `T` | The service implementation object |
| `properties?` | `Record<string, any>` | Optional service properties |

| Return Property | Type | Description |
|-----------------|------|-------------|
| `registration` | `ServiceRegistration<T> \| null` | The registration handle |
| `isRegistered` | `boolean` | `true` after successful registration |
| `error` | `Error \| null` | Error if registration failed |
| `updateProperties` | `(newProperties: Record<string, any>) => void` | Updates the service properties |

### useBundle

Looks up a bundle by numeric ID or symbolic name.

```ts
const { bundle, loading, error } = useBundle('com.example.my-bundle');
const { bundle } = useBundle(3);
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `bundleIdOrName` | `number \| string` | Bundle ID or symbolic name |

| Return Property | Type | Description |
|-----------------|------|-------------|
| `bundle` | `Bundle \| null` | The bundle, or `null` if not found |
| `loading` | `boolean` | `true` while the framework is initializing |
| `error` | `Error \| null` | Error if lookup failed |

### useAllBundles

Returns all installed bundles.

```ts
const { bundles, loading, error } = useAllBundles();
```

| Return Property | Type | Description |
|-----------------|------|-------------|
| `bundles` | `Bundle[]` | All installed bundles |
| `loading` | `boolean` | `true` while the framework is initializing |
| `error` | `Error \| null` | Error if lookup failed |

### useBundleContext

Returns the `BundleContext` from the nearest `PandinoProvider`.

```ts
const context = useBundleContext();
if (context) {
  const ref = context.getServiceReference('MyService');
}
```

**Returns:** `BundleContext | null`

### usePandinoContext

Returns the full Pandino context including framework, bundle context, and initialization state.

```ts
const { framework, bundleContext, isInitialized, error } = usePandinoContext();
```

**Returns:** `PandinoContextType` (see [Types](#types) below)

## Components

| Component | Description |
|-----------|-------------|
| `<PandinoProvider>` | Initializes the framework and provides context to children |
| `<BundleInfo>` | Displays bundle information via render prop |
| `<ServiceConsumer>` | Consumes a service via render prop |
| `<ComponentProxy>` | Renders a service as a React component |

### PandinoProvider

Initializes the Pandino framework and provides it to the component tree.

```tsx
<PandinoProvider
  bootstrapConfig={{ frameworkLogLevel: LogLevel.DEBUG }}
  bundles={[import('./my-bundle')]}
>
  <App />
</PandinoProvider>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | - | Child components |
| `bootstrapConfig?` | `BootstrapConfig` | `{}` | Framework configuration |
| `bundles?` | `Array<Promise<BundleModule>>` | `[]` | Bundle modules to install and start on init |

### BundleInfo

Provides bundle information through a render prop. Without a render prop, renders a default info table.

```tsx
<BundleInfo bundleIdOrName="com.example.my-bundle">
  {({ bundle, loading, error, stateToString }) => (
    <span>{bundle ? stateToString(bundle.getState()) : 'N/A'}</span>
  )}
</BundleInfo>
```

| Prop | Type | Description |
|------|------|-------------|
| `bundleIdOrName` | `number \| string` | Bundle ID or symbolic name |
| `children?` | `(props: { bundle, loading, error, stateToString }) => ReactNode` | Render prop. If omitted, renders a default info table |

### ServiceConsumer

Consumes a service via render prop pattern.

```tsx
<ServiceConsumer<MyService> serviceClass="MyService" filter="(version>=2.0)">
  {({ service, loading, error }) => (
    service ? <div>{service.getData()}</div> : <div>Loading...</div>
  )}
</ServiceConsumer>
```

| Prop | Type | Description |
|------|------|-------------|
| `serviceClass` | `string \| Function` | Service interface name or constructor |
| `filter?` | `string` | Optional LDAP filter |
| `children` | `(props: { service: T \| null, loading: boolean, error: Error \| null }) => ReactNode` | Render prop |

### ComponentProxy

Renders a service as a React component. Falls back to `children` while loading or on error.

```tsx
<ComponentProxy serviceClass="WidgetComponent" filter="(type=header)">
  <FallbackWidget />
</ComponentProxy>
```

| Prop | Type | Description |
|------|------|-------------|
| `serviceClass` | `string \| Function` | Service interface to look up |
| `filter` | `string` | LDAP filter to match the service |
| `children?` | `ReactNode` | Fallback content shown while loading or on error |
| `...restProps` | `any` | Additional props passed to the rendered service component |

## Types

### PandinoContextType

| Property | Type | Description |
|----------|------|-------------|
| `framework` | `OSGiFramework \| null` | The framework instance |
| `bundleContext` | `BundleContext \| null` | The system bundle context |
| `isInitialized` | `boolean` | `true` once the framework and all initial bundles are started |
| `error` | `Error \| null` | Initialization error, if any |

### bundleStateToString

Utility function that converts a numeric bundle state to a human-readable string.

```ts
import { bundleStateToString } from '@pandino/react-hooks';

bundleStateToString(32); // 'ACTIVE'
bundleStateToString(1);  // 'UNINSTALLED'
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `state` | `number` | Numeric bundle state (from `BUNDLE_STATES`) |

**Returns:** `string` -- One of `'INSTALLED'`, `'RESOLVED'`, `'STARTING'`, `'ACTIVE'`, `'STOPPING'`, `'UNINSTALLED'`, or `'UNKNOWN (n)'`.
