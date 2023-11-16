import type { Bundle, ServiceReference } from '@pandino/pandino-api';
import type { LogLevel } from './constants';

/**
 * Provides methods to access the information contained in an individual Log Service log entry.
 *
 * A LogEntry object may be acquired from the LogReaderService.getLog method or by registering a LogListener object.
 */
export interface LogEntry {
  getBundle(): Bundle;

  getServiceReference(): ServiceReference<any>;

  getLevel(): LogLevel;

  getMessage(): string;

  getException(): Error;

  getTime(): Date;
}
