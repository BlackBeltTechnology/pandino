---
sidebar_position: 2
---

# Built-in Services

Pandino provides several built-in services that offer essential functionality for modular applications. These services are automatically registered by the framework and can be accessed through the service registry.

## EventAdmin

The `EventAdmin` service provides a publish-subscribe messaging system that enables loose coupling between components. It allows components to send and receive events without direct dependencies.

### Accessing the EventAdmin Service

```typescript
import type { BundleContext, EventAdmin } from '@pandino/pandino';

function getEventAdmin(context: BundleContext): EventAdmin | null {
  const eventAdminRef = context.getServiceReference<EventAdmin>('EventAdmin');
  if (!eventAdminRef) {
    console.error('EventAdmin service not available');
    return null;
  }

  return context.getService(eventAdminRef);
}
```

### Creating and Sending Events

```typescript
import { Event, EventAdmin } from '@pandino/pandino';

function sendEvents(eventAdmin: EventAdmin): void {
  // Create an event with a topic and properties
  const loginEvent = new Event('user/login', {
    userId: '123',
    username: 'john.doe',
    timestamp: Date.now(),
    ipAddress: '192.168.1.1'
  });

  // Send the event synchronously
  // This will block until all handlers have processed the event
  eventAdmin.sendEvent(loginEvent);

  // Create another event
  const logoutEvent = new Event('user/logout', {
    userId: '123',
    username: 'john.doe',
    timestamp: Date.now()
  });

  // Send the event asynchronously
  // This will return immediately and deliver the event in a separate thread
  eventAdmin.postEvent(logoutEvent);
}
```

### Handling Events

To receive events, components register as `EventHandler` services:

```typescript
import { Component, Service, Property } from '@pandino/decorators';
import type { EventHandler, Event } from '@pandino/pandino';

@Component({ name: 'user.event.logger' })
@Service({ interfaces: ['EventHandler'] })
@Property({ name: 'event.topics', value: 'user/*' })
class UserEventLogger implements EventHandler {
  handleEvent(event: Event): void {
    const topic = event.getTopic();
    const userId = event.getProperty('userId');
    const timestamp = new Date(event.getProperty('timestamp')).toISOString();

    console.log(`[${timestamp}] User event: ${topic} for user ${userId}`);
  }
}
```

You can also register event handlers manually:

```typescript
import type { BundleContext, EventHandler, Event } from '@pandino/pandino';

function registerEventHandler(context: BundleContext): void {
  // Register an event handler for user events
  context.registerService<EventHandler>('EventHandler', {
    handleEvent: (event: Event) => {
      const topic = event.getTopic();
      const userId = event.getProperty('userId');
      console.log(`Received ${topic} event for user ${userId}`);
    }
  }, {
    'event.topics': 'user/*'
  });

  // Register an event handler with a filter
  context.registerService<EventHandler>('EventHandler', {
    handleEvent: (event: Event) => {
      const orderId = event.getProperty('orderId');
      const amount = event.getProperty('amount');
      console.log(`High-value order ${orderId} with amount ${amount}`);
    }
  }, {
    'event.topics': 'order/created',
    'event.filter': '(amount>=1000)'
  });
}
```

## LogService

The `LogService` provides a centralized logging facility for the framework and applications. It allows components to log messages with different severity levels and additional context.

### Accessing the LogService

```typescript
import type { BundleContext, LogService } from '@pandino/pandino';

function getLogService(context: BundleContext): LogService | null {
  const logServiceRef = context.getServiceReference<LogService>('LogService');
  if (!logServiceRef) {
    console.error('LogService not available');
    return null;
  }

  return context.getService(logServiceRef);
}
```

### Using the LogService

```typescript
import type { LogService } from '@pandino/pandino';

function useLogService(logger: LogService): void {
  // Log messages with different severity levels
  logger.debug('This is a debug message');
  logger.info('This is an info message');
  logger.warn('This is a warning message');
  logger.error('This is an error message');

  // Log with an error object
  try {
    throw new Error('Something went wrong');
  } catch (error) {
    logger.error('An error occurred', error as Error);
  }

  // Log with additional data
  logger.info('User logged in', undefined, {
    userId: '123',
    username: 'john.doe',
    ipAddress: '192.168.1.1'
  });
}
```

### Implementing a Custom LogService

