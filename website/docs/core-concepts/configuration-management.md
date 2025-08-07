---
sidebar_position: 5
---

# Configuration Management

Configuration Management in Pandino provides a centralized way to manage and update application settings at runtime. This enables dynamic reconfiguration without requiring application restarts, making your applications more flexible and adaptable.

## What is Configuration Management?

Configuration management is a system that allows:

- **Centralized configuration**: Store all application settings in one place
- **Dynamic updates**: Change settings at runtime without restarting
- **Configuration scoping**: Target specific components with configuration
- **Configuration persistence**: Save and load configurations across restarts
- **Configuration listeners**: React to configuration changes

This approach offers several benefits over traditional static configuration:

- **Runtime adaptability**: Adjust behavior without redeployment
- **Environment-specific settings**: Apply different configurations in different environments
- **Feature toggles**: Enable or disable features dynamically
- **User preferences**: Store and apply user-specific settings
- **A/B testing**: Test different configurations with different users

## The ConfigurationAdmin Service

In Pandino, configuration management is implemented through the `ConfigurationAdmin` service, which is automatically registered by the framework. This service provides methods for creating, updating, and managing configurations.

```typescript
import type { BundleContext, ConfigurationAdmin, Configuration } from '@pandino/pandino';

async function useConfigAdmin(context: BundleContext) {
  // Get the ConfigurationAdmin service
  const configAdminRef = context.getServiceReference<ConfigurationAdmin>('ConfigurationAdmin');
  const configAdmin = context.getService(configAdminRef)!;

  // Get or create a configuration
  const config = await configAdmin.getConfiguration('com.example.myservice');

  // Update configuration properties
  await config.update({
    enabled: true,
    timeout: 5000,
    retryCount: 3,
    endpoint: 'https://api.example.com'
  });

  // Later, retrieve the configuration
  const retrievedConfig = await configAdmin.getConfiguration('com.example.myservice');
  const properties = retrievedConfig.getProperties();

  console.log('Configuration:', properties);
  // Output: { enabled: true, timeout: 5000, retryCount: 3, endpoint: 'https://api.example.com' }
}
```

## Configuration PIDs

Each configuration is identified by a unique Persistent Identity (PID), which is a string that typically follows a Java-like package naming convention:

```
com.example.component.name
```

PIDs are used to:

1. Create or retrieve configurations
2. Associate configurations with specific components
3. Persist configurations across restarts

```typescript
import type { ConfigurationAdmin } from '@pandino/pandino';

async function manageConfigurations(configAdmin: ConfigurationAdmin) {
  // Database configuration
  const dbConfig = await configAdmin.getConfiguration('com.example.database');
  await dbConfig.update({
    host: 'localhost',
    port: 5432,
    username: 'admin',
    password: 'secret',
    maxConnections: 10
  });

  // API client configuration
  const apiConfig = await configAdmin.getConfiguration('com.example.api.client');
  await apiConfig.update({
    baseUrl: 'https://api.example.com',
    timeout: 30000,
    retryCount: 3,
    apiKey: 'abc123'
  });

  // UI configuration
  const uiConfig = await configAdmin.getConfiguration('com.example.ui');
  await uiConfig.update({
    theme: 'dark',
    fontSize: 14,
    animationsEnabled: true,
    sidebarWidth: 250
  });
}
```

## Creating and Updating Configurations

### Creating a Configuration

```typescript
import type { ConfigurationAdmin } from '@pandino/pandino';

async function createConfigurations(configAdmin: ConfigurationAdmin) {
  // Create a configuration with initial properties
  const logConfig = await configAdmin.getConfiguration('com.example.logging');
  await logConfig.update({
    level: 'INFO',
    console: true,
    file: true,
    filePath: '/var/log/myapp.log',
    maxFileSize: 10485760, // 10MB
    maxFiles: 5
  });

  // Create a configuration without initial properties
  const cacheConfig = await configAdmin.getConfiguration('com.example.cache');
  // Later, update it
  await cacheConfig.update({
    maxSize: 1000,
    ttl: 3600,
    algorithm: 'LRU'
  });
}
```

### Updating a Configuration

