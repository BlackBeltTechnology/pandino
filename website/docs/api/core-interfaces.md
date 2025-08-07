---
sidebar_position: 1
---

# Core Interfaces

Pandino provides a set of core interfaces that define the fundamental components of the framework. Understanding these interfaces is essential for working with Pandino effectively.

## BundleContext

The `BundleContext` is the primary interface for interacting with the framework. It provides methods for registering and discovering services, installing bundles, and accessing framework information.

### Service Registration

```typescript
import type { BundleContext, ServiceRegistration } from '@pandino/pandino';
import type { LogService } from './types';

function registerServices(context: BundleContext): ServiceRegistration<LogService> {
  // Register a service
  const registration = context.registerService<LogService>(
    'LogService',  // Service interface name
    {              // Service implementation
      debug: (message, error, data) => console.debug(`[DEBUG] ${message}`, error, data),
      info: (message, error, data) => console.info(`[INFO] ${message}`, error, data),
      warn: (message, error, data) => console.warn(`[WARN] ${message}`, error, data),
      error: (message, error, data) => console.error(`[ERROR] ${message}`, error, data)
    },
    {              // Service properties (optional)
      'service.vendor': 'Pandino',
      'service.description': 'Console log service',
      'service.ranking': 100
    }
  );

  return registration;
}
```

### Service Discovery

```typescript
import type { BundleContext, ServiceReference } from '@pandino/pandino';
import type { DatabaseService } from './types';

function findServices(context: BundleContext): void {
  // Get a single service reference
  const dbRef = context.getServiceReference<DatabaseService>('DatabaseService');

  if (dbRef) {
    // Get the service
    const dbService = context.getService(dbRef);

    if (dbService) {
      // Use the service
      const results = dbService.query('SELECT * FROM users');
      console.log('Query results:', results);

      // Release the service when done
      context.ungetService(dbRef);
    }
  }

  // Get all service references matching an interface
  const allDbRefs = context.getServiceReferences<DatabaseService>('DatabaseService');
  console.log(`Found ${allDbRefs.length} database services`);

  // Get service references with a filter
  const mysqlRefs = context.getServiceReferences<DatabaseService>(
    'DatabaseService',
    '(db.type=mysql)'
  );
  console.log(`Found ${mysqlRefs.length} MySQL database services`);
}
```

### Bundle Management

```typescript
import type { BundleContext, Bundle } from '@pandino/pandino';
import MyBundle from './bundles/my-bundle';

async function manageBundles(context: BundleContext): Promise<void> {
  // Get the current bundle
  const currentBundle = context.getBundle();
  console.log(`Current bundle: ${currentBundle.getSymbolicName()} v${currentBundle.getVersion()}`);

  // Get all bundles
  const allBundles = context.getBundles();
  console.log(`Total bundles: ${allBundles.length}`);

  // Install a new bundle using the Promise version (recommended for better bundler optimizations)
  // This approach allows bundlers to perform code splitting and lazy loading
  const bundlePromise = Promise.resolve({ default: MyBundle });
  const newBundle = await context.installBundle(bundlePromise);
  console.log(`Installed bundle: ${newBundle.getSymbolicName()}`);

  // In a real application, you would typically use dynamic imports:
  // const newBundle = await context.installBundle(import('./bundles/my-bundle'));

  // Start the bundle
  await newBundle.start();
  console.log(`Started bundle: ${newBundle.getSymbolicName()}`);

  // Find a bundle by ID
  const bundle = context.getBundle(newBundle.getBundleId());
  console.log(`Found bundle: ${bundle?.getSymbolicName()}`);
}
```

### Event Listeners

```typescript
import type { BundleContext, ServiceEvent, BundleEvent } from '@pandino/pandino';

function registerListeners(context: BundleContext): void {
  // Listen for service events
  context.addServiceListener((event: ServiceEvent) => {
    const ref = event.getServiceReference();
    const serviceId = ref.getProperty('service.id');

    switch (event.getType()) {
      case 'REGISTERED':
        console.log(`Service ${serviceId} registered`);
        break;
      case 'MODIFIED':
        console.log(`Service ${serviceId} modified`);
        break;
      case 'UNREGISTERING':
        console.log(`Service ${serviceId} unregistering`);
        break;
    }
  });

  // Listen for bundle events
  context.addBundleListener((event: BundleEvent) => {
    const bundle = event.getBundle();
    const bundleName = bundle.getSymbolicName();

    switch (event.getType()) {
      case 'INSTALLED':
        console.log(`Bundle ${bundleName} installed`);
        break;
      case 'STARTED':
        console.log(`Bundle ${bundleName} started`);
        break;
      case 'STOPPED':
        console.log(`Bundle ${bundleName} stopped`);
        break;
      case 'UNINSTALLED':
        console.log(`Bundle ${bundleName} uninstalled`);
        break;
    }
  });
}
```

