---
sidebar_position: 4
---

# React Hooks

Pandino provides a set of React hooks in the `@pandino/react-hooks` package that enable seamless integration with the Pandino framework. These hooks allow React components to discover and use services dynamically.

## Installation

To use the React hooks, you need to install both the core Pandino package and the React hooks package:

```bash
npm install @pandino/pandino @pandino/react-hooks
```

## PandinoProvider

The `PandinoProvider` component initializes the Pandino framework and provides the bundle context to all child components.

### Props

| Prop | Type | Description |
|------|------|-------------|
| `bundles` | `Promise<any>[]` | Array of bundle imports to be installed and started. |
| `bootstrapConfig` | `BootstrapConfig` | Optional configuration for the Pandino framework. |
| `children` | `ReactNode` | Child components that will have access to the Pandino context. |

### Example

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { PandinoProvider } from '@pandino/react-hooks';
import App from './App';

// Import bundles dynamically
const bundles = [
  import('./bundles/core-bundle'),
  import('./bundles/user-service-bundle'),
  import('./bundles/ui-bundle')
];

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PandinoProvider
      bundles={bundles}
      bootstrapConfig={{ frameworkLogLevel: 'INFO' }}
    >
      <App />
    </PandinoProvider>
  </StrictMode>
);
```

## usePandinoContext

The `usePandinoContext` hook provides access to the Pandino framework instance and bundle context.

### Return Value

| Property | Type | Description |
|----------|------|-------------|
| `bundleContext` | `BundleContext \| null` | The bundle context of the Pandino framework, or `null` if not initialized. |
| `isInitialized` | `boolean` | Whether the Pandino framework has been initialized. |

### Example

```tsx
import { usePandinoContext } from '@pandino/react-hooks';
import { BUNDLE_STATES } from '@pandino/pandino';

