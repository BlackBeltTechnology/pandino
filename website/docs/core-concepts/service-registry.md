---
sidebar_position: 1
---

# Service Registry

The Service Registry is the central component of Pandino's architecture. It provides a dynamic, loosely-coupled way for components to discover and use services without direct dependencies.

## What is a Service Registry?

A service registry is a central repository where services register their capabilities and consumers can discover and use those services. This pattern enables:

- **Loose coupling**: Components don't need direct references to each other
- **Dynamic discovery**: Services can appear and disappear at runtime
- **Filtered selection**: Consumers can find services based on specific criteria
- **Multiple implementations**: Several implementations of the same service can coexist

## Services vs Service References

In Pandino, there's an important distinction between services and service references:

| Component | Purpose | Analogy |
|-----------|---------|---------|
| **Service** | The actual object that does the work | The person you want to call |
| **Service Reference** | A pointer/handle to find the service | The phone number in the phone book |

```typescript
import type { BundleContext, ServiceReference } from '@pandino/pandino';

// The service - does the actual work
const service = new DatabaseService();

// Register it - puts it in the "phone book"
context.registerService<DatabaseService>('DatabaseService', service);

// Get a reference - look up the "phone number"
const serviceRef = context.getServiceReference<DatabaseService>('DatabaseService');

// Get the service - make the "phone call"
const databaseService = context.getService(serviceRef);
```

## Registering Services

Services can be registered in several ways:

### Direct Registration via BundleContext

```typescript
import type { BundleContext } from '@pandino/pandino';

// Simple registration
context.registerService<LogService>('LogService', new ConsoleLogService());

// Registration with properties
context.registerService<DatabaseService>('DatabaseService', new MySQLService(), {
  'db.type': 'mysql',
  'db.host': 'localhost',
  'db.port': 3306,
  'service.ranking': 100
});
```

### Declarative Registration via Decorators

```typescript
import { Component, Service } from '@pandino/decorators';

@Component({ name: 'greeting.service' })
@Service({
  interfaces: ['GreetingService'],
  properties: {
    'service.vendor': 'Pandino',
    'service.ranking': 100
  }
})
class GreetingServiceImpl implements GreetingService {
  greet(name: string): string {
    return `Hello, ${name}!`;
  }

  getWelcomeMessage(): string {
    return 'Welcome to Pandino!';
  }
}
```

## Discovering Services

Pandino provides several ways to discover services:

### Direct Lookup

```typescript
import type { BundleContext, ServiceReference } from '@pandino/pandino';
import type { LogService } from './types';

// Get a single service reference
const logServiceRef = context.getServiceReference<LogService>('LogService');
if (logServiceRef) {
  const logService = context.getService(logServiceRef);
  logService?.info('Service found!');
}

// Get all service references matching an interface
const allLogServiceRefs = context.getServiceReferences<LogService>('LogService');
```

### Filtered Lookup with LDAP

```typescript
import type { BundleContext, ServiceReference } from '@pandino/pandino';
import type { DatabaseService } from './types';

// Find services using LDAP filters
const mysqlRefs = context.getServiceReferences<DatabaseService>(
  'DatabaseService',
  '(db.type=mysql)'
);

// More complex filter
const highPriorityLocalDBs = context.getServiceReferences<DatabaseService>(
  'DatabaseService',
  '(&(db.host=localhost)(service.ranking>=100))'
);
```

### ServiceTracker

For dynamic service tracking:

```typescript
import { ServiceTracker } from '@pandino/pandino';
import type { BundleContext, ServiceReference } from '@pandino/pandino';
import type { DatabaseService } from './types';

class ApiService {
  private dbTracker: ServiceTracker<DatabaseService>;

  constructor(private context: BundleContext) {
    this.dbTracker = new ServiceTracker<DatabaseService>(context, 'DatabaseService', {
      addingService: (ref: ServiceReference<DatabaseService>) => {
        const service = context.getService(ref);
        console.log('Database service available');
        return service;
      },
      removedService: (ref: ServiceReference<DatabaseService>, service: DatabaseService) => {
        console.log('Database service removed');
        context.ungetService(ref);
      }
    });
  }

  async start() {
    this.dbTracker.open();
  }

  async stop() {
    this.dbTracker.close();
  }

  getCurrentDatabase(): DatabaseService | null {
    return this.dbTracker.getService();
  }
}
```

### React Hooks (for UI Components)

```tsx
import React from 'react';
import { useService } from '@pandino/react-hooks';
import type { LogService } from './types';

function LoggingComponent() {
  const { service: logService, loading } = useService<LogService>('LogService');

  if (loading) {
    return <div>Loading log service...</div>;
  }

  const logMessage = () => {
    logService?.info('Button clicked!');
  };

  return (
    <div>
      <button onClick={logMessage} disabled={!logService}>
        Log Message
      </button>
    </div>
  );
}
```

## Service Properties

Services can have properties that provide metadata and enable filtering:

```typescript
import type { BundleContext } from '@pandino/pandino';

// Register a service with properties
context.registerService('DatabaseService', new MySQLService(), {
  // Service type information
  'db.type': 'mysql',
  'db.version': '8.0',

  // Connection details
  'db.host': 'localhost',
  'db.port': 3306,

  // Service ranking (higher values preferred)
  'service.ranking': 100,

  // Service vendor information
  'service.vendor': 'Pandino',
  'service.description': 'MySQL Database Service'
});
```

