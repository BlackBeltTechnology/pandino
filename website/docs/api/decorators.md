---
sidebar_position: 3
---

# Decorators

Pandino provides a set of TypeScript decorators in the `@pandino/decorators` package that enable declarative service components. These decorators simplify the process of defining components, services, and dependencies.

## Installation

To use the decorators, you need to install the `@pandino/decorators` package:

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

## @Component

The `@Component` decorator defines a component with lifecycle and configuration options.

### Syntax

```typescript
@Component(options: ComponentOptions)
```

### Options

| Option | Type | Description |
|--------|------|-------------|
| `name` | `string` | **Required**. Unique identifier for the component. |
| `immediate` | `boolean` | If `true`, the component is activated immediately when registered. Default: `false`. |
| `configurationPid` | `string \| string[]` | Configuration PID(s) for the component. |
| `factory` | `boolean` | If `true`, the component is a factory component. Default: `false`. |
| `scope` | `'singleton' \| 'bundle' \| 'prototype'` | Service scope. Default: `'singleton'`. |
| `configurationPolicy` | `'optional' \| 'require' \| 'ignore'` | How configuration is handled. Default: `'optional'`. |
| `properties` | `Record<string, any>` | Additional component properties. |

### Examples

#### Basic Component

```typescript
import { Component } from '@pandino/decorators';

@Component({
  name: 'example.component'
})
class ExampleComponent {
  // Component implementation
}
```

#### Component with Configuration

```typescript
import { Component, Activate } from '@pandino/decorators';
import type { ComponentContext } from '@pandino/pandino';

@Component({
  name: 'config.aware.component',
  configurationPid: 'com.example.config',
  immediate: true
})
class ConfigAwareComponent {
  private config: Record<string, any> = {};

  @Activate
  activate(context: ComponentContext, config?: Record<string, any>): void {
    console.log('Component activated');
    if (config) {
      this.config = config;
      console.log('Configuration:', config);
    }
  }
}
```

#### Component with Multiple Configuration PIDs

```typescript
import { Component, Activate, Modified } from '@pandino/decorators';
import type { ComponentContext } from '@pandino/pandino';

@Component({
  name: 'multi.config.component',
  configurationPid: ['com.example.config.main', 'com.example.config.extra'],
  configurationPolicy: 'require'
})
class MultiConfigComponent {
  private mainConfig: Record<string, any> = {};
  private extraConfig: Record<string, any> = {};

  @Activate
  activate(context: ComponentContext, configs?: Record<string, any>[]): void {
    if (configs && configs.length >= 2) {
      this.mainConfig = configs[0] || {};
      this.extraConfig = configs[1] || {};
      console.log('Main config:', this.mainConfig);
      console.log('Extra config:', this.extraConfig);
    }
  }

  @Modified
  modified(configs: Record<string, any>[]): void {
    if (configs.length >= 2) {
      this.mainConfig = configs[0] || this.mainConfig;
      this.extraConfig = configs[1] || this.extraConfig;
      console.log('Updated main config:', this.mainConfig);
      console.log('Updated extra config:', this.extraConfig);
    }
  }
}
```

#### Component with Properties

```typescript
import { Component } from '@pandino/decorators';

@Component({
  name: 'property.component',
  properties: {
    'example.property': 'value',
    'example.number': 42,
    'example.boolean': true
  }
})
class PropertyComponent {
  // Component implementation
}
```

## @Service

The `@Service` decorator exposes a component as a service with specified interfaces.

### Syntax

```typescript
@Service(options: ServiceOptions)
```

### Options

| Option | Type | Description |
|--------|------|-------------|
| `interfaces` | `string[]` | **Required**. Array of service interface names. |
| `properties` | `Record<string, any>` | Service properties for filtering and ranking. |

### Examples

#### Basic Service

```typescript
import { Component, Service } from '@pandino/decorators';

@Component({ name: 'greeting.service' })
@Service({ interfaces: ['GreetingService'] })
class GreetingServiceImpl {
  greet(name: string): string {
    return `Hello, ${name}!`;
  }
}
```