```typescript
import { Component, Service } from '@pandino/decorators';
import type { LogService } from '@pandino/pandino';

@Component({ name: 'custom.log.service' })
@Service({
  interfaces: ['LogService'],
  properties: {
    'service.ranking': 100
  }
})
class CustomLogService implements LogService {
  debug(message: string, error?: Error, data?: Record<string, any>): void {
    this.log('DEBUG', message, error, data);
  }

  info(message: string, error?: Error, data?: Record<string, any>): void {
    this.log('INFO', message, error, data);
  }

  warn(message: string, error?: Error, data?: Record<string, any>): void {
    this.log('WARN', message, error, data);
  }

  error(message: string, error?: Error, data?: Record<string, any>): void {
    this.log('ERROR', message, error, data);
  }

  private log(level: string, message: string, error?: Error, data?: Record<string, any>): void {
    const timestamp = new Date().toISOString();
    const dataString = data ? JSON.stringify(data) : '';
    const errorString = error ? `\nError: ${error.message}\n${error.stack}` : '';

    console.log(`[${timestamp}] [${level}] ${message}${errorString}${dataString ? ' ' + dataString : ''}`);
  }
}
```

## ConfigurationAdmin

The `ConfigurationAdmin` service provides a centralized way to manage and update application settings at runtime. It enables dynamic reconfiguration without requiring application restarts.

### Accessing the ConfigurationAdmin Service

```typescript
import type { BundleContext, ConfigurationAdmin } from '@pandino/pandino';

async function getConfigAdmin(context: BundleContext): Promise<ConfigurationAdmin | null> {
  const configAdminRef = context.getServiceReference<ConfigurationAdmin>('ConfigurationAdmin');
  if (!configAdminRef) {
    console.error('ConfigurationAdmin service not available');
    return null;
  }

  return context.getService(configAdminRef);
}
```

### Managing Configurations

```typescript
import type { ConfigurationAdmin, Configuration } from '@pandino/pandino';

async function manageConfigurations(configAdmin: ConfigurationAdmin): Promise<void> {
  // Get or create a configuration
  const dbConfig = await configAdmin.getConfiguration('com.example.database');

  // Update configuration properties
  await dbConfig.update({
    host: 'localhost',
    port: 5432,
    username: 'admin',
    password: 'secret',
    maxConnections: 10
  });

  // Later, retrieve the configuration
  const retrievedConfig = await configAdmin.getConfiguration('com.example.database');
  const properties = retrievedConfig.getProperties();

  console.log('Database configuration:', properties);

  // Delete a configuration
  const tempConfig = await configAdmin.getConfiguration('com.example.temporary');
  await tempConfig.delete();

  // Create a factory configuration
  const poolConfig = await configAdmin.getFactoryConfiguration('com.example.connection.pool', 'postgres');
  await poolConfig.update({
    host: 'postgres.example.com',
    port: 5432,
    maxConnections: 20
  });
}
```

### Implementing a ManagedService

Components can receive configuration updates by implementing the `ManagedService` interface:

```typescript
import { Component, Service, Property } from '@pandino/decorators';
import type { ManagedService } from '@pandino/pandino';

@Component({ name: 'database.service' })
@Service({ interfaces: ['DatabaseService', 'ManagedService'] })
@Property({ name: 'service.pid', value: 'com.example.database' })
class DatabaseService implements ManagedService {
  private host: string = 'localhost';
  private port: number = 5432;
  private username: string = 'admin';
  private password: string = '';
  private maxConnections: number = 10;
  private connection: any = null;

  // Called when configuration is updated
  updated(properties: Record<string, any> | null): void {
    if (properties) {
      // Update service configuration
      this.host = properties.host || this.host;
      this.port = properties.port || this.port;
      this.username = properties.username || this.username;
      this.password = properties.password || this.password;
      this.maxConnections = properties.maxConnections || this.maxConnections;

      // Apply new configuration
      this.reconnect();
    }
  }

  private reconnect(): void {
    // Close existing connection if any
    if (this.connection) {
      this.connection.close();
      this.connection = null;
    }

    // Create new connection with updated properties
    this.connection = {
      host: this.host,
      port: this.port,
      username: this.username,
      password: this.password,
      maxConnections: this.maxConnections,
      close: () => console.log('Connection closed')
    };

    console.log(`Connected to database at ${this.host}:${this.port}`);
  }

  query(sql: string, params: any[]): any[] {
    if (!this.connection) {
      this.reconnect();
    }

    console.log(`Executing query: ${sql}`);
    // Execute query using this.connection
    return [];
  }
}
```

### Implementing a ManagedServiceFactory

For services that need multiple configurations of the same type, you can implement the `ManagedServiceFactory` interface:

