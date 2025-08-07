---
sidebar_position: 3
---

# Quick Start

This guide will help you get started with Pandino by creating a simple application that demonstrates the core concepts of the framework.

## Core Framework Example

Let's start with a basic example using the core Pandino framework:

```typescript
import { OSGiBootstrap, LogLevel } from '@pandino/pandino';
import type { BundleContext } from '@pandino/pandino';

// Define a service interface
interface GreetingService {
  sayHello(name: string): string;
}

// Create a service implementation
class SimpleGreetingService implements GreetingService {
  sayHello(name: string): string {
    return `Hello, ${name}!`;
  }
}

// Start the framework
async function startApp() {
  // 1. Initialize the framework
  const bootstrap = new OSGiBootstrap({
    frameworkLogLevel: LogLevel.INFO
  });
  const framework = await bootstrap.start();
  const context = framework.getBundleContext();

  // 2. Register the service
  const service = new SimpleGreetingService();
  context.registerService<GreetingService>('GreetingService', service);

  // 3. Find and use the service
  const serviceRef = context.getServiceReference<GreetingService>('GreetingService');
  if (serviceRef) {
    const greetingService = context.getService(serviceRef)!;
    console.log(greetingService.sayHello('World')); // "Hello, World!"
  }

  return { bootstrap, context };
}

startApp().catch(console.error);
```

## Using Declarative Services

Pandino provides a powerful declarative services model using TypeScript decorators:

```typescript
import { OSGiBootstrap, LogLevel } from '@pandino/pandino';
import { Component, Service, Reference, Activate } from '@pandino/decorators';
import type { ComponentContext, ServiceComponentRuntime } from '@pandino/pandino';

// Define service interfaces
interface UserService {
  findUser(id: string): User | null;
  createUser(data: UserData): User;
}

interface NotificationService {
  notify(message: string): void;
}

// Define data types
interface UserData {
  id: string;
  name: string;
  email: string;
}

class User {
  id: string;
  name: string;
  email: string;

  constructor(data: UserData) {
    this.id = data.id;
    this.name = data.name;
    this.email = data.email;
  }
}

interface Item {
  id: string;
  name: string;
  price: number;
}

class Order {
  id: string;
  user: User;
  items: Item[];

  constructor(user: User, items: Item[]) {
    this.id = Math.random().toString(36).substring(2, 9);
    this.user = user;
    this.items = items;
  }
}

// Create service implementations with SCR decorators
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

// Start the framework and register components
async function startApp() {
  const bootstrap = new OSGiBootstrap({
    frameworkLogLevel: LogLevel.INFO
  });
  const framework = await bootstrap.start();
  const context = framework.getBundleContext();

  // Get the SCR service
  const scrRef = context.getServiceReference<ServiceComponentRuntime>('ServiceComponentRuntime')!;
  const scr = context.getService(scrRef)!;
  const bundleId = context.getBundle().getBundleId();

  // Register components with SCR
  await scr.registerComponent(UserServiceImpl, bundleId);
  await scr.registerComponent(NotificationServiceImpl, bundleId);
  await scr.registerComponent(OrderService, bundleId);

  console.log('All components registered');

  return { bootstrap, context };
}

startApp().catch(console.error);
```

## React Integration

Pandino provides seamless integration with React through the `@pandino/react-hooks` package:

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { PandinoProvider, useService } from '@pandino/react-hooks';

// Define a service interface
interface GreetingService {
  greet(name: string): string;
  getWelcomeMessage(): string;
}

// Create a React component that uses the service
function Greeting({ name }: { name: string }) {
  const { service: greetingService, loading } = useService<GreetingService>('GreetingService');

  if (loading || !greetingService) {
    return <div>Loading greeting service...</div>;
  }

  return (
    <div>
      <h2>{greetingService.greet(name)}</h2>
      <p>{greetingService.getWelcomeMessage()}</p>
    </div>
  );
}

// Main App component
function App() {
  return (
    <div>
      <h1>Pandino React Example</h1>
      <Greeting name="React Developer" />
    </div>
  );
}

// Create a bundle that provides the GreetingService
const greetingServiceBundle = {
  headers: {
    bundleSymbolicName: 'com.example.greeting.service',
    bundleVersion: '1.0.0',
    bundleName: 'Greeting Service Bundle',
  },
  activator: {
    async start(context) {
      // Register a simple greeting service
      context.registerService<GreetingService>('GreetingService', {
        greet(name) {
          return `Hello, ${name}! Welcome to Pandino!`;
        },
        getWelcomeMessage() {
          return 'Enjoy building modular applications with Pandino and React!';
        }
      });
      console.log('Greeting service registered');
    },
    async stop() {
      console.log('Greeting service stopped');
    }
  }
};

// Render the app with the PandinoProvider
// Note: PandinoProvider expects an array of promises, not direct bundle objects
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PandinoProvider bundles={[Promise.resolve(greetingServiceBundle)]}>
      <App />
    </PandinoProvider>
  </StrictMode>
);
```

## Next Steps

Now that you've seen the basics of Pandino, you can explore more advanced topics:

- [Service Registry](/docs/core-concepts/service-registry) - Learn how services are registered and discovered
- [Bundle System](/docs/core-concepts/bundle-system) - Understand how bundles work as modular containers
- [Dynamic Dependencies](/docs/core-concepts/dynamic-dependencies) - See how dependencies are resolved automatically
- [Event System](/docs/core-concepts/event-system) - Learn about the publish-subscribe messaging system
- [Configuration Management](/docs/core-concepts/configuration-management) - Explore runtime configuration updates
