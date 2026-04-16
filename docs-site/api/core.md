---
title: Core API Reference
description: API reference for @pandino/pandino - all public exports from the core framework.
---

# Core API Reference

All exports from `@pandino/pandino`.

```ts
import { OSGiBootstrap, ServiceTracker, /* ... */ } from '@pandino/pandino';
```

## Bootstrap

| Export | Type | Description |
|--------|------|-------------|
| `OSGiBootstrap` | Class | Entry point for initializing the framework |
| `BootstrapConfig` | Interface | Configuration options for the bootstrap process |

### OSGiBootstrap

```ts
const bootstrap = new OSGiBootstrap({ frameworkLogLevel: LogLevel.DEBUG });
const framework = await bootstrap.start();
```

| Member | Signature | Description |
|--------|-----------|-------------|
| `constructor` | `new OSGiBootstrap(config?: BootstrapConfig)` | Creates a new bootstrap instance |
| `start` | `start(): Promise<OSGiFramework>` | Starts the framework and all built-in services |
| `stop` | `stop(): Promise<void>` | Stops the framework and all bundles |
| `getFramework` | `getFramework(): OSGiFramework` | Returns the framework instance |

### BootstrapConfig

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `frameworkLogLevel?` | `LogLevel` | `LogLevel.INFO` | Log level for framework-level logging |

## Framework & Bundle

| Export | Type | Description |
|--------|------|-------------|
| `OSGiFramework` | Class | The running framework instance |
| `Bundle` | Interface | Represents an installed bundle |
| `BundleContext` | Interface | Access point for bundle operations |
| `BundleActivator` | Interface | Lifecycle callbacks for a bundle |
| `BundleMetadata` | Interface | Bundle header metadata |
| `BundleModule` | Interface | Module format for bundle loading |

### OSGiFramework

The core framework class. Implements `BundleActivator`.

| Method | Signature | Description |
|--------|-----------|-------------|
| `start` | `start(): Promise<void>` | Starts the framework |
| `stop` | `stop(): Promise<void>` | Stops all bundles and the framework |
| `getBundleContext` | `getBundleContext(): BundleContext` | Returns the system bundle context |
| `getBundle` | `getBundle(id: number): Bundle \| null` | Returns a bundle by ID |
| `getBundles` | `getBundles(): Bundle[]` | Returns all installed bundles |
| `installBundle` | `installBundle(module: Promise<BundleModule>, config?): Promise<Bundle>` | Installs a bundle from a module promise |
| `installBundle` | `installBundle(location: string, config?): Promise<Bundle>` | Installs a bundle from a location string |

### Bundle

| Method | Signature | Description |
|--------|-----------|-------------|
| `getBundleId` | `getBundleId(): number` | Returns the bundle's unique identifier |
| `getSymbolicName` | `getSymbolicName(): string` | Returns the bundle's symbolic name |
| `getVersion` | `getVersion(): string` | Returns the bundle's version |
| `getState` | `getState(): BundleState` | Returns the current state (see `BUNDLE_STATES`) |
| `getHeaders` | `getHeaders(locale?: string): Record<string, string>` | Returns the bundle's headers |
| `getLocation` | `getLocation(): string` | Returns the bundle's install location |
| `start` | `start(options?: number): Promise<void>` | Starts the bundle |
| `stop` | `stop(options?: number): Promise<void>` | Stops the bundle |
| `update` | `update(source?: ReadableStream): Promise<void>` | Updates the bundle |
| `uninstall` | `uninstall(): Promise<void>` | Uninstalls the bundle |
| `getRegisteredServices` | `getRegisteredServices(): ServiceReference<any>[]` | Returns services registered by this bundle |
| `getServicesInUse` | `getServicesInUse(): ServiceReference<any>[]` | Returns services currently used by this bundle |
| `getContext` | `getContext(): BundleContext` | Returns the bundle's context |
| `getBundleModule` | `getBundleModule(): BundleModule \| null` | Returns the original bundle module |
| `getResource` | `getResource(path: string): string \| null` | Returns a resource by logical path |
| `findResources` | `findResources(basePath: string, pattern: string): string[]` | Finds resources matching a glob pattern |

### BundleContext

