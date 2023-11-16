import type { Bundle } from './bundle';
import type { BundleEventType } from './bundle-event-type';
import type { FrameworkEventType } from '../framework';

/**
 * An event from the Framework describing a bundle lifecycle change.
 * <p>
 * {@code BundleEvent} objects are delivered to {@code BundleListener}s when a change occurs in a bundle's lifecycle. A
 * type code is used to identify the event type for future extendability.
 *
 * @Immutable
 */
export interface BundleEvent {
  /**
   * Returns the bundle which had a lifecycle change. This bundle is the source of the event.
   *
   * @returns {Bundle} The bundle that had a change occur in its lifecycle.
   */
  getBundle(): Bundle;

  /**
   * Returns the type of lifecyle event. The type values are:
   * <ul>
   * <li>"INSTALLED"</li>
   * <li>"RESOLVED"</li>
   * <li>"LAZY_ACTIVATION"</li>
   * <li>"STARTING"</li>
   * <li>"STARTED"</li>
   * <li>"STOPPING"</li>
   * <li>"STOPPED"</li>
   * <li>"UPDATED"</li>
   * <li>"UNRESOLVED"</li>
   * <li>"UNINSTALLED"</li>
   * </ul>
   *
   * @return {BundleEventType | FrameworkEventType} The type of lifecycle event.
   */
  getType(): BundleEventType | FrameworkEventType;

  /**
   * Returns the bundle that was the origin of the event.
   *
   * <p>
   * For the event type "INSTALLED", this is the bundle whose context was used to install the bundle. Otherwise it is
   * the bundle itself.
   *
   * @return {Bundle} The bundle that was the origin of the event.
   */
  getOrigin(): Bundle | undefined;
}
