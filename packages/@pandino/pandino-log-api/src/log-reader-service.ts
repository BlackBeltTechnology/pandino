import { LogListener } from './log-listener';

/**
 * Provides methods to retrieve LogEntry objects from the log.
 *
 * There are two ways to retrieve LogEntry objects:
 *
 * - The primary way to retrieve LogEntry objects is to register a LogListener object whose LogListener.logged method
 *   will be called for each entry added to the log.
 * - To retrieve past LogEntry objects, the getLog method can be called which will return an Enumeration of all LogEntry
 *   objects in the log.
 */
export interface LogReaderService {
  /**
   * Subscribes to {@code LogEntry} objects.
   *
   * <p>
   * This method registers a {@code LogListener} object with the Log Reader Service. The
   * {@code LogListener.logged(LogEntry)} method will be called for each {@code LogEntry} object placed into the log.
   *
   * <p>
   * When a bundle which registers a {@code LogListener} object is stopped or otherwise releases the Log Reader Service,
   * the Log Reader Service must remove all of the bundle's listeners.
   *
   * <p>
   * If this Log Reader Service's list of listeners already contains a listener {@code l} such that
   * {@code (l==listener)}, this method does nothing.
   *
   * @param listener A {@code LogListener} object to register; the {@code LogListener} object is used to receive
   *        {@code LogEntry} objects.
   */
  addLogListener(listener: LogListener): void;

  /**
   * Unsubscribes to {@code LogEntry} objects.
   *
   * <p>
   * This method unregisters a {@code LogListener} object from the Log Reader Service.
   *
   * <p>
   * If {@code listener} is not contained in this Log Reader Service's list of listeners, this method does nothing.
   *
   * @param listener A {@code LogListener} object to unregister.
   */
  removeLogListener(listener: LogListener): void;

  /**
   * Returns an {@code Enumeration} of all {@code LogEntry} objects in the log.
   *
   * <p>
   * Each element of the enumeration is a {@code LogEntry} object, ordered with the most recent entry first. Whether the
   * enumeration is of all {@code LogEntry} objects since the Log Service was started or some recent past is
   * implementation-specific. Also implementation-specific is whether informational and debug {@code LogEntry} objects
   * are included in the enumeration.
   *
   * @return An {@code Enumeration} of all {@code LogEntry} objects in the log.
   */
  getLog(): any;
}