| Method | Signature | Description |
|--------|-----------|-------------|
| `registerService` | `registerService<S>(clazz: string \| string[] \| Function, service: S, properties?: Record<string, any>): ServiceRegistration<S>` | Registers a service |
| `getServiceReference` | `getServiceReference<S>(clazz: string \| Function): ServiceReference<S> \| null` | Gets the best matching service reference |
| `getServiceReferences` | `getServiceReferences<S>(clazz: string \| Function, filter?: string \| null): ServiceReference<S>[] \| null` | Gets all matching service references |
| `getService` | `getService<S>(reference: ServiceReference<S>): S \| null` | Gets the service object from a reference |
| `ungetService` | `ungetService(reference: ServiceReference<any>): boolean` | Releases a service reference |
| `installBundle` | `installBundle(module: Promise<BundleModule>, config?): Promise<Bundle>` | Installs a bundle |
| `addServiceListener` | `addServiceListener(listener: ServiceListener, filter?: string): void` | Adds a service event listener |
| `removeServiceListener` | `removeServiceListener(listener: ServiceListener): void` | Removes a service event listener |
| `addBundleListener` | `addBundleListener(listener: BundleListener): void` | Adds a bundle event listener |
| `removeBundleListener` | `removeBundleListener(listener: BundleListener): void` | Removes a bundle event listener |
| `createFilter` | `createFilter(filter: string): Filter` | Creates an LDAP filter |
| `getBundle` | `getBundle(): Bundle` | Returns this context's bundle |
| `getBundles` | `getBundles(): Bundle[]` | Returns all installed bundles |
| `getProperty` | `getProperty(key: string): string \| undefined` | Returns a framework property |
| `getLogService` | `getLogService(): LogService \| null` | Returns the log service if available |
| `getDataFile` | `getDataFile(filename: string): string` | Returns a data file path for the bundle |

### BundleActivator

```ts
class MyActivator implements BundleActivator {
  async start(context: BundleContext) { /* register services */ }
  async stop(context: BundleContext) { /* cleanup */ }
}
```

| Method | Signature | Description |
|--------|-----------|-------------|
| `start` | `start(context: BundleContext): void \| Promise<void>` | Called when the bundle is started |
| `stop` | `stop(context: BundleContext): void \| Promise<void>` | Called when the bundle is stopped |

### BundleMetadata

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `bundleSymbolicName` | `string` | Yes | Unique bundle identifier |
| `bundleVersion` | `string` | Yes | Semantic version string |
| `bundleName?` | `string` | No | Human-readable name |
| `bundleDescription?` | `string` | No | Bundle description |
| `bundleManifestVersion?` | `string` | No | Manifest format version |
| `bundleActivator?` | `string` | No | Activator class name |
| `importPackage?` | `string` | No | Required packages |
| `exportPackage?` | `string` | No | Exported packages |
| `requireBundle?` | `string` | No | Required bundles |

### BundleModule

The expected shape of a bundle module for `installBundle()`.

```ts
const bundleModule: BundleModule = {
  default: {
    headers: {
      bundleSymbolicName: 'com.example.my-bundle',
      bundleVersion: '1.0.0',
    },
    activator: new MyActivator(),
    components: [MyComponentClass],
    resources: { 'config.json': '{"key": "value"}' },
  },
};
```

| Property | Type | Description |
|----------|------|-------------|
| `default.headers` | `object` | Bundle metadata headers |
| `default.activator?` | `BundleActivator` | Optional lifecycle activator |
| `default.components?` | `(new (...args: any[]) => any)[]` | Optional SCR component classes |
| `default.resources?` | `Record<string, string>` | Optional resource map (logical path to content) |

## Service Registry

| Export | Type | Description |
|--------|------|-------------|
| `ServiceReference<S>` | Interface | Handle to look up a service |
| `ServiceRegistration<S>` | Interface | Handle for a registered service |
| `ServiceFactory<S>` | Interface | Factory for per-bundle service instances |
| `Filter` | Interface | LDAP filter for service matching |
| `ServiceTracker<S, T>` | Class | Tracks matching services dynamically |
| `ServiceTrackerCustomizer<S, T>` | Interface | Callbacks for customizing service tracking |

### ServiceReference\<S\>

| Method | Signature | Description |
|--------|-----------|-------------|
| `getProperty` | `getProperty(key: string): any` | Returns a service property |
| `getPropertyKeys` | `getPropertyKeys(): string[]` | Returns all property keys |
| `getBundle` | `getBundle(): Bundle` | Returns the bundle that registered the service |
| `getProperties` | `getProperties(): Record<string, any>` | Returns all service properties |
| `isAssignableTo` | `isAssignableTo(bundle: Bundle, className: string): boolean` | Checks assignment compatibility |

### ServiceRegistration\<S\>

