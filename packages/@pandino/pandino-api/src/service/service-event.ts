import { ServiceReference } from './service-reference';
import { ServiceEventType } from './service-event-type';

/**
 * An event from the Framework describing a service lifecycle change.
 * <p>
 * {@code ServiceEvent} objects are delivered to {@code ServiceListener}s and {@code AllServiceListener}s when a change
 * occurs in this service's lifecycle. A type code is used to identify the event type for future extendability.
 */
export interface ServiceEvent {
  /**
   * Returns a reference to the service that had a change occur in its lifecycle.
   * <p>
   * This reference is the source of the event.
   *
   * @return {ServiceReference<any>} Reference to the service that had a lifecycle change.
   */
  getServiceReference(): ServiceReference<any>;

  /**
   * Returns the type of event. The event type values are:
   * <ul>
   * <li>"REGISTERED"</li>
   * <li>"MODIFIED"</li>
   * <li>"MODIFIED_ENDMATCH"</li>
   * <li>"UNREGISTERING"</li>
   * </ul>
   *
   * @return {ServiceEventType} Type of service lifecycle change.
   */
  getType(): ServiceEventType;
}