## Bundle

The `Bundle` interface represents an installed bundle in the framework. It provides methods for managing the bundle's lifecycle and accessing its resources.

### Lifecycle Management

```typescript
import type { Bundle } from '@pandino/pandino';
import { BUNDLE_STATES } from '@pandino/pandino';

async function manageBundleLifecycle(bundle: Bundle): Promise<void> {
  // Get bundle information
  console.log(`Bundle ID: ${bundle.getBundleId()}`);
  console.log(`Symbolic Name: ${bundle.getSymbolicName()}`);
  console.log(`Version: ${bundle.getVersion()}`);
  console.log(`Location: ${bundle.getLocation()}`);

  // Check bundle state
  const state = bundle.getState();
  const stateString = Object.entries(BUNDLE_STATES)
    .find(([name, value]) => value === state)?.[0] || 'UNKNOWN';
  console.log(`State: ${stateString} (${state})`);

  // Start the bundle if it's not active
  if (state !== BUNDLE_STATES.ACTIVE) {
    await bundle.start();
    console.log(`Bundle started: ${bundle.getSymbolicName()}`);
  }

  // Stop the bundle
  await bundle.stop();
  console.log(`Bundle stopped: ${bundle.getSymbolicName()}`);

  // Update the bundle
  await bundle.update(/* new bundle content */);
  console.log(`Bundle updated: ${bundle.getSymbolicName()}`);

  // Uninstall the bundle
  await bundle.uninstall();
  console.log(`Bundle uninstalled: ${bundle.getSymbolicName()}`);
}
```

### Resource Access

```typescript
import type { Bundle } from '@pandino/pandino';

function accessBundleResources(bundle: Bundle): void {
  // Get a specific resource
  const cssUrl = bundle.getResource('assets/styles.css');
  if (cssUrl) {
    console.log(`CSS URL: ${cssUrl}`);
  }

  // Find resources matching a pattern
  const jsonFiles = bundle.findResources('config', '*.json');
  console.log(`Found ${jsonFiles.length} JSON files`);

  // Get bundle headers
  const headers = bundle.getHeaders();
  console.log('Bundle headers:', headers);

  // Get a specific header
  const vendor = bundle.getHeader('Bundle-Vendor');
  console.log(`Bundle vendor: ${vendor}`);
}
```

## ServiceReference

The `ServiceReference` interface represents a reference to a service registered in the service registry. It provides methods for accessing service properties and comparing service rankings.

```typescript
import type { BundleContext, ServiceReference } from '@pandino/pandino';
import type { LogService } from './types';

function useServiceReferences(context: BundleContext): void {
  // Get a service reference
  const logRef = context.getServiceReference<LogService>('LogService');

  if (logRef) {
    // Get service properties
    const serviceId = logRef.getProperty('service.id');
    const serviceRanking = logRef.getProperty('service.ranking');
    const bundleId = logRef.getBundle().getBundleId();

    console.log(`Log service: ID=${serviceId}, Ranking=${serviceRanking}, Bundle=${bundleId}`);

    // Get all property names
    const propertyNames = logRef.getPropertyKeys();
    console.log('Property names:', propertyNames);

    // Compare with another reference
    const anotherRef = context.getServiceReference<LogService>('LogService');
    if (anotherRef) {
      const isEqual = logRef.equals(anotherRef);
      console.log(`References are ${isEqual ? 'equal' : 'different'}`);

      // Compare by service ranking
      const comparison = logRef.compareTo(anotherRef);
      if (comparison > 0) {
        console.log('First reference has higher ranking');
      } else if (comparison < 0) {
        console.log('Second reference has higher ranking');
      } else {
        console.log('References have equal ranking');
      }
    }
  }
}
```

## ServiceRegistration

The `ServiceRegistration` interface represents a registered service. It provides methods for updating service properties and unregistering the service.