#### Service with Multiple Interfaces

```typescript
import { Component, Service } from '@pandino/decorators';

@Component({ name: 'multi.interface.service' })
@Service({ interfaces: ['LogService', 'MetricsService'] })
class CombinedService {
  // LogService implementation
  log(message: string): void {
    console.log(message);
  }

  // MetricsService implementation
  recordMetric(name: string, value: number): void {
    console.log(`Metric ${name}: ${value}`);
  }
}
```

#### Service with Properties

```typescript
import { Component, Service } from '@pandino/decorators';

@Component({ name: 'database.service' })
@Service({
  interfaces: ['DatabaseService'],
  properties: {
    'db.type': 'mysql',
    'db.version': '8.0',
    'service.ranking': 100,
    'service.vendor': 'Pandino',
    'service.description': 'MySQL Database Service'
  }
})
class MySQLDatabaseService {
  // Service implementation
}
```

## @Reference

The `@Reference` decorator injects service dependencies into components.

### Syntax

```typescript
@Reference(options: ReferenceOptions)
```

### Options

| Option | Type | Description |
|--------|------|-------------|
| `interface` | `string` | **Required**. Service interface name. |
| `target` | `string` | Target property name (defaults to decorated property). |
| `cardinality` | `'0..1' \| '1..1' \| '0..n' \| '1..n'` | Cardinality of the reference. Default: `'1..1'`. |
| `policy` | `'static' \| 'dynamic'` | Policy for the reference. Default: `'static'`. |
| `policyOption` | `'reluctant' \| 'greedy'` | Policy option. Default: `'reluctant'`. |
| `bind` | `string` | Method name to call when binding the service. |
| `unbind` | `string` | Method name to call when unbinding the service. |
| `updated` | `string` | Method name to call when the service is updated. |
| `filter` | `string` | LDAP filter for service selection. |

### Examples

#### Basic Reference

```typescript
import { Component, Service, Reference } from '@pandino/decorators';
import type { LogService } from '@pandino/pandino';

@Component({ name: 'example.component' })
@Service({ interfaces: ['ExampleService'] })
class ExampleComponent {
  @Reference({ interface: 'LogService' })
  private logger?: LogService;

  doSomething(): void {
    this.logger?.info('Doing something');
  }
}
```

#### Optional Reference

```typescript
import { Component, Service, Reference } from '@pandino/decorators';
import type { MetricsService } from './types';

@Component({ name: 'example.component' })
@Service({ interfaces: ['ExampleService'] })
class ExampleComponent {
  @Reference({
    interface: 'MetricsService',
    cardinality: '0..1'  // Optional dependency
  })
  private metrics?: MetricsService;

  doSomething(): void {
    // Use metrics service if available
    if (this.metrics) {
      this.metrics.recordMetric('example.action', 1);
    }
  }
}
```

#### Multiple References

```typescript
import { Component, Service, Reference } from '@pandino/decorators';
import type { FilterService } from './types';

@Component({ name: 'pipeline.component' })
@Service({ interfaces: ['PipelineService'] })
class PipelineComponent {
  @Reference({
    interface: 'FilterService',
    cardinality: '0..n'  // Multiple optional dependencies
  })
  private filters: FilterService[] = [];

  process(data: any): any {
    let result = data;

    // Apply all filters
    for (const filter of this.filters) {
      result = filter.apply(result);
    }

    return result;
  }
}
```

#### Filtered Reference

```typescript
import { Component, Service, Reference } from '@pandino/decorators';
import type { PaymentGateway } from './types';

@Component({ name: 'payment.processor' })
@Service({ interfaces: ['PaymentProcessor'] })
class PaymentProcessor {
  @Reference({
    interface: 'PaymentGateway',
    filter: '(gateway.type=credit-card)'
  })
  private creditCardGateway?: PaymentGateway;

  @Reference({
    interface: 'PaymentGateway',
    filter: '(gateway.type=paypal)'
  })
  private paypalGateway?: PaymentGateway;

  processPayment(method: string, amount: number): void {
    if (method === 'credit-card' && this.creditCardGateway) {
      this.creditCardGateway.processPayment(amount);
    } else if (method === 'paypal' && this.paypalGateway) {
      this.paypalGateway.processPayment(amount);
    } else {
      throw new Error(`Unsupported payment method: ${method}`);
    }
  }
}
```

