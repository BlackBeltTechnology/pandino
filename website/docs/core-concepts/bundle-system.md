---
sidebar_position: 2
---

# Bundle System

The Bundle System is a core concept in Pandino that enables modular application architecture. Bundles are self-contained modules with their own lifecycle, allowing for dynamic loading, starting, stopping, and unloading of functionality.

## What is a Bundle?

A bundle is a logical container for a set of related functionality. It encapsulates:

- Code (services, components, utilities)
- Resources (configurations, assets)
- Metadata (name, version, dependencies)
- Lifecycle management (activation, deactivation)

Think of bundles as independent "mini-applications" that can be managed individually but work together through the service registry.

## Bundle Structure

In Pandino, a bundle is defined as a TypeScript/JavaScript module with a specific structure:

```typescript
import type { BundleActivator, BundleContext } from '@pandino/pandino';

// Bundle activator - handles lifecycle events
const activator: BundleActivator = {
  async start(context: BundleContext): Promise<void> {
    console.log('Bundle starting');
    // Register services, initialize resources
  },

  async stop(context: BundleContext): Promise<void> {
    console.log('Bundle stopping');
    // Unregister services, release resources
  }
};

// Bundle definition
export default {
  // Bundle metadata
  headers: {
    bundleSymbolicName: 'com.example.my-bundle',
    bundleVersion: '1.0.0',
    bundleName: 'My Example Bundle',
    bundleDescription: 'Provides example functionality',
    bundleVendor: 'Example Corp'
  },
  // Bundle activator
  activator,
  // Optional: Components for automatic registration by SCR
  components: [
    // Component classes with @Component decorators
  ]
};
```

## Bundle Lifecycle

Bundles go through a defined lifecycle managed by the framework:

1. **INSTALLED**: Bundle is installed but not yet resolved
2. **RESOLVED**: Bundle is resolved and ready to be started
3. **STARTING**: Bundle is in the process of starting
4. **ACTIVE**: Bundle is active and running
5. **STOPPING**: Bundle is in the process of stopping
6. **UNINSTALLED**: Bundle is uninstalled

```typescript
import { OSGiBootstrap, BUNDLE_STATES } from '@pandino/pandino';
import type { Bundle } from '@pandino/pandino';
import MyBundle from './bundles/my-bundle';

async function manageBundles() {
  // Start the framework
  const bootstrap = new OSGiBootstrap();
  const framework = await bootstrap.start();
  const context = framework.getBundleContext();

  // Install a bundle using the Promise version (recommended for better bundler optimizations)
  // Note: Using Promise.resolve() here for demonstration, but typically you would use dynamic imports
  const bundlePromise = Promise.resolve({ default: MyBundle });
  const bundle = await context.installBundle(bundlePromise);
  console.log(`Bundle state: ${bundle.getState()}`); // INSTALLED

  // Start the bundle
  await bundle.start();
  console.log(`Bundle state: ${bundle.getState()}`); // ACTIVE

  // Check if bundle is active
  const isActive = bundle.getState() === BUNDLE_STATES.ACTIVE;

  // Stop the bundle
  await bundle.stop();
  console.log(`Bundle state: ${bundle.getState()}`); // RESOLVED

  // Uninstall the bundle
  await bundle.uninstall();
  console.log(`Bundle state: ${bundle.getState()}`); // UNINSTALLED
}
```

## Bundle Activator

The BundleActivator is responsible for managing the bundle's lifecycle:

```typescript
import type { BundleActivator, BundleContext, ServiceRegistration } from '@pandino/pandino';
import { LogService, DatabaseService } from './services';

class MyBundleActivator implements BundleActivator {
  private serviceRegistrations: ServiceRegistration<any>[] = [];

  async start(context: BundleContext): Promise<void> {
    console.log(`Bundle ${context.getBundle().getSymbolicName()} starting`);

    // Register services
    this.serviceRegistrations.push(
      context.registerService('LogService', new LogService()),
      context.registerService('DatabaseService', new DatabaseService(), {
        'db.type': 'in-memory',
        'service.ranking': 100
      })
    );

    console.log('Services registered');
  }

  async stop(context: BundleContext): Promise<void> {
    console.log(`Bundle ${context.getBundle().getSymbolicName()} stopping`);

    // Unregister all services
    for (const registration of this.serviceRegistrations) {
      registration.unregister();
    }
    this.serviceRegistrations = [];

    console.log('Services unregistered');
  }
}

export default {
  headers: {
    bundleSymbolicName: 'com.example.my-bundle',
    bundleVersion: '1.0.0'
  },
  activator: new MyBundleActivator()
};
```

## Bundle Context

The BundleContext provides a bundle with access to the framework and is the primary way for a bundle to interact with the system:

