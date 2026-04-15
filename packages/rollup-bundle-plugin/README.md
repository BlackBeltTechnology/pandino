# @pandino/rollup-bundle-plugin

Rollup/Vite plugin for Pandino that discovers decorators (e.g. `@Component`) across your source files and generates a BundleModule the Pandino runtime can consume.

The generated module can be imported via a virtual id (`pandino:bundle`) and is also emitted as a physical chunk (default: `pandino/bundle.js`).

## Install

```bash
pnpm add -D @pandino/rollup-bundle-plugin
```

Peer dependencies: rollup (>=3) and/or vite (>=4).

## What it generates

A module exporting default object matching Pandino's `BundleModule` shape:

```typescript
export default {
  headers: {
    bundleSymbolicName: string,
    bundleVersion: string,
  },
  activator?: BundleActivator, // default export of provided activator file
  components?: (new (...args: any[]) => any)[], // collected classes annotated with @Component
}
```

- `headers` are derived from the nearest `package.json` (name -> bundleSymbolicName, version -> bundleVersion).
- `components` are classes found in files that contain the configured decorator (default: `@Component`).
- `activator` is set to the default export of the configured activator module, if provided.

## Usage with Vite

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import pandinoBundle from '@pandino/rollup-plugin-bundle';

export default defineConfig({
  // ...
  plugins: [
    pandinoBundle({
      virtualId: 'pandino:bundle:alpha',
      include: ['src/bundles/alpha/**/*.{ts,tsx}'],
      activator: 'src/bundles/alpha/activator.ts',
      headers: {
        bundleSymbolicName: `${packageJson.name}.alpha`,
        bundleVersion: packageJson.version,
        bundleDescription: 'Alpha example bundle',
      },
    }),
  ],
});
```

> Every `pandinoBundle()` call creates a separate bundle. You can call it multiple times with different options if needed.

Then in your app you can import:

```typescript jsx
import { type FC, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { PandinoProvider } from '@pandino/react-hooks';

const Root: FC = () => {
    return (
        <PandinoProvider bundles={[import('pandino:bundle:alpha'), /* ... */]}>
            {/* ... */}
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

The `virtualId` option is only necessary if you want to import the bundle module directly. If you only want the emitted chunk, you can omit it.

## Options

- **include**: string | string[]
  - Glob(s) to include. Default: `['**/*.{js,jsx,ts,tsx}']`
- **exclude**: string | string[]
  - Glob(s) to exclude. Default: `['**/node_modules/**', '**/dist/**', '**/build/**']`
- **rootDir**: string
  - Root directory for scanning and for resolving `package.json`. Default: `process.cwd()`
- **componentsDecorator**: string
  - Decorator name to detect as components. Default: `Component`
- **activator**: string
  - Path to a module whose default export implements Pandino's `BundleActivator`.
- **virtualId**: string
  - Virtual module id to expose. Default: `pandino:bundle`
- **outputFile**: string
  - Emitted chunk path (relative to Rollup output dir). Default: `pandino/bundle.js`

## Notes and limitations

- Detection uses AST parsing via the TypeScript compiler API to find exported classes annotated with your configured decorator name (default: `Component`). Only real decorators are supported; commented markers are not recognized. It supports both `export class Foo` and `export default class Foo`.
- The plugin scans the filesystem at build start using the include/exclude globs and also observes files passing through Rollup's transform hook.

## Testing

This repository contains Vitest tests under `src/__tests__` demonstrating typical usage. Run tests from the monorepo root:

pnpm test

## License

EPL-2.0
