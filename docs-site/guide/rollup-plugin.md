---
title: Rollup Bundle Plugin Guide
description: Guide to @pandino/rollup-bundle-plugin - a Rollup/Vite plugin that auto-discovers @Component classes and emits Pandino bundle modules.
---

# Rollup Bundle Plugin

A Rollup / Vite plugin that turns a directory of decorated TypeScript classes into a Pandino **bundle module** at build time. It scans your sources for classes annotated with `@Component` (from [`@pandino/decorators`](/guide/decorators)), collects them, and emits a module that the Pandino runtime can install and start.

## Where it fits in the Pandino ecosystem

```
  Your source files                    @pandino/rollup-bundle-plugin
  +--------------------------+         +--------------------------------+
  | @Component class Foo {}  | -->     | Scans sources for @Component   |
  | @Component class Bar {}  |         | Reads package.json for headers |
  | activator.ts (optional)  |         | Emits a BundleModule           |
  +--------------------------+         +----------------+---------------+
                                                        | import('pandino:bundle:...')
                                                        v
                                       <PandinoProvider bundles={[ ... ]}>
                                       (or context.installBundle)
```

Without this plugin you would have to maintain bundle modules by hand, listing every component class and writing headers yourself. The plugin removes that boilerplate: drop a class into a watched directory, and it becomes part of the bundle on the next build.

## Installation

```bash
npm install --save-dev @pandino/rollup-bundle-plugin
```

Peer dependencies: `rollup` >= 3 and/or `vite` >= 4.

## What it produces

A module whose default export matches Pandino's `BundleModule` shape:

```typescript
export default {
  headers: {
    bundleSymbolicName: string,
    bundleVersion: string,
    // any additional headers you provide
  },
  activator?: BundleActivator, // default export of the configured activator file
  components?: Array<new (...args: any[]) => any>, // classes annotated with @Component
};
```

- **Headers** are derived from the nearest `package.json` (`name` -> `bundleSymbolicName`, `version` -> `bundleVersion`) and can be extended or overridden through the `headers` option.
- **Components** are classes found in files matching `include` that contain the configured decorator (default: `@Component`).
- **Activator** is the default export of the file specified in `activator`, if provided.

The module is exposed two ways:

1. **Virtual module import** -- `import bundle from 'pandino:bundle'` (the id is configurable via `virtualId`). Ideal when you install the bundle via `<PandinoProvider bundles={...}>` or `context.installBundle()`.
2. **Emitted chunk** -- a real file written to the Rollup output (default: `pandino/bundle.js`). Useful for consumers that want to load bundles lazily at runtime.

## Usage with Vite

```typescript
// vite.config.ts
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import pandinoBundle from '@pandino/rollup-bundle-plugin';

const pkg = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8'));

export default defineConfig({
  plugins: [
    pandinoBundle({
      virtualId: 'pandino:bundle:alpha',
      include: ['src/bundles/alpha/**/*.{ts,tsx}'],
      activator: 'src/bundles/alpha/activator.ts',
      headers: {
        bundleSymbolicName: `${pkg.name}.alpha`,
        bundleVersion: pkg.version,
        bundleDescription: 'Alpha example bundle',
      },
    }),
    pandinoBundle({
      virtualId: 'pandino:bundle:beta',
      include: ['src/bundles/beta/**/*.{ts,tsx}'],
      headers: {
        bundleSymbolicName: `${pkg.name}.beta`,
        bundleVersion: pkg.version,
      },
    }),
  ],
});
```

> Call `pandinoBundle()` once per bundle you want to produce. Each call creates an independent scan with its own `virtualId`, `include` pattern, activator, and headers.

Then consume the bundles in your app:

```tsx
import { PandinoProvider } from '@pandino/react-hooks';

<PandinoProvider bundles={[import('pandino:bundle:alpha'), import('pandino:bundle:beta')]}>
  {/* ... */}
</PandinoProvider>;
```

Or, without React:

```typescript
const { default: alphaBundle } = await import('pandino:bundle:alpha');
await context.installBundle('pandino:bundle:alpha', alphaBundle);
```

## Options

| Option                | Type                     | Default                                               | Purpose                                                                                                |
| --------------------- | ------------------------ | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `include`             | `string \| string[]`     | `['**/*.{js,jsx,ts,tsx}']`                            | Files to scan for `@Component` classes.                                                                |
| `exclude`             | `string \| string[]`     | `['**/node_modules/**', '**/dist/**', '**/build/**']` | Files to skip.                                                                                         |
| `rootDir`             | `string`                 | `process.cwd()`                                       | Base directory for scanning and for locating `package.json`.                                           |
| `componentsDecorator` | `string`                 | `'Component'`                                         | Decorator name to look for. Use this if you've re-exported the decorator under a different name.       |
| `activator`           | `string`                 | --                                                    | Path to a module whose default export implements `BundleActivator`.                                    |
| `virtualId`           | `string`                 | `'pandino:bundle'`                                    | Virtual module id used by `import(...)`. Give each bundle its own id.                                  |
| `outputFile`          | `string`                 | `'pandino/bundle.js'`                                 | Path (relative to the Rollup output directory) for the emitted chunk.                                  |
| `headers`             | `Partial<BundleHeaders>` | Derived from `package.json`                           | Extends / overrides the auto-derived headers (e.g. `bundleName`, `bundleDescription`, `fragmentHost`). |

## Notes and limitations

- Component discovery is performed by AST parsing via the TypeScript compiler API. Only real decorator usages are recognised -- commented-out or string references are ignored.
- Both `export class Foo` and `export default class Foo` are supported.
- Scanning happens at `buildStart` using the configured globs; files that pass through Rollup's `transform` hook are also observed, so newly added components in watch mode are picked up.
- The plugin does not transpile your code -- it only locates components. Pair it with the usual TypeScript / decorator tooling in your Rollup or Vite setup.

For the full plugin API reference, see [Rollup Plugin API](/api/rollup-plugin).
