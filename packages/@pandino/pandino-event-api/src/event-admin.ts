import { Event } from './event';

/**
 * The Event Admin service. Bundles wishing to publish events must obtain the Event Admin service and call one of the
 * event delivery methods.
 */
export interface EventAdmin {
  /**
   * Initiate asynchronous, ordered delivery of an event. This method returns to the caller before delivery of the event
   * is completed. Events are delivered in the order that they are received by this method.
   *
   * @param {Event} event
   */
  postEvent(event: Event): void;
}
