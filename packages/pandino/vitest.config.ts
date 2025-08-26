import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: [
      'src/**/*.{test,spec}.{ts,mts,tsx}',
      // Explicitly include tests under __tests__ directories
      'src/**/__tests__/**/*.{test,spec}.{ts,mts,tsx}'
    ],
    exclude: ['**/node_modules/**', '**/dist/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'coverage/**',
        'dist/**',
        '**/node_modules/**',
        '**/*.d.ts',
        '**/test/**',
        // keep excluding test sources from coverage, but discovery is allowed above
        '**/__tests__/**',
        'src/test/setup.ts'
      ],
    },
  },
});
