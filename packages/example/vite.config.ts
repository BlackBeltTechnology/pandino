import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { resolve } from 'path';
import { readFileSync } from 'fs';

// Read package.json to extract name and version
const packageJson = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8'))

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_BUNDLE_SYMBOLIC_NAME': JSON.stringify(packageJson.name),
    'import.meta.env.VITE_BUNDLE_VERSION': JSON.stringify(packageJson.version),
    'import.meta.env.VITE_BUNDLE_DESCRIPTION': JSON.stringify(packageJson.description),
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        'greeting-service-bundle': resolve(__dirname, 'src/bundles/greeting-service-bundle.ts'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          return chunkInfo.name === 'greeting-service-bundle'
            ? 'bundles/[name].js'
            : 'assets/[name]-[hash].js';
        },
      },
    },
  },
})
