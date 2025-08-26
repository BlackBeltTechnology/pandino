import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import pkg from './package.json';

export default defineConfig(({ mode }) => {
  const isModeNotDev = mode !== 'development';
  return {
    base: '',
    build: {
      lib: {
        entry: resolve('src/index.ts'),
        name: 'PandinoReactHooks',
        formats: ['es', 'cjs'],
      },
      minify: isModeNotDev,
      sourcemap: isModeNotDev,
      rollupOptions: {
        external: Object.keys(pkg.peerDependencies || {}),
        output: {
          // Disable chunking completely for a single artifact
          manualChunks: undefined,
          entryFileNames: 'react-hooks.[format].js',
        },
      },
    },
    plugins: [
      react(),
      dts({
        exclude: ['**/node_modules/**', '**/__tests__/**', '**/*.test.ts', '**/*.test.tsx'],
        entryRoot: 'src',
        outDir: 'dist',
        rollupTypes: true, // Bundle all types into a single file
      }),
    ],
  };
});