```typescript
import type { ConfigurationAdmin } from '@pandino/pandino';

async function updateConfiguration(configAdmin: ConfigurationAdmin) {
  // Get existing configuration
  const config = await configAdmin.getConfiguration('com.example.service');

  // Get current properties
  const currentProps = config.getProperties() || {};

  // Update with merged properties
  await config.update({
    ...currentProps,
    timeout: 10000, // Update timeout
    retryCount: 5   // Update retry count
  });

  // Or completely replace properties
  await config.update({
    enabled: true,
    timeout: 15000,
    newProperty: 'value'
  });
}
```

### Deleting a Configuration

```typescript
import type { ConfigurationAdmin } from '@pandino/pandino';

async function deleteConfiguration(configAdmin: ConfigurationAdmin) {
  // Get the configuration
  const config = await configAdmin.getConfiguration('com.example.temporary');

  // Delete the configuration
  await config.delete();

  // Or set properties to null (same effect)
  await config.update(null);
}
```

## Managed Services

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

## Managed Service Factories

For services that need multiple configurations of the same type, you can use `ManagedServiceFactory`:

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

To create multiple configurations for a factory:

```typescript
import type { ConfigurationAdmin } from '@pandino/pandino';

async function createPoolConfigurations(configAdmin: ConfigurationAdmin) {
  // Create a configuration for the first database
  const postgresConfig = await configAdmin.getFactoryConfiguration('com.example.connection.pool', 'postgres');
  await postgresConfig.update({
    host: 'postgres.example.com',
    port: 5432,
    maxConnections: 20
  });

  // Create a configuration for the second database
  const mysqlConfig = await configAdmin.getFactoryConfiguration('com.example.connection.pool', 'mysql');
  await mysqlConfig.update({
    host: 'mysql.example.com',
    port: 3306,
    maxConnections: 15
  });

  // Create a configuration for the third database
  const mongoConfig = await configAdmin.getFactoryConfiguration('com.example.connection.pool', 'mongodb');
  await mongoConfig.update({
    host: 'mongo.example.com',
    port: 27017,
    maxConnections: 10
  });
}
```

## Configuration in Declarative Services

You can specify configuration PIDs in component declarations:

```typescript
import { Component, Service, Reference, Activate, Modified } from '@pandino/decorators';
import type { ComponentContext } from '@pandino/pandino';

@Component({
  name: 'email.service',
  configurationPid: 'com.example.email'
})
@Service({ interfaces: ['EmailService'] })
class EmailService {
  private smtpHost: string = 'smtp.example.com';
  private smtpPort: number = 587;
  private username: string = '';
  private password: string = '';
  private fromAddress: string = 'noreply@example.com';

  @Reference({ interface: 'LogService' })
  private logger?: LogService;

  @Activate
  activate(context: ComponentContext, config?: Record<string, any>): void {
    this.logger?.info('EmailService activated');

    // Apply initial configuration if provided
    if (config) {
      this.updateConfig(config);
    }
  }

  @Modified
  modified(config: Record<string, any>): void {
    this.logger?.info('EmailService configuration updated');
    this.updateConfig(config);
  }

  private updateConfig(config: Record<string, any>): void {
    this.smtpHost = config.smtpHost || this.smtpHost;
    this.smtpPort = config.smtpPort || this.smtpPort;
    this.username = config.username || this.username;
    this.password = config.password || this.password;
    this.fromAddress = config.fromAddress || this.fromAddress;

    this.logger?.info(`SMTP configured: ${this.smtpHost}:${this.smtpPort}`);
  }

  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    this.logger?.info(`Sending email to ${to}`);

    // Send email using SMTP configuration
    console.log(`Sending email from ${this.fromAddress} to ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Using SMTP: ${this.smtpHost}:${this.smtpPort}`);
  }
}
```

## Configuration Policy

You can specify how a component handles configuration:

```typescript
import { Component, Service, ConfigurationPolicy } from '@pandino/decorators';

// Optional configuration - component will activate even without configuration
@Component({
  name: 'cache.service',
  configurationPid: 'com.example.cache',
  configurationPolicy: ConfigurationPolicy.OPTIONAL
})
@Service({ interfaces: ['CacheService'] })
class CacheService {
  // Implementation...
}

// Required configuration - component will only activate when configuration is available
@Component({
  name: 'payment.gateway',
  configurationPid: 'com.example.payment',
  configurationPolicy: ConfigurationPolicy.REQUIRE
})
@Service({ interfaces: ['PaymentGateway'] })
class PaymentGateway {
  // Implementation...
}

// Ignore configuration - component will activate and ignore any configuration
@Component({
  name: 'utility.service',
  configurationPolicy: ConfigurationPolicy.IGNORE
})
@Service({ interfaces: ['UtilityService'] })
class UtilityService {
  // Implementation...
}
```

