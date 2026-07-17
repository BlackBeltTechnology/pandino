---
title: Plugin System Example
description: Building a dynamic plugin system with Pandino where bundles provide pluggable features.
---

# Plugin System

This example demonstrates how to build a dynamic plugin system where functionality is contributed by independent bundles. Each plugin registers services that the host application discovers and uses automatically.

## Architecture

```
+------------------+     +------------------+     +------------------+
| Plugin A         |     | Plugin B         |     | Plugin C         |
| (search bundle)  |     | (analytics)      |     | (export bundle)  |
+--------+---------+     +--------+---------+     +--------+---------+
         |                        |                        |
         v                        v                        v
+-------------------------------------------------------------------+
|                    Service Registry                                |
|    Discovers all services matching 'AppPlugin' interface           |
+-------------------------------------------------------------------+
         ^
         |
+--------+---------+
| Host Application |
| (renders plugins)|
+------------------+
```

## 1. Define the plugin contract

Define an interface that all plugins must implement:

```typescript
// src/plugin-api.ts
export interface AppPlugin {
  id: string;
  label: string;
  description: string;
  execute(context: Record<string, any>): void;
}
```

## 2. Create plugin bundles

Each plugin is a separate bundle with its own `@Component`:

```typescript
// src/bundles/search-plugin/search.ts
import { Component, Service, Activate } from '@pandino/decorators';
import type { AppPlugin } from '../../plugin-api';

@Component({ name: 'search.plugin', immediate: true })
@Service({ interfaces: ['AppPlugin'] })
export class SearchPlugin implements AppPlugin {
  id = 'search';
  label = 'Search';
  description = 'Full-text search across all content';

  @Activate
  activate(): void {
    console.log('Search plugin loaded');
  }

  execute(context: Record<string, any>): void {
    console.log('Searching for:', context.query);
  }
}
```

```typescript
// src/bundles/export-plugin/export.ts
import { Component, Service, Property } from '@pandino/decorators';
import type { AppPlugin } from '../../plugin-api';

@Component({ name: 'export.plugin', immediate: true })
@Service({ interfaces: ['AppPlugin'] })
@Property('plugin.category', 'data')
export class ExportPlugin implements AppPlugin {
  id = 'export';
  label = 'Export';
  description = 'Export data to CSV, JSON, or PDF';

  execute(context: Record<string, any>): void {
    console.log('Exporting as:', context.format);
  }
}
```

## 3. Configure Vite to produce bundles

```typescript
// vite.config.ts
import pandinoBundle from '@pandino/rollup-bundle-plugin';

export default defineConfig({
  plugins: [
    react(),
    pandinoBundle({
      virtualId: 'pandino:bundle:search',
      include: ['src/bundles/search-plugin/**/*.ts'],
      headers: { bundleSymbolicName: 'app.search', bundleVersion: '1.0.0' },
    }),
    pandinoBundle({
      virtualId: 'pandino:bundle:export',
      include: ['src/bundles/export-plugin/**/*.ts'],
      headers: { bundleSymbolicName: 'app.export', bundleVersion: '1.0.0' },
    }),
  ],
});
```

## 4. Install plugin bundles

```tsx
// src/main.tsx
import 'reflect-metadata';
import { PandinoProvider } from '@pandino/react-hooks';

createRoot(document.getElementById('root')!).render(
  <PandinoProvider
    bundles={[
      import('pandino:bundle:search'),
      import('pandino:bundle:export'),
      // Add more plugins here -- each is an independent bundle
    ]}
  >
    <App />
  </PandinoProvider>,
);
```

## 5. Discover and render all plugins

The host application uses `useServiceTracker` to find all registered plugins:

```tsx
// src/PluginPanel.tsx
import { useServiceTracker } from '@pandino/react-hooks';
import type { AppPlugin } from './plugin-api';

export function PluginPanel() {
  const { services: plugins, loading } = useServiceTracker<AppPlugin>('AppPlugin');

  if (loading) return <p>Discovering plugins...</p>;

  return (
    <div>
      <h2>Available Plugins ({plugins.length})</h2>
      <ul>
        {plugins.map((plugin) => (
          <li key={plugin.id}>
            <strong>{plugin.label}</strong> -- {plugin.description}
            <button onClick={() => plugin.execute({ query: 'test' })}>Run</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

When a new plugin bundle is installed, it automatically appears in the list. When a bundle is stopped, its plugin disappears.

## 6. Filter plugins by properties

Use LDAP filters to show subsets of plugins:

```tsx
// Only show data-category plugins
const { services: dataPlugins } = useServiceTracker<AppPlugin>('AppPlugin', '(plugin.category=data)');
```

## 7. Plugin communication via events

Plugins can communicate without knowing about each other using EventAdmin:

```typescript
// In the search plugin -- publish results
@Reference({ interface: 'EventAdmin' })
private eventAdmin?: EventAdmin;

execute(context: Record<string, any>): void {
  const results = this.search(context.query);
  this.eventAdmin?.postEvent(new Event('search/results', { results }));
}
```

```typescript
// In a results display plugin -- subscribe
@Component({ name: 'search.results.handler' })
@Service({ interfaces: ['EventHandler'] })
@Property('event.topics', 'search/results')
export class SearchResultsHandler implements EventHandler {
  handleEvent(event: Event): void {
    const results = event.getProperty('results');
    // Display results...
  }
}
```

## Key takeaways

- **No plugin registry needed**: The service registry IS the plugin registry. Use the [Whiteboard Pattern](/patterns/whiteboard-pattern).
- **Dynamic loading**: Plugins can be added or removed at runtime without restarting the application.
- **Loose coupling**: The host app and plugins communicate through interfaces, not direct imports.
- **Filtered discovery**: LDAP filters let you select plugins by any metadata property.
- **Event-based communication**: Plugins communicate indirectly through EventAdmin topics.

## Next steps

- [Whiteboard Pattern](/patterns/whiteboard-pattern) -- the pattern underlying plugin discovery
- [Events concept](/concepts/events) -- EventAdmin for inter-plugin communication
- [Fragment Pattern](/patterns/fragment-pattern) -- extend bundles without modifying them
