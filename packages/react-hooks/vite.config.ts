import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import pkg from './package.json';

export default defineConfig(({ mode }) => {
  const isModeNotDev = mode !== 'development';
  const peers = Object.keys(pkg.peerDependencies || {});
  return {
    base: '',
    build: {
      lib: {
        entry: resolve('src/index.ts'),
        name: 'PandinoReactHooks',
        formats: ['es', 'cjs'],
        fileName: (format) => `react-hooks.${format === 'cjs' ? 'cjs' : 'esm'}.js`,
      },
      minify: isModeNotDev,
      sourcemap: isModeNotDev,
      rollupOptions: {
        // Externalize peer deps and any of their subpaths (e.g. `react/jsx-runtime`),
        // so Rolldown doesn't inline them as CJS with a broken `require()` shim.
        external: (id) => peers.some((p) => id === p || id.startsWith(`${p}/`)),
        output: {
          // Disable chunking completely for a single artifact
          manualChunks: undefined,
        },
      },
    },
    plugins: [
      react(),
      dts({
        exclude: ['**/node_modules/**', '**/__tests__/**', '**/*.test.ts', '**/*.test.tsx'],
        entryRoot: 'src',
        outDir: 'dist',
        rollupTypes: false,
      }),
    ],
  };
});