## React Integration

In React applications, you can use configuration to customize components:

### Configuration Provider

```tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePandinoContext } from '@pandino/react-hooks';
import type { ConfigurationAdmin } from '@pandino/pandino';

// Create a context for configuration
const ConfigContext = createContext<Record<string, any>>({});

// Configuration provider component
export function ConfigProvider({
  pid,
  children
}: {
  pid: string;
  children: React.ReactNode;
}) {
  const { bundleContext } = usePandinoContext();
  const [config, setConfig] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!bundleContext) return;

    // Get ConfigurationAdmin service
    const configAdminRef = bundleContext.getServiceReference<ConfigurationAdmin>('ConfigurationAdmin');
    if (!configAdminRef) return;

    const configAdmin = bundleContext.getService(configAdminRef);
    if (!configAdmin) return;

    // Load configuration
    const loadConfig = async () => {
      const configuration = await configAdmin.getConfiguration(pid);
      const properties = configuration.getProperties() || {};
      setConfig(properties);

      // Register listener for configuration changes
      bundleContext.registerService('ConfigurationListener', {
        configurationEvent: (event) => {
          if (event.getPid() === pid && event.getType() === 'UPDATED') {
            loadConfig();
          }
        }
      });
    };

    loadConfig();

    // Clean up
    return () => {
      bundleContext.ungetService(configAdminRef);
    };
  }, [bundleContext, pid]);

  return (
    <ConfigContext.Provider value={config}>
      {children}
    </ConfigContext.Provider>
  );
}

// Hook to use configuration
export function useConfig<T = Record<string, any>>(): T {
  return useContext(ConfigContext) as T;
}
```

### Using Configuration in Components

```tsx
import React from 'react';
import { ConfigProvider, useConfig } from './ConfigProvider';

// Define configuration type
interface UIConfig {
  theme: 'light' | 'dark';
  primaryColor: string;
  fontSize: number;
  showAnimations: boolean;
}

// Component that uses configuration
function ThemedButton({ children }: { children: React.ReactNode }) {
  const config = useConfig<UIConfig>();

  const buttonStyle = {
    backgroundColor: config.primaryColor || '#007bff',
    color: config.theme === 'dark' ? '#ffffff' : '#000000',
    fontSize: `${config.fontSize || 16}px`,
    padding: '10px 20px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: config.showAnimations ? 'all 0.3s ease' : 'none'
  };

  return (
    <button style={buttonStyle}>
      {children}
    </button>
  );
}

// App with configuration
function App() {
  return (
    <ConfigProvider pid="com.example.ui">
      <div>
        <h1>Configured UI</h1>
        <ThemedButton>Click Me</ThemedButton>
      </div>
    </ConfigProvider>
  );
}
```

## Configuration Persistence

Configurations are typically persisted across application restarts. In Pandino, the default implementation stores configurations in memory, but you can implement custom persistence:

```typescript
import { Component, Service } from '@pandino/decorators';
import type { ConfigurationPersistence } from '@pandino/pandino';
import { promises as fs } from 'fs';
import path from 'path';

@Component({ name: 'file.config.persistence' })
@Service({ interfaces: ['ConfigurationPersistence'] })
class FileConfigurationPersistence implements ConfigurationPersistence {
  private configDir: string = './config';

  async load(pid: string): Promise<Record<string, any> | null> {
    try {
      const filePath = path.join(this.configDir, `${pid}.json`);
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error loading configuration for ${pid}:`, error);
      return null;
    }
  }

  async save(pid: string, properties: Record<string, any> | null): Promise<void> {
    try {
      const filePath = path.join(this.configDir, `${pid}.json`);

      if (properties === null) {
        // Delete configuration
        try {
          await fs.unlink(filePath);
        } catch (error) {
          // Ignore if file doesn't exist
        }
      } else {
        // Ensure directory exists
        await fs.mkdir(this.configDir, { recursive: true });

        // Save configuration
        await fs.writeFile(filePath, JSON.stringify(properties, null, 2), 'utf8');
      }
    } catch (error) {
      console.error(`Error saving configuration for ${pid}:`, error);
    }
  }

  async list(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.configDir);
      return files
        .filter(file => file.endsWith('.json'))
        .map(file => file.slice(0, -5)); // Remove .json extension
    } catch (error) {
      console.error('Error listing configurations:', error);
      return [];
    }
  }
}
```

## Best Practices

### Use Hierarchical PIDs

Organize your PIDs in a hierarchical manner:

```typescript
// Good - hierarchical PIDs
const dbConfigHierarchical = await configAdmin.getConfiguration('com.example.database');
const apiConfigHierarchical = await configAdmin.getConfiguration('com.example.api.client');
const uiConfigHierarchical = await configAdmin.getConfiguration('com.example.ui.theme');

