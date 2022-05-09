import { LogEntry } from './log-entry';

/**
 * Subscribes to LogEntry objects from the LogReaderService.
 *
 * A LogListener object may be registered with the Log Reader Service using the LogReaderService.addLogListener method.
 * After the listener is registered, the logged method will be called for each LogEntry object created. The LogListener
 * object may be unregistered by calling the LogReaderService.removeLogListener method.
 */
export interface LogListener {
  /**
   * Listener method called for each LogEntry object created.
   *
   * <p>
   * As with all event listeners, this method should return to its caller as
   * soon as possible.
   *
   * @param entry A {@code LogEntry} object containing log information.
   */
  logged(entry: LogEntry): void;
}
