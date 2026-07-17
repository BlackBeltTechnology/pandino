---
title: React Application Example
description: Building a complete React application with Pandino for dynamic service discovery and modular architecture.
---

# React Application

This example builds a complete React application powered by Pandino. It demonstrates bootstrapping the framework, creating service bundles, and consuming services in React components.

## Project setup

```bash
npm create vite@latest my-pandino-app -- --template react-ts
cd my-pandino-app
npm install @pandino/pandino @pandino/react-hooks @pandino/decorators reflect-metadata
npm install -D @pandino/rollup-bundle-plugin
```

Update `tsconfig.json`:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

## 1. Create a service bundle

Define a greeting service in its own directory:

```typescript
// src/bundles/greeting/greeting-service.ts
import { Component, Service, Activate } from '@pandino/decorators';
import type { ComponentContext } from '@pandino/pandino';

export interface GreetingService {
  greet(name: string): string;
  getGreetings(): string[];
}

@Component({ name: 'greeting.service', immediate: true })
@Service({ interfaces: ['GreetingService'] })
export class GreetingServiceImpl implements GreetingService {
  private greetings: string[] = [];

  @Activate
  activate(context: ComponentContext): void {
    console.log('GreetingService activated');
  }

  greet(name: string): string {
    const message = `Hello, ${name}! (${new Date().toLocaleTimeString()})`;
    this.greetings.push(message);
    return message;
  }

  getGreetings(): string[] {
    return [...this.greetings];
  }
}
```

## 2. Configure the build plugin

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import pandinoBundle from '@pandino/rollup-bundle-plugin';

export default defineConfig({
  plugins: [
    react(),
    pandinoBundle({
      virtualId: 'pandino:bundle:greeting',
      include: ['src/bundles/greeting/**/*.ts'],
      headers: {
        bundleSymbolicName: 'app.greeting',
        bundleVersion: '1.0.0',
        bundleName: 'Greeting Bundle',
      },
    }),
  ],
});
```

## 3. Wire up the provider

```tsx
// src/main.tsx
import 'reflect-metadata';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { PandinoProvider } from '@pandino/react-hooks';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PandinoProvider bundles={[import('pandino:bundle:greeting')]}>
      <App />
    </PandinoProvider>
  </StrictMode>,
);
```

## 4. Consume the service with hooks

```tsx
// src/App.tsx
import { useState } from 'react';
import { useService } from '@pandino/react-hooks';
import type { GreetingService } from './bundles/greeting/greeting-service';

export default function App() {
  const { service, loading, error } = useService<GreetingService>('GreetingService');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');

  if (loading) return <p>Starting Pandino...</p>;
  if (error) return <p>Error: {error.message}</p>;
  if (!service) return <p>Waiting for GreetingService...</p>;

  const handleGreet = () => {
    setMessage(service.greet(name || 'World'));
  };

  return (
    <div>
      <h1>Pandino + React</h1>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your name" />
      <button onClick={handleGreet}>Greet</button>
      {message && <p>{message}</p>}

      <h2>History</h2>
      <ul>
        {service.getGreetings().map((g, i) => (
          <li key={i}>{g}</li>
        ))}
      </ul>
    </div>
  );
}
```

## 5. Track multiple services

Use `useServiceTracker` to display all services matching an interface:

```tsx
import { useServiceTracker } from '@pandino/react-hooks';

function ServiceList() {
  const { services: greeters } = useServiceTracker<GreetingService>('GreetingService');

  return (
    <div>
      <h2>Available Greeters: {greeters.length}</h2>
      {greeters.map((g, i) => (
        <p key={i}>{g.greet('Demo')}</p>
      ))}
    </div>
  );
}
```

## 6. Register a service from a component

React components can contribute services to the registry:

```tsx
import { useRegisterService } from '@pandino/react-hooks';

function AnalyticsProvider() {
  useRegisterService('AnalyticsService', {
    track(event: string, data: Record<string, any>) {
      console.log('[Analytics]', event, data);
    },
  });

  return null; // This component just provides a service
}
```

The service is automatically unregistered when the component unmounts.

## 7. Use the render-prop alternative

For class components or when you prefer composition:

```tsx
import { ServiceConsumer } from '@pandino/react-hooks';

function GreetingDisplay() {
  return (
    <ServiceConsumer<GreetingService> serviceClass="GreetingService">
      {({ service, loading }) => (loading ? <p>Loading...</p> : <p>{service?.greet('React')}</p>)}
    </ServiceConsumer>
  );
}
```

## 8. Dynamic component rendering

Use `ComponentProxy` to render a service that is itself a React component:

```tsx
import { ComponentProxy } from '@pandino/react-hooks';

function Dashboard() {
  return (
    <div>
      <ComponentProxy serviceClass="DashboardWidget" filter="(slot=header)">
        <p>No header widget available</p>
      </ComponentProxy>
    </div>
  );
}
```

## Next steps

- [Plugin System example](/examples/plugin-system) -- build a full plugin architecture
- [React Hooks guide](/guide/react-hooks) -- all hooks and components
- [Rollup Plugin guide](/guide/rollup-plugin) -- auto-discover components at build time