// Bad - flat PIDs
const dbConfigFlat = await configAdmin.getConfiguration('database');
const apiConfigFlat = await configAdmin.getConfiguration('api');
const uiConfigFlat = await configAdmin.getConfiguration('theme');
```

### Provide Default Values

Always provide sensible defaults for your configurations:

```typescript
@Component({
  name: 'http.client',
  configurationPid: 'com.example.http.client'
})
@Service({ interfaces: ['HttpClient'] })
class HttpClient {
  // Default values
  private timeout: number = 30000;
  private maxRetries: number = 3;
  private baseUrl: string = 'https://api.example.com';

  @Modified
  modified(config: Record<string, any>): void {
    // Use defaults if properties are not provided
    this.timeout = config.timeout ?? this.timeout;
    this.maxRetries = config.maxRetries ?? this.maxRetries;
    this.baseUrl = config.baseUrl ?? this.baseUrl;
  }
}
```

### Validate Configuration

Validate configuration properties before applying them:

```typescript
@Component({
  name: 'rate.limiter',
  configurationPid: 'com.example.rate.limiter'
})
@Service({ interfaces: ['RateLimiter'] })
class RateLimiter {
  private maxRequests: number = 100;
  private windowMs: number = 60000;

  @Modified
  modified(config: Record<string, any>): void {
    // Validate maxRequests
    if (config.maxRequests !== undefined) {
      if (typeof config.maxRequests !== 'number' || config.maxRequests <= 0) {
        console.error('Invalid maxRequests value, must be a positive number');
      } else {
        this.maxRequests = config.maxRequests;
      }
    }

    // Validate windowMs
    if (config.windowMs !== undefined) {
      if (typeof config.windowMs !== 'number' || config.windowMs < 1000) {
        console.error('Invalid windowMs value, must be at least 1000ms');
      } else {
        this.windowMs = config.windowMs;
      }
    }
  }
}
```

### Use Configuration Factories for Multiple Instances

When you need multiple instances of the same configuration type, use factories:

```typescript
// Good - using factory configuration for multiple instances
const postgresFactoryConfig = await configAdmin.getFactoryConfiguration('com.example.database', 'postgres');
const mysqlFactoryConfig = await configAdmin.getFactoryConfiguration('com.example.database', 'mysql');

// Bad - using separate PIDs for similar configurations
const postgresSeparateConfig = await configAdmin.getConfiguration('com.example.database.postgres');
const mysqlSeparateConfig = await configAdmin.getConfiguration('com.example.database.mysql');
```

### Separate Configuration Types

Keep different types of configuration separate:

```typescript
// Good - separate configurations by concern
const dbConfig = await configAdmin.getConfiguration('com.example.database');
const loggingConfig = await configAdmin.getConfiguration('com.example.logging');
const securityConfig = await configAdmin.getConfiguration('com.example.security');

// Bad - mixing concerns in a single configuration
const appConfig = await configAdmin.getConfiguration('com.example.app');
await appConfig.update({
  dbHost: 'localhost',
  dbPort: 5432,
  logLevel: 'INFO',
  logFile: '/var/log/app.log',
  authEnabled: true,
  authProvider: 'oauth'
});
```

## Conclusion

Configuration Management in Pandino provides a powerful mechanism for dynamically configuring your application at runtime. By using the ConfigurationAdmin service, ManagedService, and ManagedServiceFactory interfaces, you can create applications that adapt to changing requirements without requiring restarts or redeployment.

Whether you're implementing simple application settings, complex multi-tenant configurations, or dynamic feature toggles, Pandino's configuration management system provides the flexibility and reliability you need.
