# Pandino Visualizer - Quick Reference

## 🚀 Quick Start

```bash
# Build the visualizer
pnpm build:visualizer

# Run the demo (opens browser automatically)
cd packages/visualizer
pnpm demo

# Location of built file
packages/visualizer/dist/pandino-visualizer.js
```

## 💻 Usage

### HTML Integration
```html
<script src="pandino-visualizer.js"></script>
<script>
  PandinoVisualizer.init(framework);
  PandinoVisualizer.show();
</script>
```

### Auto-Initialize
```javascript
window.pandinoFramework = framework;
// Visualizer auto-detects
```

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+V` | Toggle visualizer |

## 📖 API

| Method | Description |
|--------|-------------|
| `init(framework)` | Initialize with framework instance |
| `show()` | Show visualizer panel |
| `hide()` | Hide visualizer panel |
| `toggle()` | Toggle visibility |
| `clearEvents()` | Clear event log |

## 📊 Tabs

| Tab | Content |
|-----|---------|
| **Overview** | Statistics, bundle states, recent events |
| **Services** | All registered services with properties |
| **Bundles** | All bundles with states and metadata |
| **Events** | Real-time event log (services & bundles) |

## 🎨 Features

- ✅ Zero dependencies
- ✅ Real-time updates (2s refresh)
- ✅ Search & filter
- ✅ Draggable UI
- ✅ Event tracking (last 100)
- ✅ Expandable details
- ✅ 23.28 KB (5.37 KB gzipped)

## 📦 Bundle States

| State | Description |
|-------|-------------|
| `ACTIVE` | Bundle is running |
| `RESOLVED` | Bundle dependencies resolved |
| `INSTALLED` | Bundle installed, not resolved |
| `STARTING` | Bundle is starting |
| `STOPPING` | Bundle is stopping |
| `UNINSTALLED` | Bundle removed |

## 🔔 Service Events

| Event | Description |
|-------|-------------|
| `REGISTERED` | Service registered |
| `MODIFIED` | Service properties changed |
| `UNREGISTERING` | Service being removed |

## 🐛 Troubleshooting

**Not appearing?**
- Call `PandinoVisualizer.init(framework)`
- Check browser console for errors
- Try `PandinoVisualizer.show()`

**Not updating?**
- Must be visible to auto-refresh
- Check framework emits events
- Press `Ctrl+Shift+V` to toggle

**Can't find service/bundle?**
- Use search box
- Check bundle state (must be ACTIVE)
- Verify registration

## 📁 Files

```
packages/visualizer/
├── dist/pandino-visualizer.js  ← Include this in your HTML
├── demo.html                   ← Standalone demo
├── README.md                   ← Full documentation
├── INTEGRATION.md              ← Integration guide
└── SUMMARY.md                  ← Project summary
```

## 🎯 Use Cases

- 🔍 **Development**: Debug service registration
- 📊 **Monitoring**: Track framework health
- 📚 **Learning**: Understand OSGi patterns
- 🎓 **Demos**: Showcase framework capabilities

## 💡 Tips

1. Use only in development
2. Remove from production builds
3. Drag header to reposition
4. Click ▼ to expand details
5. Search to find quickly
6. Monitor Events tab during changes

## 🌐 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

**Press Ctrl+Shift+V to get started!** 🎉

