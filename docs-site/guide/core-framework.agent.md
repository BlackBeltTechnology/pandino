# core-framework.agent.md — digest of `docs-site/guide/core-framework.md`

Getting-started guide for `@pandino/pandino` core. (Near-duplicate of `packages/pandino/README.md`.)

## Gist

- **Where it fits**: core runtime under decorators/react-hooks/rollup-plugin.
- **Install & TS config**: package install + `experimentalDecorators`/`emitDecoratorMetadata` setup.
- **Core concepts**: services & service references, bundles, dynamic dependencies, SCR.
- **Quick start**: (1) bootstrap the framework, (2) register/consume a service imperatively, (3) declare a component with decorators.
- **Service properties & LDAP filters**: filtering registered services.
- **Built-in services**: `LogService`, `EventAdmin`, `ConfigurationAdmin`, `ServiceTracker`, `ServiceComponentRuntime` (SCR).
- **Writing a bundle** (incl. fragment bundles), recommended patterns, public API cheatsheet.

## When to open the full file

Copy-paste bootstrap/bundle examples or the API cheatsheet.