| Method | Signature | Description |
|--------|-----------|-------------|
| `getReference` | `getReference(): ServiceReference<S>` | Returns the service reference |
| `setProperties` | `setProperties(properties: Record<string, any>): void` | Updates service properties |
| `unregister` | `unregister(): void` | Unregisters the service |

### ServiceFactory\<S\>

```ts
const factory: ServiceFactory<MyService> = {
  getService(bundle, registration) { return new MyServiceImpl(bundle); },
  ungetService(bundle, registration, service) { service.dispose(); },
};
```

| Method | Signature | Description |
|--------|-----------|-------------|
| `getService` | `getService(bundle: Bundle, registration: ServiceRegistration<S>): S` | Creates a service instance for a bundle |
| `ungetService` | `ungetService(bundle: Bundle, registration: ServiceRegistration<S>, service: S): void` | Releases a service instance |

### Filter

| Method | Signature | Description |
|--------|-----------|-------------|
| `match` | `match(properties: Record<string, any>): boolean` | Tests whether properties match the filter |
| `toString` | `toString(): string` | Returns the LDAP filter string |

### ServiceTracker\<S, T\>

```ts
const tracker = new ServiceTracker(context, 'MyService');
tracker.open();
const service = tracker.getService();
```

| Member | Signature | Description |
|--------|-----------|-------------|
| `constructor` | `new ServiceTracker(context, referenceOrClassNameOrFilter, customizer?)` | Creates a tracker. Second argument can be a `ServiceReference`, class name `string`, `Function`, or `Filter` |
| `open` | `open(): ServiceTracker<S, T>` | Starts tracking; returns itself for chaining |
| `close` | `close(): void` | Stops tracking and releases all tracked services |
| `getService` | `getService(reference?): T \| null` | Returns the highest-ranked tracked service, or one by reference |
| `getServices` | `getServices(): T[]` | Returns all tracked service objects |
| `getServiceReferences` | `getServiceReferences(): ServiceReference<S>[] \| null` | Returns tracked references sorted by ranking |
| `size` | `size(): number` | Returns the number of tracked services |

### ServiceTrackerCustomizer\<S, T\>

| Method | Signature | Description |
|--------|-----------|-------------|
| `addingService` | `addingService(reference: ServiceReference<S>, service: S): T \| null` | Called when a service is being added. Return `null` to skip tracking |
| `modifiedService` | `modifiedService(reference: ServiceReference<S>, service: S, tracked: T): void` | Called when a tracked service's properties change |
| `removedService` | `removedService(reference: ServiceReference<S>, service: S, tracked: T): void` | Called when a tracked service is unregistering |

## Events & Listeners

| Export | Type | Description |
|--------|------|-------------|
| `ServiceEvent` | Class | Fired on service registry changes |
| `BundleEvent` | Class | Fired on bundle lifecycle changes |
| `ServiceListener` | Interface | Listener for service events |
| `BundleListener` | Interface | Listener for bundle events |

### ServiceEvent

| Member | Signature | Description |
|--------|-----------|-------------|
| `constructor` | `new ServiceEvent(type: ServiceEventType, reference: ServiceReference<any>)` | Creates a service event |
| `getType` | `getType(): ServiceEventType` | Returns the event type (see `SERVICE_EVENT_TYPES`) |
| `getServiceReference` | `getServiceReference(): ServiceReference<any>` | Returns the affected service reference |

### BundleEvent

| Member | Signature | Description |
|--------|-----------|-------------|
| `constructor` | `new BundleEvent(type: number, bundle: Bundle)` | Creates a bundle event |
| `getType` | `getType(): number` | Returns the event type |
| `getBundle` | `getBundle(): Bundle` | Returns the affected bundle |

### ServiceListener

| Method | Signature | Description |
|--------|-----------|-------------|
| `serviceChanged` | `serviceChanged(event: ServiceEvent): void` | Called when a service event occurs |

### BundleListener

| Method | Signature | Description |
|--------|-----------|-------------|
| `bundleChanged` | `bundleChanged(event: BundleEvent): void` | Called when a bundle event occurs |

## Built-in Services

### Event Admin

| Export | Type | Description |
|--------|------|-------------|
| `EventAdmin` | Interface | Publish-subscribe event service |
| `Event` | Class | An event with a topic and properties |
| `EventHandler` | Interface | Handler for events |

#### EventAdmin

| Method | Signature | Description |
|--------|-----------|-------------|
| `postEvent` | `postEvent(event: Event): void` | Posts an event asynchronously |
| `sendEvent` | `sendEvent(event: Event): void` | Sends an event synchronously |

#### Event

```ts
const event = new Event('com/example/topic', { key: 'value' });
```

