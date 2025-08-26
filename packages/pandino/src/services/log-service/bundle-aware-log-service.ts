import type { Bundle } from '../../framework/interfaces';
import { LogLevel, type LogListener, type LogService } from './interfaces';

export class BundleAwareLogService implements LogService {
  private wrappedLogService: LogService;
  private readonly bundle: Bundle;

  constructor(logService: LogService, bundle: Bundle) {
    this.wrappedLogService = logService;
    this.bundle = bundle;
  }

  log(level: LogLevel, message: string, exception?: Error, context?: Record<string, unknown>): void {
    if (!this.isLoggable(level)) {
      return;
    }

    // Create enhanced log entry with bundle metadata
    const enhancedContext = {
      ...context,
      __bundle: {
        symbolicName: this.bundle.getSymbolicName(),
        version: this.bundle.getVersion(),
        id: this.bundle.getBundleId(),
        location: this.bundle.getLocation(),
      },
    };

    // Call the wrapped service with enhanced context
    this.wrappedLogService.log(level, message, exception, enhancedContext);
  }

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

  isLoggable(level: LogLevel): boolean {
    return this.wrappedLogService.isLoggable(level);
  }

  setLogLevel(level: LogLevel): void {
    this.wrappedLogService.setLogLevel(level);
  }

  getLogLevel(): LogLevel {
    return this.wrappedLogService.getLogLevel();
  }

  addLogListener(listener: LogListener): void {
    this.wrappedLogService.addLogListener(listener);
  }

  removeLogListener(listener: LogListener): void {
    this.wrappedLogService.removeLogListener(listener);
  }

  // Method to get the underlying bundle for testing
  getBundle(): Bundle {
    return this.bundle;
  }
}
