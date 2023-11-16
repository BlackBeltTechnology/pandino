import type { BundleEvent } from './bundle-event';

/**
 * A {@code BundleEvent} listener. {@code BundleListener} is a listener interface that may be implemented by a bundle
 * developer. When a {@code BundleEvent} is fired, it is asynchronously delivered to a {@code BundleListener}. The
 * Framework delivers {@code BundleEvent} objects to a {@code BundleListener} in order and must not concurrently call a
 * {@code BundleListener}.
 * <p>
 * A {@code BundleListener} object is registered with the Framework using the
 * {@link BundleContext#addBundleListener(BundleListener)} method.
 * {@code BundleListener}s are called with a {@code BundleEvent} object when a bundle has been installed, resolved,
 * started, stopped, updated, unresolved, or uninstalled.
 */
export interface BundleListener {
  /**
   * Receives notification that a bundle has had a lifecycle change.
   *
   * @param {BundleEvent} event
   */
  bundleChanged(event: BundleEvent): void;

  /**
   * Utility property to help the Framework distinguish async and sync listeners.
   */
  isSync?: boolean;
}
