import { FrameworkEventType } from './framework-event-type';
import { Bundle } from '../bundle';

/**
 * A general event from the Framework.
 *
 * <p>
 * {@code FrameworkEvent} objects are delivered to {@code FrameworkListener}s when a general event occurs within the
 * Pandino environment. A type code is used to identify the event type for future extendability.
 */
export interface FrameworkEvent {
  /**
   * Returns the bundle associated with the event. This bundle is also the source of the event.
   *
   * @returns {Bundle} The bundle associated with the event.
   */
  getBundle(): Bundle;

  /**
   * Returns the type of framework event.
   * <p>
   * The type values are:
   * <ul>
   * <li>"STARTED"</li>
   * <li>"ERROR"</li>
   * <li>"WARNING"</li>
   * <li>"INFO"</li>
   * <li>"STOPPED"</li>
   * <li>"STOPPED_UPDATE"</li>
   * </ul>
   *
   * @returns {FrameworkEventType} The type of state change.
   */
  getType(): FrameworkEventType;

  /**
   * Return an {@code Error} event if such happened during processing.
   *
   * @returns {Error} The error which occurred during Event processing.
   */
  getError(): Error;
}
