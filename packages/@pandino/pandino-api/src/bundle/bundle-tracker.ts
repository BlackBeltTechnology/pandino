import type { BundleTrackerCustomizer } from './bundle-tracker-customizer';
import type { Bundle } from './bundle';

export interface BundleTracker<T> extends BundleTrackerCustomizer<T> {
  /**
   * Open this {@code BundleTracker} and begin tracking bundles.
   *
   * <p>
   * Bundle which match the state criteria specified when this {@code BundleTracker} was created are now tracked by this
   * {@code BundleTracker}.
   */
  open(): void;

  /**
   * Close this {@code BundleTracker}.
   *
   * <p>
   * This method should be called when this {@code BundleTracker} should end the tracking of bundles.
   *
   * <p>
   * This implementation calls {@link #getBundles()} to get the list of tracked bundles to remove.
   */
  close(): void;

  /**
   * Return an array of {@code Bundle}s for all bundles being tracked by this
   * {@code BundleTracker}.
   *
   * @return An array of {@code Bundle}s.
   */
  getBundles(): Bundle[];

  /**
   * Returns the customized object for the specified {@code Bundle} if the specified bundle is being tracked by this
   * {@code BundleTracker}.
   *
   * @param bundle The {@code Bundle} being tracked.
   * @return The customized object for the specified {@code Bundle} or {@code undefined} if the specified
   *         {@code Bundle} is not being tracked.
   */
  getObject(bundle: Bundle): T | undefined;

  /**
   * Remove a bundle from this {@code BundleTracker}.
   *
   * The specified bundle will be removed from this {@code BundleTracker} . If the specified bundle was being tracked
   * then the {@code BundleTrackerCustomizer.removedBundle} method will be called for that bundle.
   *
   * @param bundle The {@code Bundle} to be removed.
   */
  remove(bundle: Bundle): void;

  /**
   * Return the number of bundles being tracked by this {@code BundleTracker}.
   *
   * @return The number of bundles being tracked.
   */
  size(): number;

  /**
   * Returns the tracking count for this {@code BundleTracker}.
   *
   * The tracking count is initialized to 0 when this {@code BundleTracker} is opened. Every time a bundle is added,
   * modified or removed from this {@code BundleTracker} the tracking count is incremented.
   *
   * <p>
   * The tracking count can be used to determine if this {@code BundleTracker} has added, modified or removed a bundle
   * by comparing a tracking count value previously collected with the current tracking count value. If the value has
   * not changed, then no bundle has been added, modified or removed from this {@code BundleTracker} since the previous
   * tracking count was collected.
   *
   * @return The tracking count for this {@code BundleTracker} or -1 if this {@code BundleTracker} is not open.
   */
  getTrackingCount(): number;

  /**
   * Return if this {@code BundleTracker} is empty.
   *
   * @return {@code true} if this {@code BundleTracker} is not tracking any bundles.
   */
  isEmpty(): boolean;
}