function FrameworkStatus() {
  const { bundleContext, isInitialized } = usePandinoContext();

  if (!isInitialized) {
    return <div>Framework initializing...</div>;
  }

  if (!bundleContext) {
    return <div>Bundle context not available</div>;
  }

  const bundles = bundleContext.getBundles();

  return (
    <div>
      <h3>Framework Status</h3>
      <div>Active Bundles: {bundles.length}</div>
      <ul>
        {bundles.map(bundle => (
          <li key={bundle.getBundleId()}>
            {bundle.getSymbolicName()} - {
              Object.entries(BUNDLE_STATES)
                .find(([_, value]) => value === bundle.getState())?.[0]
            }
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## useService

The `useService` hook discovers and provides access to a service from the service registry.

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `interface` | `string \| null` | The service interface name to look up, or `null` to disable service lookup. |
| `filter` | `string` | Optional LDAP filter to refine service selection. |

### Return Value

| Property | Type | Description |
|----------|------|-------------|
| `service` | `T \| null` | The discovered service, or `null` if not found or still loading. |
| `loading` | `boolean` | Whether the service is still being loaded. |
| `error` | `Error \| null` | Any error that occurred during service discovery. |

### Examples

#### Basic Service Discovery

```tsx
import { useService } from '@pandino/react-hooks';
import type { UserService } from '../types';

function UserProfile({ userId }: { userId: string }) {
  const { service: userService, loading } = useService<UserService>('UserService');
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (userService && userId) {
      userService.getUser(userId).then(setUser);
    }
  }, [userService, userId]);

  if (loading) {
    return <div>Loading user service...</div>;
  }

  if (!userService) {
    return <div>User service not available</div>;
  }

  if (!user) {
    return <div>Loading user data...</div>;
  }

  return (
    <div>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </div>
  );
}
```

#### Service with LDAP Filter

```tsx
import { useService } from '@pandino/react-hooks';
import type { PaymentGateway } from '../types';

function PaymentProcessor({ method, amount }: { method: string, amount: number }) {
  // Get payment gateway based on the selected method
  const { service: paymentGateway, loading } = useService<PaymentGateway>(
    'PaymentGateway',
    `(gateway.type=${method})`
  );

  const processPayment = () => {
    if (paymentGateway) {
      paymentGateway.processPayment(amount)
        .then(() => alert('Payment successful'))
        .catch(err => alert(`Payment failed: ${err.message}`));
    }
  };

  return (
    <div>
      <h3>Payment Processor</h3>
      <p>Method: {method}</p>
      <p>Amount: ${amount.toFixed(2)}</p>

      <button
        onClick={processPayment}
        disabled={loading || !paymentGateway}
      >
        {loading ? 'Loading...' : 'Pay Now'}
      </button>
    </div>
  );
}
```

#### Conditional Service Loading

```tsx
import { useService } from '@pandino/react-hooks';
import type { AnalyticsService } from '../types';

function FeatureWithAnalytics({ analyticsEnabled }: { analyticsEnabled: boolean }) {
  // Only attempt to load the service if analytics are enabled
  const { service: analyticsService } = useService<AnalyticsService>(
    analyticsEnabled ? 'AnalyticsService' : null
  );

  const trackEvent = (eventName: string) => {
    if (analyticsEnabled && analyticsService) {
      analyticsService.trackEvent(eventName);
    }
  };

  return (
    <div>
      <h3>Feature</h3>
      <button onClick={() => trackEvent('button_clicked')}>
        Click Me
      </button>
    </div>
  );
}
```

## useServiceTracker

The `useServiceTracker` hook provides more advanced service tracking capabilities, allowing you to track multiple services of the same interface.

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `interface` | `string \| null` | The service interface name to track, or `null` to disable tracking. |
| `filter` | `string` | Optional LDAP filter to refine service selection. |

### Return Value

| Property | Type | Description |
|----------|------|-------------|
| `services` | `T[]` | Array of all matching services. |
| `loading` | `boolean` | Whether services are still being loaded. |
| `error` | `Error \| null` | Any error that occurred during service tracking. |

### Example

```tsx
import { useServiceTracker } from '@pandino/react-hooks';
import type { LogAppender } from '../types';

function LoggerConfiguration() {
  const { services: logAppenders, loading } = useServiceTracker<LogAppender>('LogAppender');
  const [selectedAppenders, setSelectedAppenders] = useState<string[]>([]);

  useEffect(() => {
    // Pre-select all active appenders
    if (logAppenders.length > 0) {
      setSelectedAppenders(
        logAppenders
          .filter(appender => appender.isActive())
          .map(appender => appender.getName())
      );
    }
  }, [logAppenders]);

  const toggleAppender = (name: string) => {
    setSelectedAppenders(prev =>
      prev.includes(name)
        ? prev.filter(a => a !== name)
        : [...prev, name]
    );
  };

  if (loading) {
    return <div>Loading log appenders...</div>;
  }

  return (
    <div>
      <h3>Logger Configuration</h3>
      <p>Available Log Appenders: {logAppenders.length}</p>

      <ul>
        {logAppenders.map(appender => (
          <li key={appender.getName()}>
            <label>
              <input
                type="checkbox"
                checked={selectedAppenders.includes(appender.getName())}
                onChange={() => toggleAppender(appender.getName())}
              />
              {appender.getName()} ({appender.getType()})
            </label>
          </li>
        ))}
      </ul>

      <button onClick={() => console.log('Save configuration', selectedAppenders)}>
        Save Configuration
      </button>
    </div>
  );
}
```

## Advanced Patterns

### Service Dependency Gates

You can create components that only render when certain services are available:

```tsx
import { useService } from '@pandino/react-hooks';
import type { AuthService, FeatureService } from '../types';

interface ProtectedFeatureProps {
  featureKey: string;
  children: React.ReactNode;
}

function ProtectedFeature({ featureKey, children }: ProtectedFeatureProps) {
  const { service: authService, loading: authLoading } = useService<AuthService>('AuthService');
  const { service: featureService, loading: featureLoading } = useService<FeatureService>('FeatureService');

  // Show loading state while services are being discovered
  if (authLoading || featureLoading) {
    return <div>Loading services...</div>;
  }

  // Ensure both services are available
  if (!authService || !featureService) {
    return <div>Required services not available</div>;
  }

  // Check if user is authenticated
  if (!authService.isAuthenticated()) {
    return <div>Please log in to access this feature</div>;
  }

  // Check if feature is enabled
  if (!featureService.isEnabled(featureKey)) {
    return <div>This feature is not available in your plan</div>;
  }

  // All checks passed, render the protected content
  return <>{children}</>;
}

// Usage
function App() {
  return (
    <div>
      <h1>My Application</h1>

      <ProtectedFeature featureKey="premium-dashboard">
        <PremiumDashboard />
      </ProtectedFeature>
    </div>
  );
}
```

### Service Result Caching

You can implement caching for service results to improve performance:

```tsx
import { useService } from '@pandino/react-hooks';
import type { DataService, DataItem } from '../types';

function CachedDataComponent() {
  const { service: dataService, loading } = useService<DataService>('DataService');
  const [data, setData] = useState<DataItem[]>([]);
  const [lastFetch, setLastFetch] = useState<number>(0);
  const [isFetching, setIsFetching] = useState<boolean>(false);

  // Cache expiration time (1 minute)
  const CACHE_TTL = 60000;

  const fetchData = useCallback(async (force = false) => {
    if (!dataService) return;

    // Skip if already fetching
    if (isFetching) return;

    // Skip if cache is still valid and not forced
    if (!force && Date.now() - lastFetch < CACHE_TTL) return;

    try {
      setIsFetching(true);
      const result = await dataService.fetchData();
      setData(result);
      setLastFetch(Date.now());
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsFetching(false);
    }
  }, [dataService, lastFetch, isFetching]);

  // Fetch data when service becomes available
  useEffect(() => {
    if (dataService) {
      fetchData();
    }
  }, [dataService, fetchData]);

  if (loading) {
    return <div>Loading data service...</div>;
  }

  if (!dataService) {
    return <div>Data service not available</div>;
  }

  return (
    <div>
      <h3>Data Items ({data.length})</h3>
      <button
        onClick={() => fetchData(true)}
        disabled={isFetching}
      >
        {isFetching ? 'Refreshing...' : 'Refresh Data'}
      </button>

      <ul>
        {data.map(item => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>

      {data.length === 0 && !isFetching && (
        <p>No data available</p>
      )}

      {lastFetch > 0 && (
        <p className="text-muted">
          Last updated: {new Date(lastFetch).toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}
```

### Dynamic Bundle Management

You can create components that manage bundles dynamically:

```tsx
import { usePandinoContext } from '@pandino/react-hooks';
import { BUNDLE_STATES } from '@pandino/pandino';
import type { Bundle } from '@pandino/pandino';

function BundleManager() {
  const { bundleContext, isInitialized } = usePandinoContext();
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // Refresh bundle list when context changes or refresh is triggered
  useEffect(() => {
    if (bundleContext && isInitialized) {
      setBundles(bundleContext.getBundles());
    }
  }, [bundleContext, isInitialized, refreshTrigger]);

  // Listen for bundle changes
  useEffect(() => {
    if (!bundleContext) return;

    const bundleListener = {
      bundleChanged: () => {
        // Trigger refresh when bundles change
        setRefreshTrigger(prev => prev + 1);
      }
    };

    bundleContext.addBundleListener(bundleListener);
    return () => bundleContext.removeBundleListener(bundleListener);
  }, [bundleContext]);

  const startBundle = async (bundleId: number) => {
    try {
      const bundle = bundles.find(b => b.getBundleId() === bundleId);
      if (bundle) {
        await bundle.start();
        setRefreshTrigger(prev => prev + 1);
      }
    } catch (error) {
      console.error(`Failed to start bundle ${bundleId}:`, error);
    }
  };

  const stopBundle = async (bundleId: number) => {
    try {
      const bundle = bundles.find(b => b.getBundleId() === bundleId);
      if (bundle) {
        await bundle.stop();
        setRefreshTrigger(prev => prev + 1);
      }
    } catch (error) {
      console.error(`Failed to stop bundle ${bundleId}:`, error);
    }
  };

  if (!isInitialized || !bundleContext) {
    return <div>Framework not initialized</div>;
  }

  return (
    <div>
      <h3>Bundle Management</h3>
      <button onClick={() => setRefreshTrigger(prev => prev + 1)}>
        Refresh
      </button>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Version</th>
            <th>State</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {bundles.map(bundle => {
            const bundleId = bundle.getBundleId();
            const state = bundle.getState();
            const stateName = Object.entries(BUNDLE_STATES)
              .find(([_, value]) => value === state)?.[0] || 'UNKNOWN';

            return (
              <tr key={bundleId}>
                <td>{bundleId}</td>
                <td>{bundle.getSymbolicName()}</td>
                <td>{bundle.getVersion()}</td>
                <td>{stateName}</td>
                <td>
                  <button
                    onClick={() => startBundle(bundleId)}
                    disabled={state === BUNDLE_STATES.ACTIVE}
                  >
                    Start
                  </button>
                  <button
                    onClick={() => stopBundle(bundleId)}
                    disabled={state !== BUNDLE_STATES.ACTIVE}
                  >
                    Stop
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
```

## Conclusion

The React hooks provided by Pandino enable seamless integration between React components and the Pandino service registry. By using these hooks, you can build modular React applications where components can dynamically discover and use services without direct dependencies.

For more information about how to use these hooks in your application, see the [React Integration](/docs/packages/react-hooks) documentation.
