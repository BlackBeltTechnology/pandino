import { ServiceEvent } from './service-event';

/**
 * A {@code ServiceEvent} listener. {@code ServiceListener} is a listener interface that may be implemented by a bundle
 * developer. When a {@code ServiceEvent} is fired, it is synchronously delivered to a {@code ServiceListener}. The
 * Framework may deliver {@code ServiceEvent} objects to a {@code ServiceListener} out of order and may concurrently
 * call and/or reenter a {@code ServiceListener}.
 *
 * <p>
 * A {@code ServiceListener} object is registered with the Framework using the {@code BundleContext.addServiceListener}
 * method. {@code ServiceListener} objects are called with a {@code ServiceEvent} object when a service is registered,
 * modified, or is in the process of unregistering.
 *
 * <p>
 * {@code ServiceEvent} object delivery to {@code ServiceListener} objects is filtered by the filter specified when the
 * listener was registered. {@code ServiceEvent} objects are only delivered to the listener if the bundle which defines
 * the listener object's class has the appropriate {@code ServicePermission} to get the service using at least one of
 * the named classes under which the service was registered.
 */
export interface ServiceListener {
  /**
   * Receives notification that a service has had a lifecycle change.
   *
   * @param {ServiceEvent} event The {@code ServiceEvent} object.
   */
  serviceChanged(event: ServiceEvent): void;

  /**
   * Utility property to help the Framework distinguish async and sync listeners.
   */
  isSync?: boolean;
}
