/** A single log entry capturing level, message, timestamp, and optional context. */
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: number;
  bundle?: string;
  exception?: Error;
  context?: Record<string, unknown>;
}

/** Log severity levels. Lower numeric value = higher severity. */
export enum LogLevel {
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4,
}

/** Listener that receives log entries as they are recorded. */
export interface LogListener {
  /** Called when a new log entry is recorded. */
  logged(entry: LogEntry): void;
}

/**
 * Centralized logging service. Obtain via
 * `context.getServiceReference<LogService>('LogService')` or
 * `context.getLogService()`.
 */
export interface LogService {
  /** Logs a message at the specified level. */
  log(level: LogLevel, message: string, exception?: Error, context?: Record<string, unknown>): void;
  /** Logs an error-level message. */
  error(message: string, exception?: Error, context?: Record<string, unknown>): void;
  /** Logs a warning-level message. */
  warn(message: string, exception?: Error, context?: Record<string, unknown>): void;
  /** Logs an info-level message. */
  info(message: string, exception?: Error, context?: Record<string, unknown>): void;
  /** Logs a debug-level message. */
  debug(message: string, exception?: Error, context?: Record<string, unknown>): void;
  /** Returns true if messages at the given level would be recorded. */
  isLoggable(level: LogLevel): boolean;
  /** Sets the minimum log level. Messages below this level are discarded. */
  setLogLevel(level: LogLevel): void;
  /** Returns the current minimum log level. */
  getLogLevel(): LogLevel;
  /** Registers a listener to receive all future log entries. */
  addLogListener(listener: LogListener): void;
  /** Removes a previously registered log listener. */
  removeLogListener(listener: LogListener): void;
}

export interface LogServiceFactory {
  createLogService(): LogService;
}