```typescript
import type { BundleContext, ServiceReference } from '@pandino/pandino';
import type { ConfigurationAdmin } from '@pandino/pandino';

async function useBundleContext(context: BundleContext) {
  // Get information about the bundle
  const bundle = context.getBundle();
  console.log(`Bundle: ${bundle.getSymbolicName()} v${bundle.getVersion()}`);

  // Get all bundles in the system
  const allBundles = context.getBundles();
  console.log(`Total bundles: ${allBundles.length}`);

  // Register a service
  const registration = context.registerService('ExampleService', new ExampleService());

  // Find a service
  const configAdminRef = context.getServiceReference<ConfigurationAdmin>('ConfigurationAdmin');
  if (configAdminRef) {
    const configAdmin = context.getService(configAdminRef);
    // Use the service
    const config = await configAdmin?.getConfiguration('example.config');
    // Release the service when done
    context.ungetService(configAdminRef);
  }

  // Listen for service events
  context.addServiceListener((event) => {
    console.log(`Service event: ${event.getType()} for ${event.getServiceReference().getProperty('service.id')}`);
  });

  // Listen for bundle events
  context.addBundleListener((event) => {
    console.log(`Bundle event: ${event.getType()} for ${event.getBundle().getSymbolicName()}`);
  });
}
```

## Creating a Bundle

Here's a complete example of creating a bundle that provides a greeting service:

```typescript
// greeting-service.ts
import type { BundleActivator, BundleContext, ServiceRegistration } from '@pandino/pandino';

// Define the service interface
export interface GreetingService {
  greet(name: string): string;
  getWelcomeMessage(): string;
}

// Implement the service
class GreetingServiceImpl implements GreetingService {
  greet(name: string): string {
    return `Hello, ${name}! Welcome to Pandino!`;
  }

  getWelcomeMessage(): string {
    return 'Enjoy building modular applications!';
  }
}

// Create the bundle activator
class GreetingBundleActivator implements BundleActivator {
  private serviceRegistration: ServiceRegistration<GreetingService> | null = null;

  async start(context: BundleContext): Promise<void> {
    console.log('Greeting bundle starting');

    // Register the greeting service
    const service = new GreetingServiceImpl();
    this.serviceRegistration = context.registerService<GreetingService>('GreetingService', service, {
      'service.vendor': 'Pandino Examples',
      'service.description': 'A friendly greeting service'
    });

    console.log('Greeting service registered');
  }

  async stop(context: BundleContext): Promise<void> {
    console.log('Greeting bundle stopping');

    // Unregister the service
    if (this.serviceRegistration) {
      this.serviceRegistration.unregister();
      this.serviceRegistration = null;
    }

    console.log('Greeting service unregistered');
  }
}

// Export the bundle definition
export default {
  headers: {
    bundleSymbolicName: 'com.example.greeting',
    bundleVersion: '1.0.0',
    bundleName: 'Greeting Bundle',
    bundleDescription: 'Provides greeting functionality',
    bundleVendor: 'Pandino Examples'
  },
  activator: new GreetingBundleActivator()
};
```

## Using Declarative Services in Bundles

Instead of manually registering services in the activator, you can use declarative services with the `@Component` and `@Service` decorators:

```typescript
// greeting-bundle.ts
import { Component, Service, Activate, Deactivate } from '@pandino/decorators';
import type { ComponentContext } from '@pandino/pandino';

// Define the service interface
export interface GreetingService {
  greet(name: string): string;
  getWelcomeMessage(): string;
}

// Implement the service with decorators
@Component({
  name: 'greeting.service',
  immediate: true
})
@Service({
  interfaces: ['GreetingService'],
  properties: {
    'service.vendor': 'Pandino Examples',
    'service.description': 'A friendly greeting service'
  }
})
class GreetingServiceComponent implements GreetingService {
  @Activate
  activate(context: ComponentContext): void {
    console.log('Greeting service component activated');
  }

  @Deactivate
  deactivate(context: ComponentContext): void {
    console.log('Greeting service component deactivated');
  }

  greet(name: string): string {
    return `Hello, ${name}! Welcome to Pandino!`;
  }

  getWelcomeMessage(): string {
    return 'Enjoy building modular applications!';
  }
}

// Export the bundle definition with components
export default {
  headers: {
    bundleSymbolicName: 'com.example.greeting',
    bundleVersion: '1.0.0',
    bundleName: 'Greeting Bundle',
    bundleDescription: 'Provides greeting functionality',
    bundleVendor: 'Pandino Examples'
  },
  // Components are automatically registered by SCR
  components: [GreetingServiceComponent]
};
```

## Installing and Starting Bundles

To use bundles in your application:

```typescript
import { OSGiBootstrap } from '@pandino/pandino';
import GreetingBundle from './bundles/greeting-bundle';
import LoggingBundle from './bundles/logging-bundle';
import ConfigBundle from './bundles/config-bundle';

async function startApplication() {
  // Initialize the framework
  const bootstrap = new OSGiBootstrap();
  const framework = await bootstrap.start();
  const context = framework.getBundleContext();

  // Install and start bundles using the Promise version (recommended for better bundler optimizations)
  // This approach allows bundlers to perform code splitting and lazy loading
  const bundles = [
    { name: 'com.example.greeting', bundlePromise: Promise.resolve({ default: GreetingBundle }) },
    { name: 'com.example.logging', bundlePromise: Promise.resolve({ default: LoggingBundle }) },
    { name: 'com.example.config', bundlePromise: Promise.resolve({ default: ConfigBundle }) }
  ];

  // In a real application, you would typically use dynamic imports instead:
  // const bundles = [
  //   { name: 'Greeting Bundle', bundlePromise: import('./bundles/greeting-bundle') },
  //   { name: 'Logging Bundle', bundlePromise: import('./bundles/logging-bundle') },
  //   { name: 'Config Bundle', bundlePromise: import('./bundles/config-bundle') }
  // ];

  for (const { name, bundlePromise } of bundles) {
    console.log(`Installing bundle: ${name}`);
    const installedBundle = await context.installBundle(bundlePromise);
    await installedBundle.start();
    console.log(`Bundle ${name} started`);
  }

  console.log('All bundles started');

  return { bootstrap, context };
}

// Start the application
startApplication().catch(console.error);
```