## Service Ranking

When multiple services implement the same interface, consumers can get the highest-ranked service:

```typescript
import type { BundleContext, ServiceReference } from '@pandino/pandino';
import type { CacheService } from './types';

// Register multiple implementations with different rankings
context.registerService<CacheService>('CacheService', new MemoryCache(), {
  'cache.type': 'memory',
  'service.ranking': 100
});

context.registerService<CacheService>('CacheService', new RedisCache(), {
  'cache.type': 'redis',
  'service.ranking': 200  // Higher ranking
});

// Get the highest-ranked service (RedisCache in this case)
const cacheServiceRef = context.getServiceReference<CacheService>('CacheService');
const cacheService = context.getService(cacheServiceRef)!;
```

## Service Lifecycle

Services have a lifecycle that's managed by the framework:

1. **Registration**: Service is registered with the service registry
2. **Discovery**: Consumers find the service through references
3. **Usage**: Consumers get and use the service
4. **Release**: Consumers release the service when done
5. **Unregistration**: Service is removed from the registry

```typescript
import type { BundleContext, ServiceRegistration, ServiceReference } from '@pandino/pandino';
import type { LogService } from './types';

// 1. Registration
const registration = context.registerService<LogService>('LogService', new ConsoleLogService());

// 2. Discovery
const serviceRef = context.getServiceReference<LogService>('LogService');

// 3. Usage
if (serviceRef) {
  const logService = context.getService(serviceRef);
  logService?.info('Using the service');

  // 4. Release
  context.ungetService(serviceRef);
}

// 5. Unregistration
registration.unregister();
```

## Best Practices

### Use Interfaces for Service Types

Define clear interfaces for your services:

```typescript
// Define the interface
interface LogService {
  debug(message: string, error?: Error, data?: Record<string, any>): void;
  info(message: string, error?: Error, data?: Record<string, any>): void;
  warn(message: string, error?: Error, data?: Record<string, any>): void;
  error(message: string, error?: Error, data?: Record<string, any>): void;
}

// Implement the interface
class ConsoleLogService implements LogService {
  debug(message: string, error?: Error, data?: Record<string, any>): void {
    console.debug(`[DEBUG] ${message}`, error, data);
  }

  info(message: string, error?: Error, data?: Record<string, any>): void {
    console.info(`[INFO] ${message}`, error, data);
  }

  warn(message: string, error?: Error, data?: Record<string, any>): void {
    console.warn(`[WARN] ${message}`, error, data);
  }

  error(message: string, error?: Error, data?: Record<string, any>): void {
    console.error(`[ERROR] ${message}`, error, data);
  }
}
```

### Always Release Services When Done

```typescript
import type { BundleContext, ServiceReference } from '@pandino/pandino';
import type { DatabaseService } from './types';

function executeQuery(context: BundleContext, query: string): any[] {
  const dbRef = context.getServiceReference<DatabaseService>('DatabaseService');
  if (!dbRef) {
    throw new Error('Database service not available');
  }

  try {
    const dbService = context.getService(dbRef);
    return dbService?.query(query) || [];
  } finally {
    // Always release the service when done
    context.ungetService(dbRef);
  }
}
```

### Use ServiceTracker for Dynamic Services

```typescript
import { ServiceTracker } from '@pandino/pandino';
import type { BundleContext } from '@pandino/pandino';
import type { AuthService } from './types';

class SecurityManager {
  private authTracker: ServiceTracker<AuthService>;

  constructor(private context: BundleContext) {
    this.authTracker = new ServiceTracker(context, 'AuthService');
  }

  start(): void {
    this.authTracker.open();
  }

  stop(): void {
    this.authTracker.close();
  }

  isAuthenticated(userId: string, token: string): boolean {
    const authService = this.authTracker.getService();
    if (!authService) {
      console.warn('No auth service available');
      return false;
    }

    return authService.validateToken(userId, token);
  }
}
```

### Use Declarative Services When Possible

```typescript
import { Component, Service, Reference, Activate } from '@pandino/decorators';
import type { ComponentContext } from '@pandino/pandino';
import type { LogService, DatabaseService } from './types';

@Component({ name: 'user.service' })
@Service({ interfaces: ['UserService'] })
class UserService {
  @Reference({ interface: 'LogService' })
  private logger?: LogService;

  @Reference({ interface: 'DatabaseService' })
  private database?: DatabaseService;

  @Activate
  activate(context: ComponentContext): void {
    this.logger?.info('UserService activated');
  }

  getUserById(id: string): User | null {
    this.logger?.debug(`Looking up user with ID: ${id}`);
    return this.database?.query(`SELECT * FROM users WHERE id = '${id}'`)[0] || null;
  }
}
```

## Conclusion

The Service Registry is the foundation of Pandino's modular architecture. By providing a dynamic way for services to discover each other, it enables loose coupling, runtime flexibility, and powerful service selection capabilities. Whether you're using direct registration, declarative services, or React hooks, the Service Registry ensures your components can work together without tight dependencies.
