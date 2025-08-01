export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: number;
  bundle?: string;
  exception?: Error;
  context?: Record<string, unknown>;
}

export enum LogLevel {
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4,
}

export interface LogListener {
  logged(entry: LogEntry): void;
}

export interface LogService {
  log(level: LogLevel, message: string, exception?: Error, context?: Record<string, unknown>): void;
  error(message: string, exception?: Error, context?: Record<string, unknown>): void;
  warn(message: string, exception?: Error, context?: Record<string, unknown>): void;
  info(message: string, exception?: Error, context?: Record<string, unknown>): void;
  debug(message: string, exception?: Error, context?: Record<string, unknown>): void;
  isLoggable(level: LogLevel): boolean;
  setLogLevel(level: LogLevel): void;
  getLogLevel(): LogLevel;
  addLogListener(listener: LogListener): void;
  removeLogListener(listener: LogListener): void;
}

export interface LogServiceFactory {
  createLogService(): LogService;
}