## React Integration with Bundles

When using Pandino with React, you can use the `PandinoProvider` to initialize the framework and load bundles:

```tsx
// main.tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { PandinoProvider } from '@pandino/react-hooks';
import App from './App';

// Import bundles dynamically
// Note: PandinoProvider expects an array of promises, not direct bundle objects
const bundlePromises = [
  import('./bundles/greeting-bundle'),
  import('./bundles/user-bundle'),
  import('./bundles/theme-bundle')
];

// Render the app with Pandino provider
createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PandinoProvider
      bundles={bundlePromises}
      bootstrapConfig={{ frameworkLogLevel: 'INFO' }}
    >
      <App />
    </PandinoProvider>
  </React.StrictMode>
);
```

Then use the services provided by the bundles in your components:

```tsx
// App.tsx
import React from 'react';
import { useService } from '@pandino/react-hooks';
import type { GreetingService } from './bundles/greeting-bundle';

function App() {
  const { service: greetingService, loading } = useService<GreetingService>('GreetingService');

  if (loading || !greetingService) {
    return <div>Loading greeting service...</div>;
  }

  return (
    <div className="app">
      <h1>{greetingService.greet('Developer')}</h1>
      <p>{greetingService.getWelcomeMessage()}</p>
    </div>
  );
}

export default App;
```

## Fragment Bundles

Fragment bundles are special bundles that attach to a host bundle and contribute their resources:

```typescript
// host-bundle.ts
export default {
  headers: {
    bundleSymbolicName: 'com.example.host',
    bundleVersion: '1.0.0',
    bundleName: 'Host Bundle'
  },
  // Host bundle implementation
};

// fragment-bundle.ts
export default {
  headers: {
    bundleSymbolicName: 'com.example.fragment',
    bundleVersion: '1.0.0',
    bundleName: 'Fragment Bundle',
    // Specify the host bundle this fragment attaches to
    fragmentHost: 'com.example.host'
  },
  // Fragment resources and components
  components: [AdditionalComponent]
};
```

For more details on fragments, see the [Fragment Pattern](/docs/design-patterns/fragment-pattern) documentation.

## Best Practices

### Keep Bundles Focused

Each bundle should have a clear, single responsibility:

```typescript
// Good: Focused bundle for authentication
export default {
  headers: {
    bundleSymbolicName: 'com.example.auth',
    bundleVersion: '1.0.0',
    bundleName: 'Authentication Bundle'
  },
  components: [
    AuthService,
    UserService,
    PermissionService
  ]
};

// Good: Focused bundle for notifications
export default {
  headers: {
    bundleSymbolicName: 'com.example.notifications',
    bundleVersion: '1.0.0',
    bundleName: 'Notifications Bundle'
  },
  components: [
    NotificationService,
    EmailService,
    PushNotificationService
  ]
};
```

### Clean Up Resources

Always clean up resources when a bundle stops:

```typescript
class ResourcefulBundleActivator implements BundleActivator {
  private resources: any[] = [];
  private intervalId: NodeJS.Timeout | null = null;

  async start(context: BundleContext): Promise<void> {
    // Allocate resources
    this.resources.push(new ExpensiveResource());

    // Start background tasks
    this.intervalId = setInterval(() => {
      console.log('Background task running');
    }, 5000);
  }

  async stop(context: BundleContext): Promise<void> {
    // Clean up resources
    for (const resource of this.resources) {
      await resource.dispose();
    }
    this.resources = [];

    // Stop background tasks
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
```

### Use Version Information

Include proper version information in your bundles:

```typescript
// Use semantic versioning
export default {
  headers: {
    bundleSymbolicName: 'com.example.my-bundle',
    bundleVersion: '1.2.3', // major.minor.patch
    bundleName: 'My Bundle'
  }
};

// For fragment bundles, specify version ranges
export default {
  headers: {
    bundleSymbolicName: 'com.example.my-fragment',
    bundleVersion: '1.0.0',
    // Compatible with host versions 1.0.0 up to but not including 2.0.0
    fragmentHost: 'com.example.host;bundle-version="[1.0.0,2.0.0)"'
  }
};
```

## Conclusion

The Bundle System is a powerful feature of Pandino that enables truly modular applications. By encapsulating functionality in bundles with their own lifecycle, you can create applications that are more maintainable, extensible, and dynamic. Bundles communicate through the Service Registry, allowing for loose coupling and flexible architecture.
