import { Event } from './event';

/**
 * Listener for Events.
 *
 * EventHandler objects are registered with the Framework service registry and are notified with an Event object when an
 * event is sent or posted.
 *
 * EventHandler objects can inspect the received Event object to determine its topic and properties.
 *
 * EventHandler objects must be registered with a service property EventConstants.EVENT_TOPIC whose value is the list of
 * topics in which the event handler is interested.
 *
 * Event Handler services can also be registered with an "EVENT_FILTER" service property to further filter the events.
 * If the syntax of this filter is invalid, then the Event Handler must be ignored by the Event Admin service.
 */
export interface EventHandler {
  handleEvent(event: Event): void;
}
