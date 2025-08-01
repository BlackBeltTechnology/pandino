# @pandino/react-hooks

[![npm version](https://badge.fury.io/js/@pandino%2Freact-hooks.svg)](https://badge.fury.io/js/@pandino%2Freact-hooks)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-EPL2.0-blue.svg)](LICENSE.txt)


React hooks and components for seamless integration with the Pandino framework. Build modular React applications where components can dynamically discover and use services.

## Installation

```bash
npm install @pandino/pandino @pandino/react-hooks
```

## Quick Start

```typescript
// main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { PandinoProvider } from '@pandino/react-hooks';
import App from './App';

// The provider handles framework initialization automatically
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PandinoProvider bundles={[import('./bundles/greeting-service-bundle.ts')]}>
      <App />
    </PandinoProvider>
  </StrictMode>
);
```

```typescript
// App.tsx
import React from 'react';
import { useService, usePandinoContext } from '@pandino/react-hooks';

interface GreetingService {
  greet(name: string): string;
  getWelcomeMessage(): string;
}

function App() {
  const { bundleContext } = usePandinoContext();
  const { service: greetingService, loading } = useService<GreetingService>('GreetingService');

  if (loading || !greetingService) {
    return <div>Loading greeting service...</div>;
  }

  return (
    <div>
      <h1>{greetingService.greet('React')}</h1>
      <p>Framework Status: {bundleContext ? 'Connected' : 'Initializing'}</p>
    </div>
  );
}

export default App;
```

## React Hooks

### usePandinoContext: Framework Access

Access the framework instance and bundle context:

```typescript
import { usePandinoContext } from '@pandino/react-hooks';

function FrameworkStatus() {
  const { bundleContext, isInitialized } = usePandinoContext();

  return (
    <div>
      <div className={`status-dot ${bundleContext ? 'connected' : 'disconnected'}`}></div>
      <span>Framework: {bundleContext ? 'Connected' : 'Initializing...'}</span>
    </div>
  );
}
```

### useService: Service Discovery

Get a single service instance with loading state:

```typescript
import { useService } from '@pandino/react-hooks';

function UserProfile({ userId }: { userId: string }) {
  const { service: userService, loading } = useService<UserService>('UserService');
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

  return <div>Welcome, {user.name}!</div>;
}
```

## Real-World Component Examples

### Service-Powered Greeting Component

```typescript
// components/Greeting.tsx
import { useState } from 'react';
import { useService } from '@pandino/react-hooks';

interface GreetingService {
  greet(name: string): string;
  getRandomGreeting(name: string): string;
  getWelcomeMessage(): string;
}

function Greeting({ name }: { name: string }) {
  const { service: greetingService, loading } = useService<GreetingService>('GreetingService');
  const [useRandomGreeting, setUseRandomGreeting] = useState(false);

  if (loading || !greetingService) {
    return (
      <div className="greeting-container">
        <div className="loading-spinner"></div>
        <p>Loading greeting service...</p>
      </div>
    );
  }

  const currentGreeting = useRandomGreeting
    ? greetingService.getRandomGreeting(name)
    : greetingService.greet(name);

  return (
    <div className="greeting-container">
      <h2>{currentGreeting}</h2>
      <p>{greetingService.getWelcomeMessage()}</p>

      <button onClick={() => setUseRandomGreeting(!useRandomGreeting)}>
        {useRandomGreeting ? '🎲 Random Mode ON' : '🎯 Standard Mode'}
      </button>
    </div>
  );
}
```

### Bundle Information Display

```typescript
// components/BundleInfo.tsx
import React from 'react';
import { usePandinoContext } from '@pandino/react-hooks';
import { BUNDLE_STATES } from '@pandino/pandino';

function BundleInfo() {
  const { bundleContext, isInitialized } = usePandinoContext();
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);

  // Listen for bundle changes
  React.useEffect(() => {
    if (!bundleContext) return;

    const bundleListener = {
      bundleChanged: () => setRefreshTrigger(prev => prev + 1)
    };

    bundleContext.addBundleListener(bundleListener);
    return () => bundleContext.removeBundleListener(bundleListener);
  }, [bundleContext]);

  const bundles = React.useMemo(() => {
    if (!bundleContext || !isInitialized) return [];

    return bundleContext.getBundles().map(bundle => ({
      id: bundle.getBundleId(),
      name: bundle.getSymbolicName(),
      state: bundle.getState(),
      version: bundle.getVersion()
    }));
  }, [bundleContext, isInitialized, refreshTrigger]);

  return (
    <div className="bundle-info">
      <h3>Bundle Status</h3>
      {bundles.map(bundle => (
        <div key={bundle.id} className="bundle-item">
          <span>{bundle.name} ({bundle.version})</span>
          <span className={`state state-${bundle.state}`}>
            {Object.entries(BUNDLE_STATES).find(([_, value]) => value === bundle.state)?.[0]}
          </span>
        </div>
      ))}
    </div>
  );
}
```

## Bundle Integration Patterns

### SCR Component Service Bundle

```typescript
// bundles/greeting-service-bundle.ts
import { Component, Service, Activate, Deactivate, ServiceComponentRuntime } from '@pandino/pandino';
import type { ComponentContext, BundleActivator, BundleContext } from '@pandino/pandino';

export interface GreetingService {
  greet(name: string): string;
  getWelcomeMessage(): string;
  getRandomGreeting(name: string): string;
}

@Component({
  name: 'greeting.service',
  immediate: true,
})
@Service({
  interfaces: ['GreetingService'],
})
export class GreetingServiceComponent implements GreetingService {
  private greetings = [
    'Hello, {name}! Welcome to Pandino! ✨',
    'Greetings, {name}! Dynamic services at work! 🚀',
    'Hey there, {name}! SCR components running! 🎉',
  ];

  @Activate
  activate(_context: ComponentContext): void {
    console.log('GreetingService component activated');
  }

  @Deactivate
  deactivate(_context: ComponentContext): void {
    console.log('GreetingService component deactivated');
  }

  greet(name: string): string {
    return `Hello, ${name}! Welcome to Pandino!`;
  }

  getWelcomeMessage(): string {
    return 'Welcome to the Pandino framework! 🎯';
  }

  getRandomGreeting(name: string): string {
    const randomIndex = Math.floor(Math.random() * this.greetings.length);
    return this.greetings[randomIndex].replace('{name}', name);
  }
}

export class GreetingServiceBundleActivator implements BundleActivator {
  private scrRef: ServiceReference<ServiceComponentRuntime> | null = null;

  async start(context: BundleContext): Promise<void> {
    console.log('Greeting Service Bundle started');
    this.scrRef = context.getServiceReference<ServiceComponentRuntime>('ServiceComponentRuntime')!;
    const scr = context.getService(this.scrRef)!;
    const bundleId = context.getBundle().getBundleId();

    await scr.registerComponent(GreetingServiceComponent, bundleId);
  }

  async stop(context: BundleContext): Promise<void> {
    console.log('Greeting Service Bundle stopped');
    if (this.scrRef) {
      context.ungetService(this.scrRef);
      this.scrRef = null;
    }
  }
}

// Export bundle with proper activator
export default {
  headers: {
    bundleSymbolicName: 'com.example.greeting.service',
    bundleVersion: '1.0.0',
    bundleName: 'Greeting Service SCR Bundle',
  },
  activator: new GreetingServiceBundleActivator(),
};
```

## Advanced Patterns

### Dynamic Service Switching

```typescript
function PaymentComponent() {
  const { service: paymentService, loading } = useService<PaymentService>('PaymentService');
  const [paymentMethod, setPaymentMethod] = useState('credit-card');

  // Service registry automatically provides the highest-ranked service
  // You can register multiple implementations with different rankings

  if (loading || !paymentService) {
    return <div>Loading payment service...</div>;
  }

  return (
    <div>
      <select onChange={(e) => setPaymentMethod(e.target.value)}>
        <option value="credit-card">Credit Card</option>
        <option value="paypal">PayPal</option>
      </select>
      <button onClick={() => paymentService.processPayment(paymentMethod)}>
        Pay Now
      </button>
    </div>
  );
}
```

### Service Availability Gates

```typescript
function ProtectedFeature({ children }: { children: React.ReactNode }) {
  const { service: authService } = useService<AuthService>('AuthService');
  const { service: featureService } = useService<FeatureToggleService>('FeatureToggleService');

  if (!authService || !featureService) {
    return <div>Loading required services...</div>;
  }

  if (!authService.isAuthenticated()) {
    return <div>Please log in to access this feature.</div>;
  }

  if (!featureService.isEnabled('premium-features')) {
    return <div>This feature is not available.</div>;
  }

  return <>{children}</>;
}
```

### Bundle Lifecycle Management

```typescript
function AdminPanel() {
  const { bundleContext } = usePandinoContext();
  const [bundles, setBundles] = useState<Bundle[]>([]);

  useEffect(() => {
    if (bundleContext) {
      setBundles(bundleContext.getBundles());
    }
  }, [bundleContext]);

  const stopBundle = async (bundleId: number) => {
    const bundle = bundles.find(b => b.getBundleId() === bundleId);
    if (bundle) {
      await bundle.stop();
      setBundles(bundleContext.getBundles());
    }
  };

  return (
    <div>
      <h3>Bundle Management</h3>
      {bundles.map(bundle => (
        <div key={bundle.getBundleId()}>
          <span>{bundle.getSymbolicName()}</span>
          <button onClick={() => stopBundle(bundle.getBundleId())}>
            Stop
          </button>
        </div>
      ))}
    </div>
  );
}
```

## Performance Tips

### Conditional Service Loading

```typescript
function ConditionalServiceComponent({ shouldLoad }: { shouldLoad: boolean }) {
  // Only attempt to load service when needed
  const { service, loading } = useService<ExpensiveService>(
    shouldLoad ? 'ExpensiveService' : null
  );

  if (!shouldLoad) {
    return <div>Feature disabled</div>;
  }

  if (loading) {
    return <div>Loading service...</div>;
  }

  return <div>{service ? 'Service ready!' : 'Service unavailable'}</div>;
}
```

### Service Result Caching

```typescript
function CachedDataComponent() {
  const { service: dataService } = useService<DataService>('DataService');
  const [cachedData, setCachedData] = useState<Data[]>([]);
  const [lastFetch, setLastFetch] = useState<number>(0);

  useEffect(() => {
    if (dataService && Date.now() - lastFetch > 60000) { // Cache for 1 minute
      dataService.fetchData().then(data => {
        setCachedData(data);
        setLastFetch(Date.now());
      });
    }
  }, [dataService, lastFetch]);

  return <DataTable data={cachedData} />;
}
```

## API Reference

### Hooks

- `usePandinoContext()` - Returns `{ bundleContext, isInitialized }`
- `useService<T>(interface: string)` - Returns `{ service: T | null, loading: boolean }`

### Components

- `<PandinoProvider bundles={bundleImports}>` - Root provider that initializes framework with bundles

### Types

- `BundleContext` - Service registry access and bundle management
- `Bundle` - Individual bundle instance with lifecycle methods

## License

Eclipse Public License - v 2.0
