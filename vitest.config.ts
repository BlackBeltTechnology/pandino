import { defineProject } from 'vitest/config';

export default defineProject({
  test: {
    projects: ['packages/*'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'packages/*/src/**/*.{ts,tsx}',
      ],
      exclude: [
        '**/index.ts',
        'packages/*/src/**/*.test.{ts,tsx}',
        'packages/example',
        'packages/*/src/**/setup.ts',
      ],
    }
  },
});