```typescript
import type { BundleContext, ServiceRegistration } from '@pandino/pandino';
import type { ConfigService } from './types';

function manageServiceRegistration(context: BundleContext): void {
  // Register a service
  const registration = context.registerService<ConfigService>('ConfigService', {
    getConfig: (key) => ({ value: 'default' }),
    setConfig: (key, value) => console.log(`Setting ${key}=${value}`)
  }, {
    'service.description': 'Configuration service',
    'service.vendor': 'Pandino',
    'config.type': 'memory'
  });

  // Get the service reference
  const reference = registration.getReference();
  console.log(`Registered service: ${reference.getProperty('service.id')}`);

  // Update service properties
  registration.setProperties({
    'config.type': 'persistent',
    'config.location': '/path/to/config',
    'service.description': 'Persistent configuration service'
  });
  console.log('Updated service properties');

  // Unregister the service
  registration.unregister();
  console.log('Service unregistered');
}
```

## BundleActivator

The `BundleActivator` interface is implemented by bundles to manage their lifecycle. It provides methods for starting and stopping the bundle.

```typescript
import type { BundleActivator, BundleContext, ServiceRegistration } from '@pandino/pandino';
import { LogService, ConfigService, DatabaseService } from './services';

class MyBundleActivator implements BundleActivator {
  private serviceRegistrations: ServiceRegistration<any>[] = [];

  async start(context: BundleContext): Promise<void> {
    console.log(`Bundle ${context.getBundle().getSymbolicName()} starting`);

    // Register services
    this.serviceRegistrations.push(
      context.registerService('LogService', new LogService()),
      context.registerService('ConfigService', new ConfigService()),
      context.registerService('DatabaseService', new DatabaseService(), {
        'db.type': 'in-memory',
        'db.name': 'default'
      })
    );

    // Register event listeners
    context.addServiceListener((event) => {
      console.log(`Service event: ${event.getType()}`);
    });

    console.log(`Bundle ${context.getBundle().getSymbolicName()} started`);
  }

  async stop(context: BundleContext): Promise<void> {
    console.log(`Bundle ${context.getBundle().getSymbolicName()} stopping`);

    // Unregister all services
    for (const registration of this.serviceRegistrations) {
      registration.unregister();
    }
    this.serviceRegistrations = [];

    console.log(`Bundle ${context.getBundle().getSymbolicName()} stopped`);
  }
}

// Export the bundle definition
export default {
  headers: {
    bundleSymbolicName: 'com.example.my-bundle',
    bundleVersion: '1.0.0',
    bundleName: 'My Bundle',
    bundleDescription: 'Example bundle with activator',
    bundleVendor: 'Example Corp'
  },
  activator: new MyBundleActivator()
};
```

## ServiceListener

The `ServiceListener` interface is implemented by objects that want to be notified of service events in the framework.

```typescript
import type { ServiceListener, ServiceEvent } from '@pandino/pandino';

class MyServiceListener implements ServiceListener {
  serviceChanged(event: ServiceEvent): void {
    const ref = event.getServiceReference();
    const serviceId = ref.getProperty('service.id');
    const interfaceName = ref.getProperty('objectClass')[0];

    switch (event.getType()) {
      case 'REGISTERED':
        console.log(`Service registered: ${interfaceName} (ID: ${serviceId})`);
        break;
      case 'MODIFIED':
        console.log(`Service modified: ${interfaceName} (ID: ${serviceId})`);
        break;
      case 'UNREGISTERING':
        console.log(`Service unregistering: ${interfaceName} (ID: ${serviceId})`);
        break;
    }
  }
}

// Usage
context.addServiceListener(new MyServiceListener());

// Or with a function
context.addServiceListener((event) => {
  console.log(`Service event: ${event.getType()}`);
});
```

## BundleListener

The `BundleListener` interface is implemented by objects that want to be notified of bundle events in the framework.

```typescript
import type { BundleListener, BundleEvent } from '@pandino/pandino';

class MyBundleListener implements BundleListener {
  bundleChanged(event: BundleEvent): void {
    const bundle = event.getBundle();
    const bundleName = bundle.getSymbolicName();

    switch (event.getType()) {
      case 'INSTALLED':
        console.log(`Bundle installed: ${bundleName}`);
        break;
      case 'RESOLVED':
        console.log(`Bundle resolved: ${bundleName}`);
        break;
      case 'STARTING':
        console.log(`Bundle starting: ${bundleName}`);
        break;
      case 'STARTED':
        console.log(`Bundle started: ${bundleName}`);
        break;
      case 'STOPPING':
        console.log(`Bundle stopping: ${bundleName}`);
        break;
      case 'STOPPED':
        console.log(`Bundle stopped: ${bundleName}`);
        break;
      case 'UNRESOLVED':
        console.log(`Bundle unresolved: ${bundleName}`);
        break;
      case 'UNINSTALLED':
        console.log(`Bundle uninstalled: ${bundleName}`);
        break;
    }
  }
}

// Usage
context.addBundleListener(new MyBundleListener());

// Or with a function
context.addBundleListener((event) => {
  console.log(`Bundle event: ${event.getType()}`);
});
```

