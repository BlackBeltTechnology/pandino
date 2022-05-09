import { LogLevel } from './constants';
import { ServiceReference } from '@pandino/pandino-api';

/**
 * Provides methods for bundles to write messages to the log.
 *
 * LogService methods are provided to log messages; optionally with a ServiceReference object or an exception.
 *
 * Bundles must log messages in the OSGi environment with a severity level according to the following hierarchy:
 * - ERROR
 * - WARNING
 * - INFO
 * - DEBUG
 */
export interface LogService {
  /**
   * Logs a message.
   */
  log(level: LogLevel, message: string, error?: Error): void;

  /**
   * Logs a message associated with a specific {@code ServiceReference}
   * object.
   */
  logReference(sr: ServiceReference<any>, level: LogLevel, message: string, error?: Error): void;
}
