import { resolve } from 'node:path';
import { builtinModules } from 'node:module';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import pkg from './package.json';

export default defineConfig(() => {
  const deps = Object.keys(pkg.dependencies || {});
  const builtins = new Set<string>([...builtinModules, ...builtinModules.map((m) => `node:${m}`)]);
  return {
    base: '',
    resolve: {
      conditions: ['node'],
    },
    build: {
      target: 'node20',
      lib: {
        entry: resolve('src/index.ts'),
        name: 'RollupPluginPandinoBundle',
        formats: ['es', 'cjs'],
      },
      rollupOptions: {
        // Ensure Node built-ins and our deps are not bundled (and not browser-externals)
        external: (id) => deps.includes(id) || builtins.has(id) || id.startsWith('node:'),
        output: {
          // Disable chunking completely for a single artifact
          manualChunks: undefined,
          entryFileNames: 'index.[format].js',
        },
      },
    },
    plugins: [
      dts({
        exclude: ['**/node_modules/**', '**/__tests__/**', '**/*.test.ts'],
        entryRoot: 'src',
        outDir: 'dist',
        rollupTypes: false,
      }),
    ],
  };
});
