import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// Library build configuration for React users
export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.tsx'),
      name: 'PandinoVisualizer',
      formats: ['es', 'cjs'],
      fileName: (format) => format === 'es' ? 'index.js' : 'index.cjs',
    },
    rollupOptions: {
      external: ['react', 'react-dom', '@pandino/pandino', '@xyflow/react', 'react/jsx-runtime'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          '@pandino/pandino': 'Pandino',
          '@xyflow/react': 'ReactFlow',
        },
      },
    },
    outDir: 'dist',
    emptyOutDir: false,
    sourcemap: true,
  },
});