| Member | Signature | Description |
|--------|-----------|-------------|
| `constructor` | `new Event(topic: string, properties?: Record<string, any>)` | Creates an event |
| `getTopic` | `getTopic(): string` | Returns the event topic |
| `getProperty` | `getProperty(name: string): any` | Returns a property value |
| `getProperties` | `getProperties(): Record<string, any>` | Returns a copy of all properties |
| `getPropertyNames` | `getPropertyNames(): string[]` | Returns all property keys |
| `containsProperty` | `containsProperty(name: string): boolean` | Checks if a property exists |

#### EventHandler

| Method | Signature | Description |
|--------|-----------|-------------|
| `handleEvent` | `handleEvent(event: Event): void` | Called when a matching event is received |

### Configuration Admin

| Export | Type | Description |
|--------|------|-------------|
| `ConfigurationAdmin` | Interface | Service for managing configurations |
| `Configuration` | Interface | A single configuration instance |
| `ManagedService` | Interface | Service that receives configuration updates |
| `ManagedServiceFactory` | Interface | Factory that receives per-PID configuration updates |
| `ConfigurationEventType` | Enum | Type of configuration change |
| `ConfigurationEvent` | Interface | Event for configuration changes |
| `ConfigurationListener` | Interface | Listener for configuration events |

#### ConfigurationAdmin

| Method | Signature | Description |
|--------|-----------|-------------|
| `getConfiguration` | `getConfiguration(pid: string, location?: string): Promise<Configuration>` | Gets or creates a configuration by PID |
| `createFactoryConfiguration` | `createFactoryConfiguration(factoryPid: string, location?: string): Promise<Configuration>` | Creates a new factory configuration |
| `listConfigurations` | `listConfigurations(filter?: string): Promise<Configuration[] \| null>` | Lists configurations matching a filter |

#### Configuration

| Method | Signature | Description |
|--------|-----------|-------------|
| `getPid` | `getPid(): string` | Returns the configuration PID |
| `getFactoryPid` | `getFactoryPid(): string \| null` | Returns the factory PID, if any |
| `getProperties` | `getProperties(): Record<string, any> \| null` | Returns configuration properties |
| `update` | `update(properties: Record<string, any>): Promise<void>` | Updates configuration properties |
| `delete` | `delete(): Promise<void>` | Deletes the configuration |
| `getBundleLocation` | `getBundleLocation(): string \| null` | Returns the bound bundle location |
| `setBundleLocation` | `setBundleLocation(location: string \| null): Promise<void>` | Sets the bundle location binding |

#### ManagedService

| Method | Signature | Description |
|--------|-----------|-------------|
| `updated` | `updated(properties: Record<string, any> \| null): void \| Promise<void>` | Called when configuration is updated or deleted |

#### ManagedServiceFactory

| Method | Signature | Description |
|--------|-----------|-------------|
| `getName` | `getName(): string` | Returns the factory name |
| `updated` | `updated(pid: string, properties: Record<string, any>): void \| Promise<void>` | Called when a factory configuration is created or updated |
| `deleted` | `deleted(pid: string): void \| Promise<void>` | Called when a factory configuration is deleted |

#### ConfigurationEventType

| Value | Number | Description |
|-------|--------|-------------|
| `UPDATED` | `1` | Configuration was updated |
| `DELETED` | `2` | Configuration was deleted |

#### ConfigurationEvent

| Method | Signature | Description |
|--------|-----------|-------------|
| `getPid` | `getPid(): string` | Returns the PID of the changed configuration |
| `getFactoryPid` | `getFactoryPid(): string \| null` | Returns the factory PID, if any |
| `getType` | `getType(): ConfigurationEventType` | Returns the event type |

#### ConfigurationListener

| Method | Signature | Description |
|--------|-----------|-------------|
| `configurationEvent` | `configurationEvent(event: ConfigurationEvent): void` | Called when a configuration change occurs |

### Log Service

| Export | Type | Description |
|--------|------|-------------|
| `LogService` | Interface | Logging service |
| `LogLevel` | Enum | Logging severity levels |

#### LogService

