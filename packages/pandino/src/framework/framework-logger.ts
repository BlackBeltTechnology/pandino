import { type LogLevel, type LogService } from '~/services/log-service/interfaces';

export class FrameworkLogger {
  private logService: LogService | null = null;
  private defaultLogLevel: LogLevel;

  constructor(defaultLogLevel: LogLevel) {
    this.defaultLogLevel = defaultLogLevel;
  }

  setLogService(logService: LogService): void {
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
      // Fallback to console if log service is not available
      const frameworkContext = { ...context, __framework: true };
      this.logToConsole(level, message, exception, frameworkContext);
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
