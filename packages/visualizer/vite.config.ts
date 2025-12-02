import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig(({ command }) => {
  if (command === 'serve') {
    // Development server configuration for demo
    return {
      plugins: [react()],
      root: './demo',
      server: {
        port: 8080,
      },
    };
  }

  // Build configuration for standalone bundle
  return {
    plugins: [react()],
    build: {
      lib: {
        entry: resolve(__dirname, 'src/standalone.tsx'),
        name: 'PandinoVisualizer',
        formats: ['iife'],
        fileName: () => 'pandino-visualizer.js',
      },
      rollupOptions: {
        external: ['@pandino/pandino'],
        output: {
          globals: {
            '@pandino/pandino': 'Pandino',
          },
          assetFileNames: (assetInfo) => {
            if (assetInfo.name === 'style.css') return 'pandino-visualizer.css';
            return assetInfo.name || '';
          },
        },
      },
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: true,
    },
  };
});

