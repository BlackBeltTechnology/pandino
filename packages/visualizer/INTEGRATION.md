# Pandino Visualizer Integration Guide

This guide shows how to integrate the Pandino Visualizer into your existing Pandino application.

## Installation

The visualizer has been added as a new package in the Pandino monorepo:

```bash
pnpm --filter @pandino/visualizer build
```

## Built Asset

After building, you'll find the distributable file at:
```
packages/visualizer/dist/pandino-visualizer.js
```

This is a **23KB** (5.4KB gzipped) standalone JavaScript file with **zero dependencies**.

## Integration Methods

### Method 1: Direct Script Tag (Simplest)

Add the script to your HTML file:

```html
<!DOCTYPE html>
<html>
<head>
  <title>My Pandino App</title>
</head>
<body>
  <div id="root"></div>

  <!-- Your app bundle -->
  <script src="your-app-bundle.js"></script>

  <!-- Pandino Visualizer -->
  <script src="pandino-visualizer.js"></script>

  <script>
    // Assuming your app exposes the framework instance
    // The visualizer will auto-initialize if window.pandinoFramework exists
    // Or manually initialize:
    window.PandinoVisualizer.init(yourFrameworkInstance);
  </script>
</body>
</html>
```

### Method 2: Import in TypeScript/Module

```typescript
import { OSGiBootstrap } from '@pandino/pandino';

async function initApp() {
  const bootstrap = new OSGiBootstrap();
  const framework = await bootstrap.start();

  // In development, load visualizer dynamically
  if (import.meta.env.DEV) {
    const visualizer = await import('@pandino/visualizer');
    // The script self-executes and registers window.PandinoVisualizer
    // Just need to initialize it
    (window as any).PandinoVisualizer?.init(framework);
  }

  return framework;
}
```

### Method 3: Auto-Initialize Pattern

Expose your framework on the window object and the visualizer will auto-detect it:

```typescript
const framework = await bootstrap.start();

// Expose for visualizer (development only)
if (import.meta.env.DEV) {
  (window as any).pandinoFramework = framework;
}
```

Then just include the script tag and it will automatically initialize.

## Integration with React Example App

To add the visualizer to the existing `packages/example` app:

### Step 1: Add visualizer as a dependency

First, ensure the visualizer is available in your project:

```bash
# If in a monorepo, add to package.json dependencies
# packages/example/package.json
{
  "dependencies": {
    "@pandino/visualizer": "workspace:*"
  }
}
```

Then install:
```bash
pnpm install
```

### Step 2: Create a visualizer initialization component

Create a new component that imports and initializes the visualizer once the framework is ready:

```typescript
// src/components/VisualizerInit.tsx
import { useEffect } from 'react';
import { usePandinoContext } from '@pandino/react-hooks';
// Import the visualizer directly (will be bundled)
import '@pandino/visualizer/dist/pandino-visualizer.js';

export const VisualizerInit = () => {
  const { framework, isInitialized } = usePandinoContext();

  useEffect(() => {
    if (!isInitialized || !framework) return;

    // Initialize visualizer with framework
    if ((window as any).PandinoVisualizer) {
      (window as any).PandinoVisualizer.init(framework);
      console.log('Pandino Visualizer ready. Press Ctrl+Shift+V to toggle.');
    }
  }, [framework, isInitialized]);

  return null;
};
```

### Step 3: Update main.tsx or App.tsx

Add the `VisualizerInit` component inside the `PandinoProvider`:

```typescript
import { type FC, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { PandinoProvider } from '@pandino/react-hooks';
import App from './App.tsx';
import { VisualizerInit } from './components/VisualizerInit';

const Root: FC = () => {
  return (
    <PandinoProvider bundles={[import('pandino:bundle:alpha'), import('pandino:bundle:beta')]}>
      <VisualizerInit />
      <App />
    </PandinoProvider>
  );
};

const rootElement = document.getElementById('root')!;

createRoot(rootElement).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
```


### Step 4: Run the example

```bash
pnpm dev:example
```

