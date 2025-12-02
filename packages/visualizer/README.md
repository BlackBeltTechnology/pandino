# @pandino/visualizer

A zero-dependency browser visualization tool for Pandino framework that provides real-time insights into services, bundles, configurations, and events.

![Pandino Visualizer](https://img.shields.io/badge/Pandino-Visualizer-0078d4)

## ✨ Features

- **Real-time Monitoring**: Watch services and bundles change in real-time
- **Zero Dependencies**: Pure TypeScript/JavaScript with no external dependencies
- **Beautiful UI**: Modern, dark-themed interface with smooth animations
- **Service Discovery**: View all registered services with their properties and rankings
- **Bundle Management**: Monitor bundle states, versions, and headers
- **Event Tracking**: Record and display framework events (service/bundle changes)
- **Search & Filter**: Quickly find services and bundles
- **Keyboard Shortcut**: Toggle with `Ctrl+Shift+V`
- **Draggable**: Move the visualizer anywhere on your screen
- **Statistics Dashboard**: Overview of framework health at a glance

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

### PandinoVisualizer.init(framework)

Initialize the visualizer with a Pandino framework instance.

```typescript
PandinoVisualizer.init(framework);
```

### PandinoVisualizer.show()

Show the visualizer panel.

```typescript
PandinoVisualizer.show();
```

### PandinoVisualizer.hide()

Hide the visualizer panel.

```typescript
PandinoVisualizer.hide();
```

### PandinoVisualizer.toggle()

Toggle the visualizer panel visibility.

```typescript
PandinoVisualizer.toggle();
// or press Ctrl+Shift+V
```

### PandinoVisualizer.clearEvents()

Clear the event log.

```typescript
PandinoVisualizer.clearEvents();
```

## 🎨 Features Breakdown

### Overview Tab
- Total bundles count
- Active bundles count
- Total services count
- Bundle state distribution
- Recent events timeline

### Services Tab
- List all registered services
- Service ID and ranking
- Implemented interfaces
- Service properties
- Owning bundle information
- Search/filter functionality

### Bundles Tab
- List all installed bundles
- Bundle ID, symbolic name, and version
- Current state (ACTIVE, RESOLVED, etc.)
- Bundle headers and metadata
- Registered services count
- Search/filter functionality

### Events Tab
- Real-time service registration/unregistration events
- Bundle lifecycle events (start, stop, etc.)
- Event timestamps
- Searchable event log
- Clear events functionality

## ⌨️ Keyboard Shortcuts

- `Ctrl+Shift+V` - Toggle visualizer

## 🎯 Use Cases

### Development & Debugging
- Monitor service lifecycle during development
- Debug service registration issues
- Verify bundle states and dependencies
- Track real-time framework events

### Production Monitoring
- Health check dashboard
- Service availability monitoring
- Bundle lifecycle tracking
- Performance insights

### Learning & Documentation
- Understand OSGi concepts visually
- Explore service registry patterns
- Study bundle interactions
- Demonstrate framework capabilities

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

The demo includes:
- **Real Pandino Framework** loaded from CDN
- **Interactive Controls** to install bundles and register services
- **Live Visualization** of all framework activity
- **Bundle Lifecycle** management
- **Service Registration/Unregistration**
- **Real-time Event Tracking**

The demo will open automatically at `http://localhost:8080/demo.html`

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](../../CONTRIBUTING.md) for details.

## 📄 License

EPL-2.0 - See [LICENSE](LICENSE) for details.

## 🔗 Related Packages

- [@pandino/pandino](../pandino) - Core OSGi-style framework
- [@pandino/react-hooks](../react-hooks) - React integration
- [@pandino/decorators](../decorators) - TypeScript decorators for services

## 💡 Tips

- Use in development mode for debugging
- Press `Ctrl+Shift+V` for quick access
- Drag the panel to position it conveniently
- Use search to quickly find services/bundles
- Monitor the Events tab during bundle installation
- Check service rankings to understand resolution order

## 🐛 Troubleshooting

**Visualizer doesn't appear:**
- Ensure you've called `PandinoVisualizer.init(framework)`
- Check browser console for errors
- Verify the framework is properly initialized

**Events not updating:**
- The visualizer auto-refreshes every 2 seconds when visible
- Ensure your framework emits events (built-in feature)

**Can't find a service:**
- Use the search box in the Services tab
- Check if the bundle is in ACTIVE state
- Verify service registration in your bundle activator

---

Made with ❤️ for the Pandino community

