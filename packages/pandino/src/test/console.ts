import { vi } from 'vitest';

type ConsoleMethod = 'log' | 'error' | 'warn' | 'info' | 'debug';

const DEFAULT_METHODS: ConsoleMethod[] = ['log', 'error', 'warn', 'info', 'debug'];

/**
 * Silences the given console methods for the current test, keeping each one a
 * spy so call assertions still work. Pair with `vi.restoreAllMocks()`.
 */
export function silenceConsole(methods: ConsoleMethod[] = DEFAULT_METHODS): void {
  for (const method of methods) {
    vi.spyOn(console, method).mockImplementation(() => {});
  }
}
