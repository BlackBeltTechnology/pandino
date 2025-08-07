---
sidebar_position: 2
---

# The Whiteboard Pattern

## What is the Whiteboard Pattern?

The Whiteboard Pattern is a service-oriented design pattern that promotes loose coupling between components in a modular system. In this pattern:

- Service providers register their capabilities with a central registry (the "whiteboard")
- Service consumers discover and use these services through the registry
- There is no direct dependency between providers and consumers
- The pattern is dynamic, allowing services to be registered and unregistered at runtime

Unlike traditional patterns where consumers explicitly look up services, in the Whiteboard Pattern, providers "pin up" their services on the whiteboard (service registry), and the framework or other components discover them based on their interfaces and properties.

## How Pandino Implements the Whiteboard Pattern

Pandino, as a TypeScript implementation of OSGi concepts for browsers, provides a robust implementation of the Whiteboard Pattern through its service registry. Here's how it works:

### 1. Service Registration

Services can be registered in several ways:

**Direct Registration via BundleContext:**

```typescript
// Register a service with metadata
const databaseService = new MySQLService();
context.registerService('DatabaseService', databaseService, {
  'db.type': 'mysql',
  'db.host': 'localhost',
  'service.ranking': 100
});
```

**Declarative Registration via Decorators:**

```typescript
import { Component, Service } from '@pandino/decorators';

@Component({ name: 'greeting.service' })
@Service({ interfaces: ['GreetingService'] })
class GreetingServiceComponent implements GreetingService {
  // Service implementation...
  greet(name: string): string {
    return `Hello, ${name}!`;
  }

  getWelcomeMessage(): string {
    return 'Welcome to Pandino!';
  }
}
```

### 2. Service Discovery

Consumers can discover services through various mechanisms:

**Direct Lookup:**

```typescript
import type { GreetingService, DatabaseService } from './types';

// Find services using interface name and optional LDAP filter
const serviceRef = context.getServiceReference<GreetingService>('GreetingService');
const greetingService = context.getService(serviceRef)!;

// Or with filtering
const mysqlRefs = context.getServiceReferences<DatabaseService>(
  'DatabaseService',
  '(db.type=mysql)'
);
```

**React Hooks (for UI Components):**

```tsx
import { useService } from '@pandino/react-hooks';
import type { GreetingService } from './types';

function Greeting({ name }: { name: string }) {
  // Discover the service dynamically
  const { service: greetingService, loading } = useService<GreetingService>('GreetingService');

  if (loading || !greetingService) {
    return <div>Loading greeting service...</div>;
  }

  return <h2>{greetingService.greet(name)}</h2>;
}
```

**Service Trackers:**

```typescript
import { ServiceTracker } from '@pandino/pandino';
import type { DatabaseService } from './types';

// Track services dynamically
const dbTracker = new ServiceTracker<DatabaseService>(context, 'DatabaseService', {
  addingService: (ref) => {
    const service = context.getService(ref);
    console.log('Database service available');
    return service;
  },
  removedService: (ref, service) => {
    console.log('Database service removed');
    context.ungetService(ref);
  }
});

dbTracker.open();
```

### 3. Event Handling with Whiteboard

A classic example of the Whiteboard Pattern in OSGi is event handling, which Pandino implements through the EventAdmin service:

```typescript
import { Component, Service, Property } from '@pandino/decorators';
import type { EventHandler, Event } from '@pandino/pandino';

// Event handler implementation
@Component({ name: 'user.event.handler' })
@Service({ interfaces: ['EventHandler'] })
@Property({ name: 'event.topics', value: 'user/*' })
class UserEventHandler implements EventHandler {
  handleEvent(event: Event): void {
    console.log(`Received event on topic ${event.getTopic()}`);
    // Process the event...
  }
}
```

The EventAdmin service discovers all registered EventHandler services and routes events to them based on their topic subscriptions, without the handlers needing to know about the event sources.

### 4. Benefits in the Browser Context

The Whiteboard Pattern in Pandino's browser environment offers several advantages:

- **Loose Coupling**: Components don't need direct references to each other
- **Dynamic Discovery**: Services can appear and disappear at runtime
- **Declarative Registration**: TypeScript decorators simplify service registration
- **Filtered Discovery**: LDAP filters enable precise service selection
- **Multiple Implementations**: Several implementations of the same service can coexist
- **Service Ranking**: Higher-ranked services are preferred automatically
- **React Integration**: UI components can dynamically discover and use services

## Practical Application in Pandino

### Service-Powered React Components

```tsx
import React, { useState, useEffect } from 'react';
import { useService } from '@pandino/react-hooks';
import type { UserService, ThemeService, User } from './types';

function UserProfile({ userId }: { userId: string }) {
  // Discover user service dynamically
  const { service: userService, loading } = useService<UserService>('UserService');
  // Discover theme service dynamically
  const { service: themeService } = useService<ThemeService>('ThemeService');

  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (userService) {
      userService.getUser(userId).then(setUser);
    }
  }, [userService, userId]);

  if (loading || !userService) {
    return <div>Loading user service...</div>;
  }

  if (!user) return <div>Loading user...</div>;

  // Use theme service if available, or fall back to defaults
  const theme = themeService?.getCurrentTheme() || { primaryColor: '#007bff' };

  return (
    <div style={{ color: theme.primaryColor }}>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </div>
  );
}
```

In this example, the React component discovers and uses multiple services without any direct dependencies on their implementations.

## Conclusion

The Whiteboard Pattern, as implemented in Pandino, brings the power of OSGi's service-oriented architecture to TypeScript and browser environments. It enables a highly decoupled, dynamic approach to service discovery and usage, making applications more modular, maintainable, and adaptable to changing requirements.

By leveraging TypeScript decorators and React hooks, Pandino makes the Whiteboard Pattern accessible and intuitive for frontend developers, bridging the gap between OSGi's powerful modularity concepts and modern web development practices.
