import { LogLevel, type LogListener, type LogService } from './interfaces';

/**
 * Base for {@link LogService} implementations. Provides the per-level shorthands
 * (`error`, `warn`, ...), each of which simply forwards to {@link log}, so
 * implementations only have to supply `log()` plus level and listener management.
 */
export abstract class AbstractLogService implements LogService {
  abstract log(level: LogLevel, message: string, exception?: Error, context?: Record<string, unknown>): void;

  abstract isLoggable(level: LogLevel): boolean;

  abstract setLogLevel(level: LogLevel): void;

  abstract getLogLevel(): LogLevel;

  abstract addLogListener(listener: LogListener): void;

  abstract removeLogListener(listener: LogListener): void;

  error(message: string, exception?: Error, context?: Record<string, unknown>): void {
    this.log(LogLevel.ERROR, message, exception, context);
  }

  warn(message: string, exception?: Error, context?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, exception, context);
  }

  info(message: string, exception?: Error, context?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, exception, context);
  }

  debug(message: string, exception?: Error, context?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, exception, context);
  }

  trace(message: string, exception?: Error, context?: Record<string, unknown>): void {
    this.log(LogLevel.TRACE, message, exception, context);
  }

  audit(message: string, exception?: Error, context?: Record<string, unknown>): void {
    this.log(LogLevel.AUDIT, message, exception, context);
  }
}
