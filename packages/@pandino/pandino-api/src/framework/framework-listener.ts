import { FrameworkEvent } from './framework-event';

/**
 * A {@code FrameworkEvent} listener. {@code FrameworkListener} is a listener interface that may be implemented by a
 * bundle developer. When a {@code FrameworkEvent} is fired, it is asynchronously delivered to a
 * {@code FrameworkListener}. The Framework delivers {@code FrameworkEvent} objects to a {@code FrameworkListener} in
 * order and must not concurrently call a {@code FrameworkListener}.
 *
 * <p>
 * A {@code FrameworkListener} object is registered with the Framework using the
 * {@link BundleContext#addFrameworkListener(FrameworkListener)} method. {@code FrameworkListener} objects are called
 * with a {@code FrameworkEvent} objects when the Framework starts and when asynchronous errors occur.
 */
export interface FrameworkListener {
  /**
   * Receives notification of a general {@code FrameworkEvent} object.
   *
   * @param {FrameworkEvent} event The {@code FrameworkEvent} object.
   */
  frameworkEvent(event: FrameworkEvent): void;
}
