import { FilterApi } from '@pandino/pandino-api';

/**
 * An event. Event objects are delivered to EventHandler services which subscribe to the topic of the event.
 */
export interface Event {
  /**
   * Retrieve the value of an event property. The event topic may be retrieved with the property name "event.topics".
   *
   * @param {string} name
   */
  getProperty(name: string): any;

  /**
   * Indicate the presence of an event property. The event topic is present using the property name "event.topics".
   *
   * @param {string} name
   */
  containsProperty(name: string): boolean;

  /**
   * Returns a list of this event's property names. The list will include the event topic property name "event.topics".
   */
  getPropertyNames(): string[];

  /**
   * Returns the topic of this event.
   */
  getTopic(): string;

  /**
   * Tests this event's properties against the given filter using a case sensitive match.
   *
   * @param {FilterApi} filter
   */
  matches(filter: FilterApi): boolean;

  /**
   * Compares this Event object to another object.
   *
   * An event is considered to be equal to another event if the topic is equal and the properties are equal.
   * @param {any} other
   */
  equals(other: any): boolean;
}
