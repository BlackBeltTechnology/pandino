// Bridges @testing-library/jest-dom's matcher types to Vitest 5.
//
// jest-dom (7.0.1) still augments the Vitest 4 signature `Assertion<T>`, which no
// longer merges with Vitest 5's `Assertion<R, T>`. Declaring the augmentation with
// the current arity restores `toBeInTheDocument()` and friends until jest-dom ships
// Vitest 5 support.
import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers';

declare module 'vitest' {
  interface Assertion<R extends void | Promise<void> = void, T = unknown> extends TestingLibraryMatchers<T, R> {}
  interface AsymmetricMatchersContaining extends TestingLibraryMatchers<unknown, void> {}
}
