---
sidebar_position: 3
---

# @pandino/decorators

[![npm version](https://badge.fury.io/js/@pandino%2Fdecorators.svg)](https://badge.fury.io/js/@pandino%2Fdecorators)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-EPL2.0-blue.svg)](LICENSE.txt)

TypeScript decorators for the Pandino framework that enable declarative service components.

## Installation

```bash
npm install @pandino/decorators
```

## TypeScript Configuration

To use these decorators, you must enable experimental decorators in your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

## Available Decorators

### @Component

Defines a component with lifecycle and configuration options.

```typescript
import { Component } from '@pandino/decorators';

@Component({
  name: 'user.service',
  immediate: true,
  configurationPid: 'user.service.config'
})
class UserService {
  // Component implementation
}
```

#### Options

- `name`: (required) Unique identifier for the component
- `immediate`: (optional) If true, the component is activated immediately when registered
- `configurationPid`: (optional) Configuration PID for the component
- `factory`: (optional) If true, the component is a factory component
- `scope`: (optional) Service scope (singleton, bundle, prototype)
- `configurationPolicy`: (optional) How configuration is handled

### @Service

Exposes a component as a service with specified interfaces.

```typescript
import { Component, Service } from '@pandino/decorators';

@Component({ name: 'greeting.service' })
@Service({
  interfaces: ['GreetingService'],
  properties: {
    'service.ranking': 100,
    'service.vendor': 'Pandino'
  }
})
class GreetingServiceImpl {
  greet(name: string): string {
    return `Hello, ${name}!`;
  }
}
```

#### Options

- `interfaces`: (required) Array of service interface names
- `properties`: (optional) Service properties for filtering and ranking

### @Reference

Injects service dependencies into components.

```typescript
import { Component, Service, Reference } from '@pandino/decorators';
import type { LogService } from '@pandino/pandino';

@Component({ name: 'user.service' })
@Service({ interfaces: ['UserService'] })
class UserService {
  @Reference({
    interface: 'LogService',
    cardinality: '1..1',
    policy: 'static',
    bind: 'setLogger',
    unbind: 'unsetLogger'
  })
  private logger?: LogService;

  setLogger(service: LogService): void {
    this.logger = service;
    this.logger.info('Logger service bound');
  }

  unsetLogger(service: LogService): void {
    this.logger = undefined;
  }

  createUser(userData: any): void {
    this.logger?.info('Creating user', undefined, userData);
    // Implementation...
  }
}
```

#### Options

- `interface`: (required) Service interface name
- `target`: (optional) Target property name (defaults to decorated property)
- `cardinality`: (optional) Cardinality of the reference ('0..1', '1..1', '0..n', '1..n')
- `policy`: (optional) Policy for the reference ('static' or 'dynamic')
- `policyOption`: (optional) Policy option ('reluctant' or 'greedy')
- `bind`: (optional) Method name to call when binding the service
- `unbind`: (optional) Method name to call when unbinding the service
- `updated`: (optional) Method name to call when the service is updated
- `filter`: (optional) LDAP filter for service selection

### @Property

Adds component properties.

```typescript
import { Component, Service, Property } from '@pandino/decorators';

@Component({ name: 'email.service' })
@Service({ interfaces: ['EmailService'] })
class EmailService {
  @Property({ name: 'email.sender', value: 'noreply@example.com' })
  private sender: string;

  @Property({ name: 'email.retry.count', value: 3 })
  private retryCount: number;

  sendEmail(to: string, subject: string, body: string): void {
    console.log(`Sending email from ${this.sender} to ${to}`);
    // Implementation with retry logic using this.retryCount
  }
}
```

#### Options

- `name`: (required) Property name
- `value`: (required) Property value

### @Activate

Marks a method to be called when the component is activated.

```typescript
import { Component, Service, Activate } from '@pandino/decorators';
import type { ComponentContext } from '@pandino/pandino';

@Component({ name: 'cache.service' })
@Service({ interfaces: ['CacheService'] })
class CacheService {
  private cache = new Map<string, any>();

  @Activate
  activate(context: ComponentContext): void {
    console.log('Cache service activated');
    // Initialize cache, connect to storage, etc.
  }

  get(key: string): any {
    return this.cache.get(key);
  }

  set(key: string, value: any): void {
    this.cache.set(key, value);
  }
}
```

### @Deactivate

Marks a method to be called when the component is deactivated.

```typescript
import { Component, Service, Activate, Deactivate } from '@pandino/decorators';
import type { ComponentContext } from '@pandino/pandino';

@Component({ name: 'database.service' })
@Service({ interfaces: ['DatabaseService'] })
class DatabaseService {
  private connection: any;

  @Activate
  activate(context: ComponentContext): void {
    console.log('Database service activated');
    this.connection = this.connect();
  }

  @Deactivate
  deactivate(context: ComponentContext): void {
    console.log('Database service deactivated');
    if (this.connection) {
      this.connection.close();
      this.connection = null;
    }
  }

  private connect() {
    // Connect to database
    return { close: () => console.log('Connection closed') };
  }

  query(sql: string): any[] {
    // Execute query using this.connection
    return [];
  }
}
```

### @Modified

Marks a method to be called when the component's configuration changes.

```typescript
import { Component, Service, Activate, Modified } from '@pandino/decorators';
import type { ComponentContext } from '@pandino/pandino';

@Component({
  name: 'config.aware.service',
  configurationPid: 'config.aware.service'
})
@Service({ interfaces: ['ConfigAwareService'] })
class ConfigAwareService {
  private config: Record<string, any> = {};

  @Activate
  activate(context: ComponentContext, config?: Record<string, any>): void {
    console.log('Service activated');
    if (config) {
      this.config = config;
    }
  }

  @Modified
  modified(config: Record<string, any>): void {
    console.log('Configuration changed', config);
    this.config = config;
    this.applyConfiguration();
  }

  private applyConfiguration(): void {
    // Apply new configuration
    console.log('Applied new configuration:', this.config);
  }
}
```

## Complete Example

Here's a complete example showing how to use multiple decorators together:

```typescript
import {
  Component,
  Service,
  Reference,
  Property,
  Activate,
  Deactivate,
  Modified
} from '@pandino/decorators';
import type {
  ComponentContext,
  LogService,
  ConfigurationAdmin
} from '@pandino/pandino';

interface UserData {
  id: string;
  name: string;
  email: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

interface NotificationService {
  sendNotification(userId: string, message: string): Promise<void>;
}

@Component({
  name: 'user.manager',
  immediate: true,
  configurationPid: 'user.manager.config'
})
@Service({
  interfaces: ['UserManager'],
  properties: {
    'service.vendor': 'Pandino',
    'service.ranking': 100
  }
})
class UserManager {
  private users = new Map<string, User>();

  @Reference({ interface: 'LogService' })
  private logger?: LogService;

  @Reference({
    interface: 'NotificationService',
    cardinality: '0..1',
    policy: 'dynamic'
  })
  private notificationService?: NotificationService;

  @Reference({ interface: 'ConfigurationAdmin' })
  private configAdmin?: ConfigurationAdmin;

  @Property({ name: 'user.validation.enabled', value: true })
  private validationEnabled: boolean;

  @Property({ name: 'user.notification.enabled', value: true })
  private notificationEnabled: boolean;

  @Activate
  async activate(context: ComponentContext, config?: Record<string, any>): Promise<void> {
    this.logger?.info('UserManager activated');

    if (config) {
      this.applyConfiguration(config);
    }

    // Initialize user store
    await this.loadUsers();
  }

  @Deactivate
  deactivate(context: ComponentContext): void {
    this.logger?.info('UserManager deactivated');
    this.users.clear();
  }

  @Modified
  modified(config: Record<string, any>): void {
    this.logger?.info('UserManager configuration changed');
    this.applyConfiguration(config);
  }

  private applyConfiguration(config: Record<string, any>): void {
    this.validationEnabled = config.validationEnabled ?? this.validationEnabled;
    this.notificationEnabled = config.notificationEnabled ?? this.notificationEnabled;
  }

  private async loadUsers(): Promise<void> {
    // Load users from storage
    this.logger?.info('Loading users from storage');
  }

  async createUser(userData: UserData): Promise<User> {
    if (this.validationEnabled) {
      this.validateUserData(userData);
    }

    const user: User = {
      ...userData,
      createdAt: new Date()
    };

    this.users.set(user.id, user);
    this.logger?.info('User created', undefined, { userId: user.id });

    if (this.notificationEnabled && this.notificationService) {
      await this.notificationService.sendNotification(
        user.id,
        `Welcome, ${user.name}!`
      );
    }

    return user;
  }

  getUser(id: string): User | undefined {
    return this.users.get(id);
  }

  private validateUserData(userData: UserData): void {
    if (!userData.id) throw new Error('User ID is required');
    if (!userData.name) throw new Error('User name is required');
    if (!userData.email) throw new Error('User email is required');
    if (!userData.email.includes('@')) throw new Error('Invalid email format');
  }
}
```

## Integration with Service Component Runtime (SCR)

To use these decorated components with Pandino's Service Component Runtime:

```typescript
import { Component, Service } from '@pandino/decorators';
import type { BundleActivator, BundleContext, ServiceComponentRuntime } from '@pandino/pandino';

// Define components with decorators
@Component({ name: 'greeting.service' })
@Service({ interfaces: ['GreetingService'] })
class GreetingService {
  greet(name: string): string {
    return `Hello, ${name}!`;
  }
}

// Create a bundle activator that registers components with SCR
const activator: BundleActivator = {
  async start(context: BundleContext) {
    // Get SCR service
    const scrRef = context.getServiceReference<ServiceComponentRuntime>('ServiceComponentRuntime')!;
    const scr = context.getService(scrRef)!;
    const bundleId = context.getBundle().getBundleId();

    // Register components
    await scr.registerComponent(GreetingService, bundleId);

    console.log('Components registered with SCR');
  },

  async stop(context: BundleContext) {
    // Cleanup happens automatically when the bundle stops
  }
};

// Export bundle definition
export default {
  headers: {
    bundleSymbolicName: 'com.example.services',
    bundleVersion: '1.0.0',
  },
  activator
};
```

Alternatively, you can use the automatic component registration feature:

```typescript
// bundle.ts
import { GreetingService } from './services/greeting-service';
import { UserService } from './services/user-service';

export default {
  headers: {
    bundleSymbolicName: 'com.example.services',
    bundleVersion: '1.0.0',
  },
  // Components are automatically registered by SCR
  components: [GreetingService, UserService]
};
```
