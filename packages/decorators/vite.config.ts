import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import pkg from './package.json';

export default defineConfig(({ mode }) => {
  const isModeNotDev = mode !== 'development';
  return {
    base: '',
    define: {
      // Inject package version and name as environment variables
      'import.meta.env.VITE_PANDINO_VERSION': JSON.stringify(pkg.version),
      'import.meta.env.VITE_PANDINO_NAME': JSON.stringify(pkg.name),
    },
    build: {
      lib: {
        entry: resolve('src/index.ts'),
        name: 'PandinoDecorators',
        formats: ['es', 'cjs'],
      },
      minify: isModeNotDev,
      sourcemap: isModeNotDev,
      rollupOptions: {
        external: Object.keys(pkg.peerDependencies || {}),
        output: {
          // Disable chunking completely for a single artifact
          manualChunks: undefined,
          entryFileNames: 'decorators.[format].js',
        },
      },
    },
    plugins: [
      dts({
        exclude: ['**/node_modules/**', '**/__tests__/**', '**/*.test.ts'],
        entryRoot: 'src',
        outDir: 'dist',
        rollupTypes: true, // Bundle all types into a single file
      }),
    ],
  };
});
