import { ServiceReference } from '@pandino/pandino-api';

export type ConfigurationEventType = 'UPDATED' | 'DELETED' | 'LOCATION_CHANGED';

/**
 * A Configuration Event.
 *
 * ConfigurationEvent objects are delivered to all registered ConfigurationListener service objects. ConfigurationEvents
 * must be delivered in chronological order with respect to each listener.
 *
 * A type code is used to identify the type of event. The following event types are defined:
 * - UPDATED
 * - DELETED
 * - LOCATION_CHANGED
 */
export interface ConfigurationEvent {
  /**
   * Returns the pid of the associated configuration.
   */
  getPid(): string;

  /**
   * Return the type of this event.
   *
   * The type values are:
   * - UPDATED
   * - DELETED
   * - LOCATION_CHANGED
   */
  getType(): ConfigurationEventType;

  /**
   * Return the ServiceReference object of the Configuration Admin service that created this event.
   */
  getReference(): ServiceReference<any>;
}
