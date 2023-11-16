import type { Bundle } from './bundle';

/**
 * A reference to a Bundle.
 */
export interface BundleReference {
  /**
   * Returns the {@code Bundle} object associated with this {@code BundleReference}.
   *
   * @returns {Bundle} The {@code Bundle} object associated with this {@code BundleReference}.
   */
  getBundle(): Bundle | undefined;
}
