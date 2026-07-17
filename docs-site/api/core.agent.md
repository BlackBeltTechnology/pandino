# core.agent.md — digest of `docs-site/api/core.md`

Full API reference for `@pandino/pandino` core. Large; open for exact signatures.

## Gist (sections → key types)
- **Bootstrap**: `OSGiBootstrap`, `BootstrapConfig`.
- **Framework & Bundle**: `OSGiFramework`, `Bundle`, `BundleContext`, `BundleActivator`, `BundleMetadata`, `BundleModule`.
- **Service Registry**: `ServiceReference<S>`, `ServiceRegistration<S>`, `ServiceFactory<S>`, `Filter`, `ServiceTracker<S,T>`, `ServiceTrackerCustomizer<S,T>`.
- **Events & Listeners**: `ServiceEvent`, `BundleEvent`, `ServiceListener`, `BundleListener`.
- **Built-in Services**: Event Admin (`EventAdmin`, `Event`, `EventHandler`), Configuration Admin (`ConfigurationAdmin`, `Configuration`), plus Log/ServiceTracker/SCR types further down.

## When to open the full file
Need exact method signatures, generics, or return types for any core API symbol.
