import { afterEach, vi } from 'vitest';

global.fetch = vi.fn();

afterEach(() => {
  vi.resetAllMocks();
});