| Method | Signature | Description |
|--------|-----------|-------------|
| `log` | `log(level: LogLevel, message: string, exception?: Error, context?: Record<string, unknown>): void` | Logs at a specific level |
| `error` | `error(message: string, exception?: Error, context?: Record<string, unknown>): void` | Logs an error |
| `warn` | `warn(message: string, exception?: Error, context?: Record<string, unknown>): void` | Logs a warning |
| `info` | `info(message: string, exception?: Error, context?: Record<string, unknown>): void` | Logs an informational message |
| `debug` | `debug(message: string, exception?: Error, context?: Record<string, unknown>): void` | Logs a debug message |
| `isLoggable` | `isLoggable(level: LogLevel): boolean` | Checks if a level is currently loggable |
| `setLogLevel` | `setLogLevel(level: LogLevel): void` | Sets the minimum log level |
| `getLogLevel` | `getLogLevel(): LogLevel` | Returns the current log level |
| `addLogListener` | `addLogListener(listener: LogListener): void` | Adds a log listener |
| `removeLogListener` | `removeLogListener(listener: LogListener): void` | Removes a log listener |

#### LogLevel

| Value | Number | Description |
|-------|--------|-------------|
| `ERROR` | `1` | Error conditions |
| `WARN` | `2` | Warning conditions |
| `INFO` | `3` | Informational messages |
| `DEBUG` | `4` | Debug-level messages |

## Declarative Services

| Export | Type | Description |
|--------|------|-------------|
| `ServiceComponentRuntime` | Class | The SCR service that manages component lifecycle |
| `ComponentContext` | Interface | Context available to activated components |
| `getDecoratorInfo` | Function | Returns decorator metadata for a component class |

### ServiceComponentRuntime

| Method | Signature | Description |
|--------|-----------|-------------|
| `registerComponent` | `registerComponent(classRef: any, bundleId?: number): Promise<void>` | Registers and activates a decorated component class |

### ComponentContext

Passed to `@Activate` methods and available during component lifecycle.

| Method | Signature | Description |
|--------|-----------|-------------|
| `getBundleContext` | `getBundleContext(): BundleContext` | Returns the owning bundle's context |
| `getProperties` | `getProperties(): Record<string, any>` | Returns the component's properties |
| `getServiceReference` | `getServiceReference(): ServiceReference<any>` | Returns this component's service reference |
| `getComponentName` | `getComponentName(): string` | Returns the component name |
| `locateService` | `locateService<S>(name: string): S \| null` | Looks up a bound service by reference name |
| `locateServices` | `locateServices<S>(name: string): S[]` | Looks up all bound services by reference name |
| `disableComponent` | `disableComponent(name: string): void` | Disables a component by name |
| `enableComponent` | `enableComponent(name: string): void` | Enables a component by name |

### getDecoratorInfo

```ts
import { getDecoratorInfo } from '@pandino/pandino';

const info = getDecoratorInfo(MyComponentClass);
// info.component, info.service, info.configuration, info.lifecycle, info.references
```

Returns a `DecoratorInfo` object with the following shape:

| Property | Type | Description |
|----------|------|-------------|
| `component` | `ComponentInfo` | Component name, enabled, immediate, factory status |
| `service` | `ServiceInfo` | Service interfaces and scope |
| `configuration` | `ConfigurationInfo` | Configuration PID, policy, and properties |
| `lifecycle` | `LifecycleInfo` | Names of activate, deactivate, and modified methods |
| `references` | `ReferenceDescriptor[]` | Array of reference descriptors |
| `rawMetadata` | `ComponentDescriptor \| null` | The full component descriptor, if present |
| `customDecorators` | `Record<string, any>` | Custom class-level decorator metadata |
| `customFieldDecorators` | `Record<string, Record<string, any>>` | Custom field-level decorator metadata |
| `customMethodDecorators` | `Record<string, Record<string, any>>` | Custom method-level decorator metadata |

## Constants

| Export | Type | Description |
|--------|------|-------------|
| `BUNDLE_STATES` | `object` | Numeric constants for bundle states |
| `SERVICE_EVENT_TYPES` | `object` | Numeric constants for service event types |

### BUNDLE_STATES

| Key | Value | Description |
|-----|-------|-------------|
| `INSTALLED` | `2` | Bundle has been installed |
| `RESOLVED` | `4` | Bundle dependencies are resolved |
| `STARTING` | `8` | Bundle is starting |
| `ACTIVE` | `32` | Bundle is running |
| `STOPPING` | `16` | Bundle is stopping |
| `UNINSTALLED` | `1` | Bundle has been uninstalled |

### SERVICE_EVENT_TYPES

| Key | Value | Description |
|-----|-------|-------------|
| `REGISTERED` | `1` | A service was registered |
| `MODIFIED` | `2` | A service's properties were modified |
| `UNREGISTERING` | `4` | A service is being unregistered |
| `MODIFIED_ENDMATCH` | `8` | A service was modified and no longer matches a listener's filter |
