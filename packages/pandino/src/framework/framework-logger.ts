import { type LogLevel, type LogService, type LogListener, type LogEntry } from '~/services/log-service/interfaces';

export class FrameworkLogger {
  private logService: LogService | null = null;
  private defaultLogLevel: LogLevel;
  private logListeners: Set<LogListener> = new Set();

  constructor(defaultLogLevel: LogLevel) {
    this.defaultLogLevel = defaultLogLevel;
  }

  setLogService(logService: LogService): void {
    if (logService && this.logListeners.size > 0) {
      const listeners = Array.from(this.logListeners);
      listeners.forEach((listener) => {
        logService.addLogListener(listener);
      });
      this.logListeners.clear();
    }

    this.logService = logService;

    // Apply the default log level to the log service if it's available
    if (this.logService) {
      this.logService.setLogLevel(this.defaultLogLevel);
    }
  }

  setLogLevel(level: LogLevel): void {
    this.defaultLogLevel = level;

    // Apply the log level to the log service if it's available
    if (this.logService) {
      this.logService.setLogLevel(level);
    }
  }

  getLogLevel(): LogLevel {
    return this.logService ? this.logService.getLogLevel() : this.defaultLogLevel;
  }

  log(level: LogLevel, message: string, exception?: Error, context?: Record<string, unknown>): void {
    if (this.logService) {
      this.logService.log(level, message, exception, context);
    } else {
      const frameworkContext = { ...context, __framework: true };
      this.logToConsole(level, message, exception, frameworkContext);

      if (this.logListeners.size > 0) {
        const entry: LogEntry = {
          level,
          message,
          timestamp: Date.now(),
          exception,
          context: frameworkContext,
        };

        this.logListeners.forEach((listener) => {
          try {
            listener.logged(entry);
          } catch (error) {
            console.error('Error in log listener', error);
          }
        });
      }
    }
  }

  error(message: string, exception?: Error, context?: Record<string, unknown>): void {
    this.log(1, message, exception, context); // LogLevel.ERROR = 1
  }

  warn(message: string, exception?: Error, context?: Record<string, unknown>): void {
    this.log(2, message, exception, context); // LogLevel.WARN = 2
  }

  info(message: string, exception?: Error, context?: Record<string, unknown>): void {
    this.log(3, message, exception, context); // LogLevel.INFO = 3
  }

  debug(message: string, exception?: Error, context?: Record<string, unknown>): void {
    this.log(4, message, exception, context); // LogLevel.DEBUG = 4
  }

  isLoggable(level: LogLevel): boolean {
    return this.logService ? this.logService.isLoggable(level) : level <= this.defaultLogLevel;
  }

  addLogListener(listener: LogListener): void {
    if (this.logService) {
      this.logService.addLogListener(listener);
    } else {
      this.logListeners.add(listener);
    }
  }

  removeLogListener(listener: LogListener): void {
    if (this.logService) {
      this.logService.removeLogListener(listener);
    } else {
      this.logListeners.delete(listener);
    }
  }

  /**
   * Fallback method to log to console when log service is not available.
   */
  private logToConsole(level: LogLevel, message: string, exception?: Error, context?: Record<string, unknown>): void {
    if (level > this.defaultLogLevel) {
      return; // Skip if level is higher than default level
    }

    const timestamp = new Date().toISOString();
    const levelName = this.getLevelName(level);
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    const logMessage = `[${timestamp}] [FRAMEWORK] ${levelName}: ${message}${contextStr}`;

    switch (level) {
      case 1: // ERROR
        console.error(logMessage, exception);
        break;
      case 2: // WARN
        console.warn(logMessage);
        break;
      case 3: // INFO
        console.info(logMessage);
        break;
      case 4: // DEBUG
        console.debug(logMessage);
        break;
    }
  }

  private getLevelName(level: LogLevel): string {
    switch (level) {
      case 1:
        return 'ERROR';
      case 2:
        return 'WARN';
      case 3:
        return 'INFO';
      case 4:
        return 'DEBUG';
      default:
        return 'UNKNOWN';
    }
  }
}
