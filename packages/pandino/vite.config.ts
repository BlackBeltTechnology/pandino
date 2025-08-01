import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { readFileSync } from 'node:fs';

// Read package.json to get the version and name
const packageJson = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8'));

export default defineConfig(({ mode }) => {
  const isModeNotDev = mode !== 'development';
  return {
    base: '',
    resolve: {
      alias: [
        { find: '~', replacement: resolve('src') },
      ],
    },
    define: {
      // Inject package version and name as environment variables
      'import.meta.env.VITE_PANDINO_VERSION': JSON.stringify(packageJson.version),
      'import.meta.env.VITE_PANDINO_NAME': JSON.stringify(packageJson.name),
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
