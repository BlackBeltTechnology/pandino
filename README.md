# Pandino: OSGi-Style Framework for TypeScript

[![npm version](https://badge.fury.io/js/@pandino%2Fpandino.svg)](https://badge.fury.io/js/@pandino%2Fpandino)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-EPL2.0-blue.svg)](LICENSE.txt)

> A lightweight TypeScript framework that brings **modular architecture** to your applications. Build loosely-coupled, maintainable applications where different parts can communicate without knowing about each other directly.

## Why Pandino?

**Traditional DI vs Pandino Service Registry:**

| Traditional DI | Pandino Service Registry |
|----------------|-------------------------|
| Static dependency injection | Dynamic service discovery |
| Compile-time wiring | Runtime service resolution |
| Hard-coded dependencies | LDAP-filtered service selection |
| Single service per interface | Multiple ranked services |
| Manual lifecycle management | Automatic service lifecycle |

## Key Features

| Feature | What it Solves | Benefit |
|---------|----------------|---------|
| 🔌 **Service Registry** | Hard-coded dependencies between modules | Services discover each other dynamically |
| 📦 **Bundle System** | Monolithic application architecture | Modular containers with independent lifecycles |
| 🔄 **Dynamic Dependencies** | Startup order dependencies | Bundles start in any order, dependencies resolve automatically |
| 📡 **Event System** | Tight coupling between modules | Publish-subscribe messaging with topic-based routing |
| ⚙️ **Configuration Management** | Static application configuration | Runtime configuration updates without restarts |
| 🏗️ **Declarative Services** | Complex service wiring boilerplate | Decorator-based dependency injection |
| ⚛️ **React Integration** | Framework complexity in React apps | Hook-based service discovery in components |

## 🚀 Quick Concept Demo

```typescript
import { Component, Service, Reference, Activate } from '@pandino/pandino';
import type { ComponentContext } from '@pandino/pandino';

// 1. Define service interfaces
interface UserService {
  findUser(id: string): User | null;
  createUser(data: UserData): User;
}

interface NotificationService {
  notify(message: string): void;
}

// 2. Create service implementations with SCR decorators
@Component({ name: 'user.service', immediate: true })
@Service({ interfaces: ['UserService'] })
class UserServiceImpl implements UserService {
  private users = new Map<string, User>();

  @Activate
  activate(context: ComponentContext): void {
    console.log('UserService activated');
  }

  findUser(id: string): User | null {
    return this.users.get(id) || null;
  }

  createUser(data: UserData): User {
    const user = new User(data);
    this.users.set(user.id, user);
    return user;
  }
}

@Component({ name: 'notification.service', immediate: true })
@Service({ interfaces: ['NotificationService'] })
class NotificationServiceImpl implements NotificationService {
  @Activate
  activate(): void {
    console.log('NotificationService activated');
  }

  notify(message: string): void {
    console.log(`📧 Notification: ${message}`);
  }
}

@Component({ name: 'order.service' })
@Service({ interfaces: ['OrderService'] })
class OrderService {
  // Services are injected automatically when available
  @Reference({ interface: 'UserService' })
  private userService?: UserService;

  @Reference({ interface: 'NotificationService' })
  private notificationService?: NotificationService;

  @Activate
  activate(): void {
    console.log('OrderService activated with dependencies');
  }

  async createOrder(userId: string, items: Item[]): Promise<Order> {
    // Dependencies resolved automatically - no imports needed!
    const user = this.userService?.findUser(userId);
    if (!user) throw new Error('User not found');

    const order = new Order(user, items);
    this.notificationService?.notify(`Order confirmed for ${user.email}`);
    return order;
  }
}

// 3. Register components with SCR
const scr = context.getService(context.getServiceReference('ServiceComponentRuntime')!);
const bundleId = context.getBundle().getBundleId();
await scr.registerComponent(UserServiceImpl, bundleId);
await scr.registerComponent(NotificationServiceImpl, bundleId);
await scr.registerComponent(OrderService, bundleId);
```

**The Magic:** All three services discover each other automatically. `OrderService` gets both dependencies injected without knowing how they're implemented!

## Packages

| Package | Purpose | Documentation |
|---------|---------|---------------|
| [`@pandino/pandino`](./packages/pandino) | Core framework with service registry, bundles, and built-in services | [Core Documentation](./packages/pandino/README.md) |
| [`@pandino/react-hooks`](./packages/react-hooks) | React integration with hooks and components | [React Documentation](./packages/react-hooks/README.md) |

## Architecture Concepts

### Service-Oriented Architecture
Services are registered in a central registry and discovered by interface name and properties:

```typescript
// Register with metadata
context.registerService('DatabaseService', new MySQLService(), {
  'db.type': 'mysql',
  'service.ranking': 100
});

// Discover by capabilities
const dbRefs = context.getServiceReferences('DatabaseService', '(db.type=mysql)');
```

### Bundle Modularity
Bundles are self-contained modules with independent lifecycles:

```typescript
// Each bundle manages its own services
const databaseBundle = {
  activator: {
    start(context) { /* register database services */ },
    stop(context) { /* cleanup */ }
  }
};
```

### Dynamic Dependencies
Order doesn't matter - dependencies resolve when services become available:

```typescript
await apiBundle.start();      // ✅ Starts immediately
await databaseBundle.start(); // ✅ API bundle automatically gets database service
```

### Extender Pattern
A pattern where a dedicated bundle (extender) monitors other bundles and provides functionality based on their metadata:

[→ Extender Pattern Documentation](./docs/extender-pattern.md)

### Whiteboard Pattern
A service-oriented pattern that promotes loose coupling through a central service registry:

[→ Whiteboard Pattern Documentation](./docs/whiteboard-pattern.md)

### Fragment Pattern
A pattern that allows a bundle (fragment) to attach to another bundle (host) and contribute its resources directly to the host:

[→ Fragment Pattern Documentation](./docs/fragment-pattern.md)

## Use Cases

| Scenario | Traditional Approach | Pandino Approach |
|----------|---------------------|------------------|
| **Microservices Architecture** | Hard-coded service URLs | Dynamic service discovery |
| **Plugin Systems** | Manual plugin loading | Bundle-based plugins with auto-discovery |
| **Feature Flags** | Code-level toggles | Service-level feature activation |
| **Multi-tenant Apps** | Complex configuration management | Service filtering by tenant properties |
| **A/B Testing** | Conditional code blocks | Multiple service implementations with ranking |

## Getting Started

Choose your integration approach:

### Core Framework
```bash
npm install @pandino/pandino
```
[→ Core Framework Guide](./packages/pandino/README.md)

### React Integration
```bash
npm install @pandino/pandino @pandino/react-hooks
```
[→ React Integration Guide](./packages/react-hooks/README.md)

## Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

## License

Eclipse Public License - v 2.0