```typescript
import { Component, Service, Property } from '@pandino/decorators';
import type { ManagedServiceFactory } from '@pandino/pandino';

@Component({ name: 'connection.pool.factory' })
@Service({ interfaces: ['ConnectionPoolFactory', 'ManagedServiceFactory'] })
@Property({ name: 'service.pid', value: 'com.example.connection.pool' })
class ConnectionPoolFactory implements ManagedServiceFactory {
  private pools: Map<string, ConnectionPool> = new Map();

  // Return a name for this factory
  getName(): string {
    return 'Connection Pool Factory';
  }

  // Called when a new configuration is created
  updated(pid: string, properties: Record<string, any> | null): void {
    if (properties) {
      // Create or update a connection pool
      const pool = this.pools.get(pid) || new ConnectionPool();

      // Configure the pool
      pool.configure(properties);

      // Store the pool
      this.pools.set(pid, pool);

      console.log(`Connection pool ${pid} configured`);
    }
  }

  // Called when a configuration is deleted
  deleted(pid: string): void {
    const pool = this.pools.get(pid);

    if (pool) {
      // Close the pool
      pool.close();

      // Remove from map
      this.pools.delete(pid);

      console.log(`Connection pool ${pid} deleted`);
    }
  }

  // Get a connection pool by PID
  getPool(pid: string): ConnectionPool | undefined {
    return this.pools.get(pid);
  }
}

class ConnectionPool {
  private host: string = 'localhost';
  private port: number = 5432;
  private maxConnections: number = 10;

  configure(properties: Record<string, any>): void {
    this.host = properties.host || this.host;
    this.port = properties.port || this.port;
    this.maxConnections = properties.maxConnections || this.maxConnections;

    // Initialize the pool
    console.log(`Pool configured: ${this.host}:${this.port} (${this.maxConnections} connections)`);
  }

  close(): void {
    console.log('Pool closed');
  }

  getConnection(): any {
    return { host: this.host, port: this.port };
  }
}
```

## ServiceComponentRuntime (SCR)

The `ServiceComponentRuntime` service manages the lifecycle of declarative service components. It handles component registration, activation, deactivation, and dependency injection.

### Accessing the SCR Service

```typescript
import type { BundleContext, ServiceComponentRuntime } from '@pandino/pandino';

function getSCR(context: BundleContext): ServiceComponentRuntime | null {
  const scrRef = context.getServiceReference<ServiceComponentRuntime>('ServiceComponentRuntime');
  if (!scrRef) {
    console.error('ServiceComponentRuntime not available');
    return null;
  }

  return context.getService(scrRef);
}
```

### Registering Components with SCR

```typescript
import { Component, Service, Reference } from '@pandino/decorators';
import type { BundleContext, ServiceComponentRuntime } from '@pandino/pandino';

// Define components with decorators
@Component({ name: 'greeting.service' })
@Service({ interfaces: ['GreetingService'] })
class GreetingService {
  greet(name: string): string {
    return `Hello, ${name}!`;
  }
}

@Component({ name: 'user.service' })
@Service({ interfaces: ['UserService'] })
class UserService {
  @Reference({ interface: 'GreetingService' })
  private greetingService?: GreetingService;

  greetUser(userId: string): string {
    const user = this.getUser(userId);
    return this.greetingService?.greet(user.name) || `Hello, ${user.name}!`;
  }

  private getUser(userId: string): { id: string; name: string } {
    return { id: userId, name: 'John Doe' };
  }
}

// Register components with SCR
async function registerComponents(context: BundleContext): Promise<void> {
  const scrRef = context.getServiceReference<ServiceComponentRuntime>('ServiceComponentRuntime');
  if (!scrRef) {
    console.error('ServiceComponentRuntime not available');
    return;
  }

  const scr = context.getService(scrRef)!;
  const bundleId = context.getBundle().getBundleId();

  // Register components
  await scr.registerComponent(GreetingService, bundleId);
  await scr.registerComponent(UserService, bundleId);

  console.log('Components registered with SCR');
}
```

### Getting Component Information

```typescript
import type { ServiceComponentRuntime, ComponentDescriptionDTO, ComponentConfigurationDTO } from '@pandino/pandino';

async function getComponentInfo(scr: ServiceComponentRuntime): Promise<void> {
  // Get all component descriptions
  const descriptions = await scr.getComponentDescriptionDTOs();
  console.log(`Found ${descriptions.length} component descriptions`);

  // Get component configurations for a specific component
  for (const description of descriptions) {
    console.log(`Component: ${description.name}`);
    console.log(`- Bundle: ${description.bundle.id}`);
    console.log(`- Services: ${description.serviceInterfaces.join(', ')}`);

    const configurations = await scr.getComponentConfigurationDTOs(description);
    console.log(`- Configurations: ${configurations.length}`);

    for (const config of configurations) {
      console.log(`  - ID: ${config.id}`);
      console.log(`  - State: ${config.state}`);
      console.log(`  - Properties: ${JSON.stringify(config.properties)}`);
    }
  }
}
```

