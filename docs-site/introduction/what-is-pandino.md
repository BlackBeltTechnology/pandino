---
title: What is Pandino?
description: A lightweight TypeScript framework that brings modular architecture, dynamic service discovery, and declarative dependency injection to your applications.
---

# What is Pandino?

Pandino is a lightweight TypeScript framework that brings **modular architecture** to your applications. It enables you to build loosely-coupled, maintainable systems where different parts can communicate without knowing about each other directly.

Inspired by the OSGi specification, Pandino provides a **service registry**, a **bundle system**, and **declarative dependency injection** -- all designed for the TypeScript ecosystem.

## Traditional DI vs Pandino

If you have used traditional dependency injection frameworks before, here is how Pandino differs:

| Traditional DI               | Pandino Service Registry        |
| ---------------------------- | ------------------------------- |
| Static dependency injection  | Dynamic service discovery       |
| Compile-time wiring          | Runtime service resolution      |
| Hard-coded dependencies      | LDAP-filtered service selection |
| Single service per interface | Multiple ranked services        |
| Manual lifecycle management  | Automatic service lifecycle     |

With Pandino, services are not wired together at compile time. Instead, they are **registered** in a central registry and **discovered** at runtime using interface names and property filters. This means modules can be added, removed, or replaced without touching the rest of the application.

## Key Features

| Feature                     | What it Solves                          | Benefit                                                        |
| --------------------------- | --------------------------------------- | -------------------------------------------------------------- |
| **Service Registry**        | Hard-coded dependencies between modules | Services discover each other dynamically                       |
| **Bundle System**           | Monolithic application architecture     | Modular containers with independent lifecycles                 |
| **Dynamic Dependencies**    | Startup order dependencies              | Bundles start in any order, dependencies resolve automatically |
| **Event System**            | Tight coupling between modules          | Publish-subscribe messaging with topic-based routing           |
| **Configuration Management** | Static application configuration       | Runtime configuration updates without restarts                 |
| **Declarative Services**    | Complex service wiring boilerplate      | Decorator-based dependency injection                           |
| **React Integration**       | Framework complexity in React apps      | Hook-based service discovery in components                     |
| **Rollup Bundle Plugin**    | Automated bundling of modules           | Simplifies and automates the bundling process                  |

Learn more about each feature in the package guides:
- [Core Framework](/guide/core-framework) -- Service registry, bundles, and built-in services
- [Decorators](/guide/decorators) -- Declarative service components with `@Component`, `@Service`, `@Reference`
- [React Hooks](/guide/react-hooks) -- Hook-based service discovery for React applications
- [Rollup Bundle Plugin](/guide/rollup-plugin) -- Automated bundle packaging for Vite and Rollup

## Quick Concept Demo

The following example shows how three services discover each other automatically using Pandino's decorator-based Service Component Runtime (SCR):

```typescript
import { Component, Service, Reference, Activate } from '@pandino/decorators';
import type { ComponentContext } from '@pandino/pandino';

// Define service interfaces
interface UserService {
  findUser(id: string): User | null;
  createUser(data: UserData): User;
}

interface NotificationService {
  notify(message: string): void;
}

// Implement services with decorators
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
    console.log(`Notification: ${message}`);
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
    const user = this.userService?.findUser(userId);
    if (!user) throw new Error('User not found');

    const order = new Order(user, items);
    this.notificationService?.notify(`Order confirmed for ${user.email}`);
    return order;
  }
}
```

All three services discover each other automatically. `OrderService` gets both dependencies injected without knowing how they are implemented, and without any manual wiring code.

For a deeper look at how declarative services work, see the [Declarative Services concept page](/concepts/declarative-services).

## Use Cases

| Scenario                       | Traditional Approach             | Pandino Approach                              |
| ------------------------------ | -------------------------------- | --------------------------------------------- |
| **Microservices Architecture** | Hard-coded service URLs          | Dynamic service discovery                     |
| **Plugin Systems**             | Manual plugin loading            | Bundle-based plugins with auto-discovery      |
| **Feature Flags**              | Code-level toggles               | Service-level feature activation              |
| **Multi-tenant Apps**          | Complex configuration management | Service filtering by tenant properties        |
| **A/B Testing**                | Conditional code blocks          | Multiple service implementations with ranking |

Pandino is particularly well-suited for applications that need to support extensibility at runtime. The [Extender Pattern](/patterns/extender-pattern), [Whiteboard Pattern](/patterns/whiteboard-pattern), and [Fragment Pattern](/patterns/fragment-pattern) provide proven approaches for building plugin systems, event-driven architectures, and composable module hierarchies.

## Next Steps

Ready to start building with Pandino? Head over to the [Getting Started guide](/introduction/getting-started) to install the framework and write your first service.
