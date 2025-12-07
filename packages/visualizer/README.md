# @pandino/visualizer

A zero-dependency browser visualization tool for Pandino framework that provides real-time insights into services, bundles, configurations, and events.

![Pandino Visualizer](https://img.shields.io/badge/Pandino-Visualizer-0078d4)

## ✨ Features

- **Real-time Monitoring**: Watch services and bundles change in real-time
- **Zero Dependencies**: Pure TypeScript/JavaScript with no external dependencies
- **Beautiful UI**: Modern, dark-themed interface with smooth animations
- **Service Discovery**: View all registered services with their properties and rankings
- **Bundle Management**: Monitor bundle states, versions, and headers
- **Keyboard Shortcut**: Toggle with `Ctrl+Shift+V`
- **Draggable**: Move the visualizer anywhere on your screen

## 📦 Installation

```bash
npm install @pandino/visualizer
```

## 🚀 Usage

### Method 1: Module Import (Recommended)

```typescript
import { OSGiBootstrap } from '@pandino/pandino';

// Initialize your Pandino framework
const bootstrap = new OSGiBootstrap();
const framework = await bootstrap.start();

// Import and initialize the visualizer
const { PandinoVisualizer } = await import('@pandino/visualizer');
PandinoVisualizer.init(framework);
PandinoVisualizer.show();
```

### Method 2: Script Tag

Add the built script to your HTML:

```html
<!DOCTYPE html>
<html>
<head>
  <title>My Pandino App</title>
</head>
<body>
  <div id="app"></div>

  <!-- Your app bundle -->
  <script src="your-app.js"></script>

  <!-- Pandino Visualizer -->
  <script src="node_modules/@pandino/visualizer/dist/pandino-visualizer.js"></script>

  <script>
    // Initialize after your framework is ready
    window.PandinoVisualizer.init(yourFrameworkInstance);
  </script>
</body>
</html>
```

### Method 3: Auto-Initialize

The visualizer can auto-initialize if you expose your framework on the window:

```typescript
const framework = await bootstrap.start();
window.pandinoFramework = framework; // Expose framework

// Visualizer will auto-detect and initialize
```

## 📖 API

### PandinoVisualizerProvider

Context provider component that manages visualizer state.

```typescript jsx
import { PandinoVisualizerProvider } from '@pandino/visualizer';

<PandinoVisualizerProvider>
  {/* Your app components */}
</PandinoVisualizerProvider>
```

### PandinoVisualizer

Main visualizer component.

**Props:**
- `framework: OSGiFramework` - The Pandino framework instance (required)
- `defaultOpen?: boolean` - Whether to show visualizer by default (default: `false`)
- `position?: string` - Position of the visualizer panel:
  - `'fullscreen'` (default) - Full screen overlay
  - `'top-right'` - Docked to top-right corner
  - `'top-left'` - Docked to top-left corner
  - `'bottom-right'` - Docked to bottom-right corner
  - `'bottom-left'` - Docked to bottom-left corner
- `children?: ReactNode` - Custom content to add to the statistics panel

```typescript jsx
<PandinoVisualizer
  framework={framework}
  defaultOpen={true}
  position="fullscreen"
/>
```

## ⌨️ Keyboard Shortcuts

- `Ctrl+Shift+V` - Toggle visualizer

## 🎯 Use Cases

### Development & Debugging
- Monitor service lifecycle during development
- Debug service registration issues and missing dependencies
- Verify DS component references and cardinalities
- Track real-time framework events
- Visualize component dependency graphs

### Production Monitoring
- Health check dashboard for microservices
- Service availability monitoring
- Component lifecycle tracking
- Performance insights and bottleneck detection

### Learning & Documentation
- Understand OSGi Declarative Services visually
- Explore service registry patterns
- Study component interactions and dependencies
- Demonstrate framework capabilities to teams

## 🎭 Running the Demo

```bash
# Install dependencies
pnpm install

# Run the visualizer demo
cd packages/visualizer
pnpm run dev
```

## 🛠️ Building from Source

```bash
# Install dependencies
pnpm install

# Build the visualizer
pnpm --filter @pandino/visualizer build

# Output: packages/visualizer/dist/pandino-visualizer.js
```

## 📝 Example Integration

Here's a complete example with React and Pandino:

```typescript
import { OSGiBootstrap } from '@pandino/pandino';
import { PandinoProvider } from '@pandino/react-hooks';
import { useEffect } from 'react';

function App() {
  const [framework, setFramework] = useState(null);

  useEffect(() => {
    async function initFramework() {
      const bootstrap = new OSGiBootstrap();
      const fw = await bootstrap.start();
      setFramework(fw);

      // Initialize visualizer in development
      if (import.meta.env.DEV) {
        const { PandinoVisualizer } = await import('@pandino/visualizer');
        PandinoVisualizer.init(fw);
        // Show on load, or let users toggle with Ctrl+Shift+V
      }
    }

    initFramework();
  }, []);

  if (!framework) return <div>Loading...</div>;

  return (
    <PandinoProvider framework={framework}>
      {/* Your app content */}
    </PandinoProvider>
  );
}
```

## 🎨 Customization

The visualizer uses inline styles and doesn't require any external CSS. The UI is designed to be non-intrusive and can be easily moved around the screen.

## 🎭 Demo

Try the interactive demo with real Pandino framework:

```bash
# Build the visualizer
pnpm --filter @pandino/visualizer build

# Run the demo server
cd packages/visualizer
pnpm demo
```

The demo will open automatically at `http://localhost:8080/demo.html`

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](../../CONTRIBUTING.md) for details.

## 📄 License

EPL-2.0 - See [LICENSE](LICENSE) for details.

## 🔗 Related Packages

- [@pandino/pandino](../pandino) - Core OSGi-style framework
- [@pandino/react-hooks](../react-hooks) - React integration
- [@pandino/decorators](../decorators) - TypeScript decorators for services

---

Made with ❤️ for the Pandino community

