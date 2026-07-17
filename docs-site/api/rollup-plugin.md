---
title: Rollup Plugin API Reference
description: API reference for @pandino/rollup-bundle-plugin - plugin options and output format.
---

# Rollup Plugin API Reference

All exports from `@pandino/rollup-bundle-plugin`.

```ts
import pandinoBundle from '@pandino/rollup-bundle-plugin';
```

## pandinoBundle

Creates a Rollup/Vite plugin that automatically discovers `@Component`-decorated classes and generates a `BundleModule`.

```ts
// rollup.config.js / vite.config.ts
import pandinoBundle from '@pandino/rollup-bundle-plugin';

export default {
  plugins: [
    pandinoBundle({
      headers: {
        bundleSymbolicName: 'com.example.my-bundle',
        bundleVersion: '1.0.0',
      },
    }),
  ],
};
```

**Signature:** `pandinoBundle(options?: PandinoBundleOptions): Plugin`

## PandinoBundleOptions

| Option                 | Type                     | Default                                               | Description                                                   |
| ---------------------- | ------------------------ | ----------------------------------------------------- | ------------------------------------------------------------- |
| `include?`             | `string \| string[]`     | `['**/*.{js,jsx,ts,tsx}']`                            | Glob patterns for files to scan for components                |
| `exclude?`             | `string \| string[]`     | `['**/node_modules/**', '**/dist/**', '**/build/**']` | Glob patterns for files to exclude                            |
| `rootDir?`             | `string`                 | `process.cwd()`                                       | Root directory for file scanning and relative path resolution |
| `componentsDecorator?` | `string`                 | `'Component'`                                         | Name of the decorator to detect as a component                |
| `activator?`           | `string`                 | -                                                     | Path to a module that default-exports a `BundleActivator`     |
| `virtualId?`           | `string`                 | `'pandino:bundle'`                                    | Virtual module ID used for importing the generated bundle     |
| `outputFile?`          | `string`                 | `'pandino/bundle.js'`                                 | Output file path for the generated bundle chunk               |
| `headers?`             | `Partial<BundleHeaders>` | Auto-detected from `package.json`                     | Bundle metadata headers (overrides auto-detected values)      |

### Headers Object

When `headers` is not provided, `bundleSymbolicName` and `bundleVersion` are read from the project's `package.json` (`name` and `version` fields).

| Property                 | Type     | Description                      |
| ------------------------ | -------- | -------------------------------- |
| `bundleSymbolicName`     | `string` | Unique bundle identifier         |
| `bundleVersion`          | `string` | Semantic version                 |
| `bundleName?`            | `string` | Human-readable name              |
| `bundleDescription?`     | `string` | Bundle description               |
| `bundleManifestVersion?` | `string` | Manifest format version          |
| `fragmentHost?`          | `string` | Host bundle for fragment bundles |

## Virtual Module Import

The plugin generates a virtual module that can be imported using the configured `virtualId` (default: `pandino:bundle`).

```ts
// In your application code
import myBundle from 'pandino:bundle';

// Install the bundle
const bundle = await context.installBundle(Promise.resolve({ default: myBundle }));
await bundle.start();
```

## Output Format

The generated virtual module exports a `BundleModule`-compatible default export:

```ts
// Generated module structure
import ComponentA from './components/component-a';
import { ComponentB } from './components/component-b';
import Activator from './my-activator';

const headers = {
  bundleSymbolicName: 'com.example.my-bundle',
  bundleVersion: '1.0.0',
};

const components = [ComponentA, ComponentB];

export default { headers, activator: Activator, components };
```

The output conforms to the `BundleModule` interface from `@pandino/pandino`:

| Property     | Type                           | Description                                            |
| ------------ | ------------------------------ | ------------------------------------------------------ |
| `headers`    | `object`                       | Bundle metadata derived from options or `package.json` |
| `activator`  | `BundleActivator \| undefined` | The activator, if an `activator` path was configured   |
| `components` | `Class[]`                      | All discovered `@Component`-decorated classes          |

## How Discovery Works

1. On `buildStart`, the plugin scans all files matching `include`/`exclude` patterns.
2. Each file is parsed with the TypeScript compiler to find classes decorated with the configured decorator name (default: `@Component`).
3. Only classes that import the decorator from `@pandino/decorators` are detected.
4. Both named exports and default exports are supported.
5. During `transform`, newly encountered components are added to the collection.
6. The virtual module is regenerated with stable, deterministic import order.

## Vite Compatibility

The plugin works with both Rollup and Vite. In Vite's `serve` mode (dev server), the virtual module is served on-the-fly via `resolveId`/`load` hooks rather than emitted as a chunk.
