import { ConfigurationEvent } from './configuration-event';

/**
 * Listener for Configuration Events. When a ConfigurationEvent is fired, it is asynchronously delivered to all
 * ConfigurationListeners.
 *
 * ConfigurationListener objects are registered with the Framework service registry and are notified with a
 * ConfigurationEvent object when an event is fired.
 *
 * ConfigurationListener objects can inspect the received ConfigurationEvent object to determine its type, the pid of
 * the Configuration object with which it is associated, and the Configuration Admin service that fired the event.
 *
 * Security Considerations. Bundles wishing to monitor configuration events will require
 * ServicePermission[ConfigurationListener,REGISTER] to register a ConfigurationListener service.
 */
export interface ConfigurationListener {
  /**
   * Receives notification of a Configuration that has changed.
   *
   * @param {ConfigurationEvent} event
   */
  configurationEvent(event: ConfigurationEvent): void;
}