Then press `Ctrl+Shift+V` to toggle the visualizer!

## API Reference

### `PandinoVisualizer.init(framework)`
Initialize with a framework instance.

```javascript
window.PandinoVisualizer.init(framework);
```

### `PandinoVisualizer.show()`
Show the visualizer panel.

```javascript
window.PandinoVisualizer.show();
```

### `PandinoVisualizer.hide()`
Hide the visualizer panel.

```javascript
window.PandinoVisualizer.hide();
```

### `PandinoVisualizer.toggle()`
Toggle panel visibility.

```javascript
window.PandinoVisualizer.toggle();
// Or press Ctrl+Shift+V
```

### `PandinoVisualizer.clearEvents()`
Clear the event log.

```javascript
window.PandinoVisualizer.clearEvents();
```

## Features

### Overview Tab
- 📊 Statistics: Total bundles, active bundles, total services
- 📈 Bundle state distribution
- ⏱️ Recent events timeline

### Services Tab
- 🔍 Search and filter services
- 🏷️ Service ID and ranking
- 📝 All service properties
- 🔗 Implemented interfaces
- 📦 Owning bundle information

### Bundles Tab
- 🔍 Search and filter bundles
- 🏷️ Bundle ID, symbolic name, version
- 🚦 Current state (ACTIVE, RESOLVED, etc.)
- 📋 Bundle headers and metadata
- 🔧 Registered services count

### Events Tab
- 📡 Real-time service events (REGISTERED, UNREGISTERING, etc.)
- 🔄 Bundle lifecycle events (INSTALLED, ACTIVE, STOPPED, etc.)
- ⏰ Event timestamps
- 🧹 Clear events functionality

## Keyboard Shortcuts

- `Ctrl+Shift+V` - Toggle visualizer

## Tips

1. **Development Mode**: Use only in development for debugging
2. **Production**: Remove the visualizer from production builds
3. **Performance**: The visualizer auto-refreshes every 2 seconds when visible
4. **Draggable**: Click and drag the header to reposition
5. **Expandable**: Click the ▼ button on items to see more details

## Demo

A standalone demo is available that uses the real Pandino framework from CDN:

```bash
# Build the visualizer first
pnpm build:visualizer

# Run the demo server (opens browser automatically)
cd packages/visualizer
pnpm demo

# Or just start the server without opening
pnpm start
```

The demo will be available at `http://localhost:8080/demo.html`

### What the Demo Includes

- **Real Pandino Framework**: Loaded from CDN (esm.sh)
- **Interactive Controls**: Install bundles, register/unregister services
- **Live Visualization**: See changes in real-time
- **Bundle Lifecycle**: Start and stop bundles
- **Service Management**: Create and remove services
- **Event Tracking**: Monitor all framework events

## File Size

- **Uncompressed**: 23.28 KB
- **Gzipped**: 5.37 KB
- **Zero dependencies**: Pure vanilla JavaScript/TypeScript

## Browser Compatibility

Works in all modern browsers that support:
- ES6+ JavaScript
- CSS Grid
- CSS Flexbox
- ES6 Modules (when imported)

Tested on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Troubleshooting

**Visualizer doesn't appear:**
1. Check that you've called `PandinoVisualizer.init(framework)`
2. Open browser console and look for errors
3. Verify the framework is properly initialized
4. Try manually calling `PandinoVisualizer.show()`

**Events not updating:**
1. Ensure the visualizer is visible (auto-refresh only when visible)
2. Check that your framework emits events (built-in in Pandino)
3. Try toggling visibility with Ctrl+Shift+V

**Can't find services/bundles:**
1. Use the search box in the respective tabs
2. Check if bundles are in ACTIVE state
3. Verify service registration in bundle activators

## Next Steps

1. Build the visualizer: `pnpm --filter @pandino/visualizer build`
2. Copy to your project's public folder
3. Add the script tag to your HTML
4. Initialize with your framework
5. Press Ctrl+Shift+V to toggle!

Enjoy debugging with the Pandino Visualizer! 🎉

