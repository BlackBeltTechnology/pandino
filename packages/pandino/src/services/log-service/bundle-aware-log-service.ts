import type { Bundle } from '../../framework/interfaces';
import { AbstractLogService } from './abstract-log-service';
import type { LogLevel, LogListener, LogService } from './interfaces';

export class BundleAwareLogService extends AbstractLogService {
  private wrappedLogService: LogService;
  private readonly bundle: Bundle;

  constructor(logService: LogService, bundle: Bundle) {
    super();
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