#### Dynamic Reference

```typescript
import { Component, Service, Reference } from '@pandino/decorators';
import type { ConfigService } from './types';

@Component({ name: 'dynamic.component' })
@Service({ interfaces: ['DynamicService'] })
class DynamicComponent {
  @Reference({
    interface: 'ConfigService',
    policy: 'dynamic'  // Component stays active when service changes
  })
  private configService?: ConfigService;

  getConfig(key: string): any {
    return this.configService?.getConfig(key);
  }
}
```

#### Custom Bind/Unbind Methods

```typescript
import { Component, Service, Reference } from '@pandino/decorators';
import type { DatabaseService } from './types';

@Component({ name: 'repository.component' })
@Service({ interfaces: ['RepositoryService'] })
class RepositoryComponent {
  private db: DatabaseService | null = null;
  private connected: boolean = false;

  @Reference({
    interface: 'DatabaseService',
    bind: 'setDatabase',
    unbind: 'unsetDatabase'
  })
  private dbRef?: DatabaseService;

  // Custom bind method
  setDatabase(service: DatabaseService): void {
    this.db = service;
    this.connected = true;
    console.log('Database service bound');
  }

  // Custom unbind method
  unsetDatabase(service: DatabaseService): void {
    this.db = null;
    this.connected = false;
    console.log('Database service unbound');
  }

  query(sql: string): any[] {
    if (!this.connected || !this.db) {
      throw new Error('Database not connected');
    }

    return this.db.query(sql);
  }
}
```

## @Property

The `@Property` decorator adds component properties.

### Syntax

```typescript
@Property(options: PropertyOptions)
```

### Options

| Option | Type | Description |
|--------|------|-------------|
| `name` | `string` | **Required**. Property name. |
| `value` | `any` | **Required**. Property value. |

### Examples

#### Basic Properties

```typescript
import { Component, Service, Property } from '@pandino/decorators';

@Component({ name: 'property.component' })
@Service({ interfaces: ['PropertyService'] })
class PropertyComponent {
  @Property({ name: 'service.vendor', value: 'Pandino' })
  private vendor: string;

  @Property({ name: 'service.ranking', value: 100 })
  private ranking: number;

  @Property({ name: 'service.description', value: 'Example service with properties' })
  private description: string;
}
```

#### Service PID Property

```typescript
import { Component, Service, Property } from '@pandino/decorators';
import type { ManagedService } from '@pandino/pandino';

@Component({ name: 'managed.component' })
@Service({ interfaces: ['ManagedService'] })
@Property({ name: 'service.pid', value: 'com.example.managed' })
class ManagedComponent implements ManagedService {
  updated(properties: Record<string, any> | null): void {
    if (properties) {
      console.log('Configuration updated:', properties);
    }
  }
}
```

## @Activate

The `@Activate` decorator marks a method to be called when the component is activated.

### Syntax

```typescript
@Activate
```

### Examples

#### Basic Activation

```typescript
import { Component, Service, Activate } from '@pandino/decorators';
import type { ComponentContext } from '@pandino/pandino';

@Component({ name: 'example.component' })
@Service({ interfaces: ['ExampleService'] })
class ExampleComponent {
  @Activate
  activate(context: ComponentContext): void {
    console.log('Component activated');
    console.log(`Bundle: ${context.getBundleContext().getBundle().getSymbolicName()}`);
  }
}
```

#### Activation with Configuration

```typescript
import { Component, Service, Activate } from '@pandino/decorators';
import type { ComponentContext } from '@pandino/pandino';

@Component({
  name: 'config.component',
  configurationPid: 'com.example.config'
})
@Service({ interfaces: ['ConfigService'] })
class ConfigComponent {
  private config: Record<string, any> = {};

  @Activate
  activate(context: ComponentContext, config?: Record<string, any>): void {
    console.log('Component activated');

    if (config) {
      this.config = config;
      console.log('Configuration:', config);
    }
  }
}
```