## Framework

The `Framework` interface extends the `Bundle` interface and represents the OSGi framework itself. It provides methods for managing the framework's lifecycle.

```typescript
import { OSGiBootstrap } from '@pandino/pandino';
import type { Framework } from '@pandino/pandino';

async function manageFramework(): Promise<void> {
  // Create and start the framework
  const bootstrap = new OSGiBootstrap();
  const framework = await bootstrap.start();

  // Get the bundle context
  const context = framework.getBundleContext();
  console.log('Framework started');

  // Use the context to register services, install bundles, etc.

  // Stop the framework
  await framework.stop();
  console.log('Framework stopped');

  // Wait for the framework to stop completely
  await framework.waitForStop(10000); // Timeout in milliseconds
  console.log('Framework fully stopped');
}
```

## ServiceTracker

The `ServiceTracker` class simplifies the process of tracking services in the service registry. It provides methods for tracking services that match a specific interface or filter.

```typescript
import { ServiceTracker } from '@pandino/pandino';
import type { BundleContext, ServiceReference } from '@pandino/pandino';
import type { LogService, DatabaseService } from './types';

class ServiceManager {
  private logTracker: ServiceTracker<LogService>;
  private dbTracker: ServiceTracker<DatabaseService>;

  constructor(private context: BundleContext) {
    // Create a tracker for LogService
    this.logTracker = new ServiceTracker<LogService>(context, 'LogService');

    // Create a tracker for DatabaseService with custom handlers
    this.dbTracker = new ServiceTracker<DatabaseService>(context, 'DatabaseService', {
      addingService: (ref: ServiceReference<DatabaseService>) => {
        const service = context.getService(ref);
        console.log('Database service added');
        return service;
      },
      modifiedService: (ref: ServiceReference<DatabaseService>, service: DatabaseService) => {
        console.log('Database service modified');
        return service;
      },
      removedService: (ref: ServiceReference<DatabaseService>, service: DatabaseService) => {
        console.log('Database service removed');
        context.ungetService(ref);
      }
    });
  }

  start(): void {
    // Open the trackers to start tracking services
    this.logTracker.open();
    this.dbTracker.open();
    console.log('Service trackers opened');
  }

  stop(): void {
    // Close the trackers to stop tracking services
    this.logTracker.close();
    this.dbTracker.close();
    console.log('Service trackers closed');
  }

  getLogService(): LogService | null {
    return this.logTracker.getService();
  }

  getAllLogServices(): LogService[] {
    return this.logTracker.getServices() || [];
  }

  getDatabaseService(): DatabaseService | null {
    return this.dbTracker.getService();
  }

  getAllDatabaseServices(): DatabaseService[] {
    return this.dbTracker.getServices() || [];
  }
}
```

## ComponentContext

The `ComponentContext` interface is provided to components when they are activated. It provides access to the component's properties and the bundle context.

```typescript
import { Component, Service, Activate, Deactivate } from '@pandino/decorators';
import type { ComponentContext } from '@pandino/pandino';

@Component({
  name: 'example.component',
  immediate: true,
  properties: {
    'example.property': 'value'
  }
})
@Service({ interfaces: ['ExampleService'] })
class ExampleComponent {
  private context: ComponentContext | null = null;

  @Activate
  activate(context: ComponentContext): void {
    this.context = context;

    // Get component properties
    const properties = context.getProperties();
    console.log('Component properties:', properties);

    // Get a specific property
    const exampleProperty = properties['example.property'];
    console.log(`example.property: ${exampleProperty}`);

    // Get the bundle context
    const bundleContext = context.getBundleContext();
    console.log(`Bundle: ${bundleContext.getBundle().getSymbolicName()}`);

    // Get the component instance
    const instance = context.getComponentInstance();
    console.log('Component instance:', instance);

    console.log('Component activated');
  }

  @Deactivate
  deactivate(context: ComponentContext): void {
    this.context = null;
    console.log('Component deactivated');
  }
}
```

## Conclusion

These core interfaces form the foundation of the Pandino framework. Understanding how to use them effectively is key to building modular, dynamic applications with Pandino. For more detailed information about each interface, refer to the API documentation.
