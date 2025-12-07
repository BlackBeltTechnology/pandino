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

### PandinoVisualizerProvider

Context provider component that manages visualizer state.

```typescript
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

```typescript
<PandinoVisualizer
  framework={framework}
  defaultOpen={true}
  position="fullscreen"
/>
```

## 🎨 Decorator Support

The visualizer automatically extracts and displays metadata from Pandino decorators:

### ⚠️ Critical: @Component vs @Component + @Service

Understanding this distinction is **fundamental** to OSGi Declarative Services:

**@Component ONLY (Consumer Components):**
- Component is **NOT** registered in the service registry
- Cannot be referenced by other components via `@Reference`
- Can still inject dependencies and use lifecycle methods
- **Must** have `immediate=true` to activate
- Use for: background workers, event listeners, internal utilities

**@Component + @Service (Service Providers):**
- Component **IS** registered in the service registry
- Can be referenced by other components via `@Reference`
- Can have `immediate=false` for lazy activation
- Use for: service providers, shared APIs, business logic

### Component Decorator (`@Component`)
```typescript
@Component({
  name: 'MyComponent',           // Component name
  immediate: true,               // Immediate activation
  enabled: true,                 // Enabled state
  scope: 'singleton',            // Component scope
  configurationPolicy: 'require', // Config policy
  configurationPid: 'my.config',  // Configuration PID
  factory: 'my.factory'          // Factory ID
})
```

### Service Decorator (`@Service`)
```typescript
@Service({
  interfaces: ['MyService'],     // Service interfaces
  scope: 'singleton'             // Service scope
})
```

### Reference Decorator (`@Reference`)
```typescript
@Reference({
  name: 'myRef',                 // Reference name
  interface: 'TargetService',    // Target interface
  cardinality: '1..1',           // 1..1, 0..1, 1..n, 0..n
  policy: 'static',              // static or dynamic
  policyOption: 'greedy',        // greedy or reluctant
  target: '(prop=value)',        // LDAP filter
  bind: 'bindMethod',            // Bind method name
  unbind: 'unbindMethod',        // Unbind method name
  updated: 'updatedMethod',      // Updated method name
  field: 'fieldName',            // Field for injection
  fieldOption: 'replace',        // replace or update
  scope: 'bundle'                // bundle, prototype, prototype_required
})
```

### Lifecycle Decorators
```typescript
@Activate
activate() { /* Called when component activates */ }

@Deactivate
deactivate() { /* Called when component deactivates */ }

@Modified
modified() { /* Called when configuration changes */ }
```

## 🔍 Visual Elements

### Nodes
- **Bundle Node**: Represents an OSGi bundle with state, version, and symbolic name
- **Service Node**: Represents a registered service with ID, ranking, and properties
- **DS Component Node**: Service decorated with `@Component` - shows special badge and metadata
- **Phantom Node**: Visual placeholder for missing required service dependencies

### Edges
- **Containment Edge**: Bundle → Service (gray solid line)
- **Working Reference**: Service → Service dependency (blue solid line)
- **Broken Mandatory Reference**: Service → Missing dependency (red dashed line, animated)
- **Broken Optional Reference**: Not shown (optional dependencies don't block activation)
- **Factory Edge**: Factory → Created instance (purple animated line)

### Badges & Indicators
- **🔷 DS Component**: Component decorated with `@Component`
- **Factory: [id]**: Component is a factory
- **Immediate**: Component activates immediately
- **Disabled**: Component is disabled
- **⚠️ MISSING SERVICE**: Required dependency not found

## 📊 Statistics Panel

The statistics panel shows real-time metrics:
- Total number of bundles
- Total number of services
- Number of DS components
- Active bundles
- Framework state

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

## 🎮 Demo Examples

The visualizer demo (`demo/main.tsx`) includes comprehensive examples showcasing **12 DS components** organized into three sections:

### Section 1: Consumer-Only Components (@Component without @Service)

These components consume services but don't provide any:

1. **LoggerComponent** - Consumes LogService for internal logging
2. **ConfigWatcher** - Monitors configuration changes
3. **DataProcessor** - Processes data using DataStore and EventAdmin

**Key characteristics:**
- Not registered in service registry
- Cannot be referenced by other components
- Must have `immediate=true`

### Section 2: Service Provider Components (@Component + @Service)

These components are registered as services and can be referenced by others:

4. **UserManager** - Provides UserManagerService with full lifecycle
5. **DataAccessLayer** - Lazy-activated service with dynamic references
6. **NotificationService** - Factory component creating multiple instances
7. **AuthenticationService** - Bundle-scoped service with target filter
8. **CacheService** - Service with multiple (0..n) references
9. **ApiGateway** - Complex service with many dependencies

**Key characteristics:**
- Registered in service registry
- Can be referenced via @Reference
- Can be lazy (`immediate=false`) or immediate

### Section 3: Broken Components (Error Demonstration)

These demonstrate missing dependency handling:

10. **PaymentProcessor** - Missing required PaymentGateway (❌ broken)
11. **EmailService** - Missing optional MailServer (✅ OK to activate)
12. **ReportGenerator** - Missing required multiple DataProviders (❌ broken)

## 🎭 Running the Demo

```bash
# Install dependencies
pnpm install

# Run the visualizer demo
cd packages/visualizer
pnpm run dev
```

The demo includes:
- **9 DS Components** with various configurations
- **Real Pandino Framework** with decorator support
- **Interactive Graph** showing all component relationships
- **Live Examples** of missing dependencies and factory components

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

