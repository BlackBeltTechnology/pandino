# The Extender Pattern in Pandino

## What is the Extender Pattern?

The Extender Pattern is a fundamental design pattern in OSGi that enables a modular and dynamic approach to extending application functionality. In this pattern:

- A dedicated bundle, known as the **extender**, monitors the lifecycle of other bundles (the **extendees**)
- When an extendee bundle is started, the extender inspects it for specific metadata or resources
- Based on this metadata, the extender provides services and functionality on behalf of the extendee
- This relieves the extendee from implementing complex framework integration logic

The pattern is formally recognized in the OSGi Compendium Specification through the `osgi.extender` capability and requirement namespace.

## How Pandino Implements the Extender Pattern

In Pandino, the **Service Component Runtime (SCR)** is the primary implementation of the Extender Pattern. Here's how it works in the TypeScript-based, browser-focused implementation:

### 1. Component Declaration

Developers declare components using TypeScript decorators:

```typescript
@Component({ name: 'greeting.service', immediate: true })
@Service({ interfaces: ['GreetingService'] })
class GreetingServiceComponent implements GreetingService {
  @Activate
  activate(context: ComponentContext): void {
    console.log('GreetingService component activated');
  }

  // Service methods...
}
```

### 2. Bundle Registration

Components are registered with a bundle, either explicitly in the bundle's activator:

```typescript
async start(context: BundleContext): Promise<void> {
  const scrRef = context.getServiceReference<ServiceComponentRuntime>('ServiceComponentRuntime')!;
  const scr = context.getService(scrRef)!;
  const bundleId = context.getBundle().getBundleId();

  await scr.registerComponent(GreetingServiceComponent, bundleId);
}
```

Or implicitly through the bundle's components array:

```typescript
export default {
  headers: {
    bundleSymbolicName: 'com.example.services',
    bundleVersion: '1.0.0',
  },
  // Components are automatically registered by SCR
  components: [UserService, OrderService]
};
```

### 3. SCR as the Extender

The SCR service in Pandino acts as the extender by:

- Tracking bundle lifecycle events (installation, starting, stopping)
- Inspecting bundles for component declarations (via decorators or explicit registration)
- Managing the component lifecycle (activation, deactivation)
- Handling service registration and dependency injection

When a bundle with decorated components is started, SCR:
1. Detects the components through decorator metadata
2. Processes the component configuration
3. Manages service dependencies (via `@Reference` decorators)
4. Activates components (calling methods marked with `@Activate`)
5. Registers services in the service registry

### 4. Benefits in the Browser Context

In the browser environment, the Extender Pattern through SCR provides several advantages:

- **Reduced Boilerplate**: Developers focus on business logic rather than service registration code
- **Declarative Approach**: TypeScript decorators provide a clean, declarative way to define components
- **Dynamic Updates**: Components can be activated/deactivated as bundles start and stop
- **Dependency Management**: SCR handles service dependencies automatically
- **Lazy Loading**: Components can be loaded on demand, improving initial load performance

### Example: Declarative Services in Pandino

```typescript
// Define a component with dependencies
@Component({ name: 'order.service' })
@Service({ interfaces: ['OrderService'] })
class OrderService {
  // Dependencies are injected automatically when available
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
```

In this example, SCR (the extender) handles:
- Tracking when the component's bundle is started
- Waiting for required services to be available
- Injecting service dependencies
- Activating the component when dependencies are satisfied
- Managing the component's lifecycle

## Conclusion

The Extender Pattern, implemented through SCR in Pandino, brings the power of OSGi's dynamic modularity to TypeScript and browser environments. It enables a declarative approach to service components, reducing boilerplate code and allowing developers to focus on business logic while the framework handles the complex service lifecycle management.
