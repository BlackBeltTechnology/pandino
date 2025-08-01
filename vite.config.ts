import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig(({ mode }) => {
  const isModeNotDev = mode !== 'development';
  return {
    base: '',
    resolve: {
      alias: [
        { find: '~', replacement: resolve('src') },
      ],
    },
    build: {
      lib: {
        entry: resolve('src/index.ts'),
        name: 'Pandino',
        formats: ['es', 'cjs'],
      },
      minify: isModeNotDev,
      sourcemap: isModeNotDev,
      rollupOptions: {
        // Bundle everything - no external dependencies
        external: [],
        output: {
          // Disable chunking completely for a single artifact
          manualChunks: undefined,
          entryFileNames: 'pandino.[format].js',
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