## @Deactivate

The `@Deactivate` decorator marks a method to be called when the component is deactivated.

### Syntax

```typescript
@Deactivate
```

### Examples

#### Basic Deactivation

```typescript
import { Component, Service, Activate, Deactivate } from '@pandino/decorators';
import type { ComponentContext } from '@pandino/pandino';

@Component({ name: 'example.component' })
@Service({ interfaces: ['ExampleService'] })
class ExampleComponent {
  @Activate
  activate(context: ComponentContext): void {
    console.log('Component activated');
  }

  @Deactivate
  deactivate(context: ComponentContext): void {
    console.log('Component deactivated');
  }
}
```

#### Resource Cleanup

```typescript
import { Component, Service, Activate, Deactivate } from '@pandino/decorators';
import type { ComponentContext } from '@pandino/pandino';

@Component({ name: 'resource.component' })
@Service({ interfaces: ['ResourceService'] })
class ResourceComponent {
  private resources: any[] = [];
  private intervalId: NodeJS.Timeout | null = null;

  @Activate
  activate(context: ComponentContext): void {
    console.log('Resource component activated');

    // Allocate resources
    this.resources.push(this.createResource('A'));
    this.resources.push(this.createResource('B'));

    // Start background task
    this.intervalId = setInterval(() => {
      console.log('Background task running');
    }, 5000);
  }

  @Deactivate
  deactivate(context: ComponentContext): void {
    console.log('Resource component deactivated');

    // Clean up resources
    for (const resource of this.resources) {
      resource.dispose();
    }
    this.resources = [];

    // Stop background task
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private createResource(name: string): any {
    return {
      name,
      dispose: () => console.log(`Resource ${name} disposed`)
    };
  }
}
```

## @Modified

The `@Modified` decorator marks a method to be called when the component's configuration changes.

### Syntax

```typescript
@Modified
```

### Examples

#### Basic Configuration Update

```typescript
import { Component, Service, Activate, Modified } from '@pandino/decorators';
import type { ComponentContext } from '@pandino/pandino';

@Component({
  name: 'config.component',
  configurationPid: 'com.example.config'
})
@Service({ interfaces: ['ConfigService'] })
class ConfigComponent {
  private config: Record<string, any> = {};

  @Activate
  activate(context: ComponentContext, config?: Record<string, any>): void {
    console.log('Component activated');

    if (config) {
      this.config = config;
      console.log('Initial configuration:', config);
    }
  }

  @Modified
  modified(config: Record<string, any>): void {
    console.log('Configuration updated:', config);
    this.config = config;
    this.applyConfiguration();
  }

  private applyConfiguration(): void {
    console.log('Applying configuration:', this.config);
  }
}
```

#### Validation in Modified

```typescript
import { Component, Service, Activate, Modified } from '@pandino/decorators';
import type { ComponentContext } from '@pandino/pandino';

@Component({
  name: 'rate.limiter',
  configurationPid: 'com.example.rate.limiter'
})
@Service({ interfaces: ['RateLimiter'] })
class RateLimiter {
  private maxRequests: number = 100;
  private windowMs: number = 60000;

  @Activate
  activate(context: ComponentContext, config?: Record<string, any>): void {
    if (config) {
      this.updateConfig(config);
    }
  }

  @Modified
  modified(config: Record<string, any>): void {
    this.updateConfig(config);
  }

  private updateConfig(config: Record<string, any>): void {
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

    console.log(`Rate limiter configured: ${this.maxRequests} requests per ${this.windowMs}ms`);
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

## Conclusion

These decorators provide a powerful way to define components, services, and dependencies in a declarative manner. By using decorators, you can reduce boilerplate code and make your application more maintainable and easier to understand.

For more information about how to use these decorators in your application, see the [Declarative Services](/docs/core-concepts/declarative-services) documentation.
