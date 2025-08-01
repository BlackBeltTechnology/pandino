import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from "@vitejs/plugin-react";

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [react()],
  test: {
    alias: [
      { find: '~', replacement: resolve(__dirname, 'src') },
    ],
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{ts,mts,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    setupFiles: ['src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'coverage/**',
        'dist/**',
        '**/node_modules/**',
        '**/*.d.ts',
        '**/test/**',
        '**/__tests__/**',
        'src/test/setup.ts'
      ],
    },
  },
});
