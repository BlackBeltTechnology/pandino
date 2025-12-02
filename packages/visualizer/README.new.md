# @pandino/visualizer (React Edition)

A **React-based real-time visualizer** for Pandino framework featuring interactive dependency graphs powered by **React Flow**.

![Version](https://img.shields.io/badge/version-0.2.0-blue)
![React](https://img.shields.io/badge/React-18.3-61dafb?logo=react)
![React Flow](https://img.shields.io/badge/React_Flow-12.3-FF4)

## ✨ Features

### 🎨 Interactive Graph Visualization
- **React Flow** powered dependency graph
- Drag-and-drop node positioning
- Zoom and pan controls
- Mini-map for navigation
- Animated connections for active bundles

### 📊 Real-time Monitoring
- Live bundle state changes
- Service registration/unregistration tracking
- Event timeline
- Statistics dashboard

### 🎯 Rich Node Display
- **Bundle Nodes**: ID, version, state, services
- **Service Nodes**: ID, ranking, interfaces, properties
- Color-coded states (Active, Resolved, Installed)
- Expandable service properties

### 📋 Dual View Modes
- **Graph View**: Interactive dependency visualization
- **List View**: Detailed bundle and event information

## 📦 Installation

```bash
npm install @pandino/visualizer
# or
pnpm add @pandino/visualizer
```

## 🚀 Usage

### Basic React Integration

```tsx
import { PandinoVisualizer, PandinoVisualizerProvider } from '@pandino/visualizer';
import { usePandinoContext } from '@pandino/react-hooks';

function App() {
  const { framework, isInitialized } = usePandinoContext();

  if (!isInitialized || !framework) {
    return <div>Loading...</div>;
  }

  return (
    <PandinoVisualizerProvider>
      <PandinoVisualizer
        framework={framework}
        defaultOpen={true}
        position="fullscreen"
      />
      {/* Your app content */}
    </PandinoVisualizerProvider>
  );
}
```

### With Pandino Provider

```tsx
import { OSGiBootstrap } from '@pandino/pandino';
import { PandinoProvider } from '@pandino/react-hooks';
import { PandinoVisualizer, PandinoVisualizerProvider } from '@pandino/visualizer';
import { useEffect, useState } from 'react';

function Root() {
  const [framework, setFramework] = useState(null);

  useEffect(() => {
    async function init() {
      const bootstrap = new OSGiBootstrap();
      const fw = await bootstrap.start();
      setFramework(fw);
    }
    init();
  }, []);

  if (!framework) return <div>Loading...</div>;

  return (
    <PandinoProvider framework={framework}>
      <PandinoVisualizerProvider>
        <PandinoVisualizer
          framework={framework}
          defaultOpen={false}
          position="top-right"
        />
        <YourApp />
      </PandinoVisualizerProvider>
    </PandinoProvider>
  );
}
```

## 📖 API

### `<PandinoVisualizer>`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `framework` | `OSGiFramework` | required | Pandino framework instance |
| `defaultOpen` | `boolean` | `false` | Open visualizer on mount |
| `position` | `'fullscreen' \| 'top-right' \| 'top-left' \| 'bottom-right' \| 'bottom-left'` | `'fullscreen'` | Visualizer position |

### `<PandinoVisualizerProvider>`

Wraps your app with React Flow context. Required for the visualizer to work.

```tsx
<PandinoVisualizerProvider>
  <YourApp />
</PandinoVisualizerProvider>
```

## ⌨️ Keyboard Shortcuts

- `Ctrl+Shift+V` - Toggle visualizer visibility

## 🎨 Graph Features

### Node Types

#### Bundle Node
- 📦 Icon and symbolic name
- Bundle ID and version
- State badge (Active, Resolved, Installed, etc.)
- Color-coded by state:
  - 🟢 Green: ACTIVE
  - 🔵 Blue: RESOLVED
  - 🟠 Orange: INSTALLED

#### Service Node
- ⚙️ Icon and service interface name
- Service ID and ranking
- Multiple interfaces display
- Expandable properties panel
- Click to expand/collapse details

### Graph Controls

- **Zoom**: Mouse wheel or controls
- **Pan**: Click and drag background
- **Move Nodes**: Drag individual nodes
- **Fit View**: Reset zoom and center
- **Mini-map**: Overview and quick navigation

## 🎭 Demo

Run the interactive demo:

```bash
cd packages/visualizer
pnpm demo
```

Open `http://localhost:8080` to see:
- Real Pandino framework initialization
- Interactive bundle installation
- Dynamic service registration
- Live graph updates
- Event tracking

## 🛠️ Built With

- **React 18.3** - UI framework
- **React Flow 12.3** - Graph visualization
- **@pandino/pandino** - OSGi framework
- **TypeScript** - Type safety
- **Vite** - Build tool

## 📊 What You Can Visualize

### Bundles
- Bundle ID and symbolic name
- Version information
- Current state (INSTALLED, RESOLVED, ACTIVE, etc.)
- Registered services count
- Bundle headers and metadata

### Services
- Service interfaces (objectClass)
- Service ID and ranking
- All service properties
- Owning bundle
- Multiple interface implementations

### Dependencies
- Bundle ➜ Service relationships
- Visual connection lines
- Animated edges for active bundles
- Clear hierarchy and structure

### Events
- Service registration/unregistration
- Service property modifications
- Bundle state changes
- Timestamps and details

## 🎯 Use Cases

### Development & Debugging
- Visualize service dependencies
- Debug bundle lifecycle issues
- Monitor service registration
- Track real-time framework events

### Architecture Understanding
- See the big picture of your modular app
- Understand service relationships
- Identify tightly coupled components
- Plan refactoring strategies

### Demonstrations & Documentation
- Show framework capabilities live
- Explain OSGi concepts visually
- Create interactive tutorials
- Document system architecture

## 💡 Tips

1. **Fullscreen Mode**: Best for complex applications with many bundles
2. **Panel Mode**: Use `top-right` or `bottom-right` for development alongside your app
3. **Graph Navigation**: Use mini-map for quick navigation in large graphs
4. **Node Expansion**: Click service nodes to see all properties
5. **Keyboard Toggle**: Press `Ctrl+Shift+V` for quick access

## 🔄 Migration from v0.1

The visualizer has been completely rewritten in React with React Flow for better performance and interactivity.

**Before (vanilla JS):**
```html
<script src="pandino-visualizer.js"></script>
<script>
  window.PandinoVisualizer.init(framework);
</script>
```

**After (React):**
```tsx
import { PandinoVisualizer, PandinoVisualizerProvider } from '@pandino/visualizer';

<PandinoVisualizerProvider>
  <PandinoVisualizer framework={framework} />
</PandinoVisualizerProvider>
```

## 🤝 Contributing

Contributions welcome! See [CONTRIBUTING.md](../../CONTRIBUTING.md).

## 📄 License

EPL-2.0 - See [LICENSE](LICENSE)

## 🔗 Related Packages

- [@pandino/pandino](../pandino) - Core OSGi framework
- [@pandino/react-hooks](../react-hooks) - React integration hooks
- [@pandino/decorators](../decorators) - Service decorators

---

**Built with ❤️ for the Pandino community**

Press `Ctrl+Shift+V` to get started! 🚀