### Managing Component Lifecycle

```typescript
import type { ServiceComponentRuntime, ComponentDescriptionDTO } from '@pandino/pandino';

async function manageComponentLifecycle(scr: ServiceComponentRuntime): Promise<void> {
  // Get all component descriptions
  const descriptions = await scr.getComponentDescriptionDTOs();

  // Find a specific component
  const userServiceDesc = descriptions.find(desc => desc.name === 'user.service');
  if (!userServiceDesc) {
    console.error('User service component not found');
    return;
  }

  // Get component configurations
  const configurations = await scr.getComponentConfigurationDTOs(userServiceDesc);
  if (configurations.length === 0) {
    console.error('No configurations found for user service component');
    return;
  }

  const configId = configurations[0].id;

  // Disable the component
  await scr.disableComponent(userServiceDesc);
  console.log('User service component disabled');

  // Enable the component
  await scr.enableComponent(userServiceDesc);
  console.log('User service component enabled');
}
```

## ResourceProcessor

The `ResourceProcessor` service processes resources from bundles. It's used by the framework to handle different types of resources, such as components, configurations, and assets.

### Implementing a Custom ResourceProcessor

```typescript
import { Component, Service } from '@pandino/decorators';
import type { ResourceProcessor, Bundle } from '@pandino/pandino';

@Component({ name: 'css.resource.processor' })
@Service({ interfaces: ['ResourceProcessor'] })
class CSSResourceProcessor implements ResourceProcessor {
  // Return the resource type this processor handles
  getResourceType(): string {
    return 'css';
  }

  // Process resources from a bundle
  processResources(bundle: Bundle): boolean {
    // Find all CSS resources in the bundle
    const cssResources = bundle.findResources('assets', '*.css');
    if (cssResources.length === 0) {
      return false;
    }

    // Process each CSS resource
    for (const cssUrl of cssResources) {
      // Create a link element to apply the CSS
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = cssUrl;
      document.head.appendChild(link);

      console.log(`Applied CSS from bundle ${bundle.getSymbolicName()}: ${cssUrl}`);
    }

    return true;
  }
}
```

### Implementing a FragmentResourceProcessor

```typescript
import { Component, Service } from '@pandino/decorators';
import type { FragmentResourceProcessor, Bundle } from '@pandino/pandino';

@Component({ name: 'translation.resource.processor' })
@Service({ interfaces: ['FragmentResourceProcessor'] })
class TranslationResourceProcessor implements FragmentResourceProcessor {
  // Return the resource type this processor handles
  getResourceType(): string {
    return 'translations';
  }

  // Process resources from a fragment and merge them with the host
  processResources(host: Bundle, fragment: Bundle): boolean {
    // Check if the fragment has translations
    const fragmentTranslations = fragment.findResources('i18n', '*.json');
    if (fragmentTranslations.length === 0) {
      return false;
    }

    // Get the host's translation registry
    const hostModule = (host as any).getBundleModule?.();
    if (!hostModule || !hostModule.default?.translations) {
      // Host doesn't have a translation registry
      return false;
    }

    // Process each translation file
    for (const translationUrl of fragmentTranslations) {
      // Extract locale from filename (e.g., 'i18n/en.json' -> 'en')
      const locale = translationUrl.split('/').pop()?.split('.')[0];
      if (!locale) continue;

      // Load the translation file
      fetch(translationUrl)
        .then(response => response.json())
        .then(translations => {
          // Merge with host translations
          if (!hostModule.default.translations[locale]) {
            hostModule.default.translations[locale] = {};
          }

          Object.assign(hostModule.default.translations[locale], translations);
          console.log(`Merged translations for locale ${locale} from fragment ${fragment.getSymbolicName()}`);
        })
        .catch(error => {
          console.error(`Error loading translations from ${translationUrl}:`, error);
        });
    }

    return true;
  }
}
```

## Conclusion

These built-in services provide essential functionality for building modular, dynamic applications with Pandino. By leveraging these services, you can create applications that are more flexible, maintainable, and adaptable to changing requirements.

For more detailed information about each service, refer to the corresponding sections in the Core Concepts documentation:

- [Event System](/docs/core-concepts/event-system)
- [Configuration Management](/docs/core-concepts/configuration-management)
- [Service Registry](/docs/core-concepts/service-registry)
- [Bundle System](/docs/core-concepts/bundle-system)
- [Dynamic Dependencies](/docs/core-concepts/dynamic-dependencies)
