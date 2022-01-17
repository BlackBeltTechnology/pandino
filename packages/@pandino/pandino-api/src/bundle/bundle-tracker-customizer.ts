import { Bundle } from './bundle';
import { BundleEvent } from './bundle-event';

/**
 * The {@code BundleTrackerCustomizer} interface allows a {@code BundleTracker} to customize the {@code Bundle}s that
 * are tracked. A {@code BundleTrackerCustomizer} is called when a bundle is being added to a {@code BundleTracker}.
 * The {@code BundleTrackerCustomizer} can then return an object for the tracked bundle. A
 * {@code BundleTrackerCustomizer} is also called when a tracked bundle is modified or has been removed from a
 * {@code BundleTracker}.
 *
 * <p>
 * The methods in this interface may be called as the result of a {@code BundleEvent} being received by a
 * {@code BundleTracker}. Since {@code BundleEvent}s are received synchronously by the {@code BundleTracker}, it is
 * highly recommended that implementations of these methods do not alter bundle states while being synchronized on any
 * object.
 */
export interface BundleTrackerCustomizer<T> {
  /**
   * A bundle is being added to the {@code BundleTracker}.
   *
   * <p>
   * This method is called before a bundle which matched the search parameters
   * of the {@code BundleTracker} is added to the {@code BundleTracker}. This
   * method should return the object to be tracked for the specified
   */
  addingBundle(bundle: Bundle, event: BundleEvent): T;

  /**
   * A bundle tracked by the {@code BundleTracker} has been modified.
   *
   * <p>
   * This method is called when a bundle being tracked by the
   * {@code BundleTracker} has had its state modified.
   */
  modifiedBundle(bundle: Bundle, event: BundleEvent, object: T): void;

  /**
   * A bundle tracked by the {@code BundleTracker} has been removed.
   *
   * <p>
   * This method is called after a bundle is no longer being tracked by the
   * {@code BundleTracker}.
   */
  removedBundle(bundle: Bundle, event: BundleEvent, object: T): void;
}
