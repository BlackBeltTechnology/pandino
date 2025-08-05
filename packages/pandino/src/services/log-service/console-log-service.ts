import { type LogEntry, LogLevel, type LogListener, type LogService } from './interfaces';
import type { BundleHeader } from '~/framework/interfaces';

export class ConsoleLogService implements LogService {
  private currentLevel: LogLevel = LogLevel.INFO;
  private listeners: LogListener[] = [];
  private __bundle?: BundleHeader;

  log(level: LogLevel, message: string, exception?: Error, context?: Record<string, unknown>): void {
    if (!this.isLoggable(level)) {
      return;
    }

    const contextBundleInfo = context?.__bundle as BundleHeader | undefined;
    const bundleInfo = contextBundleInfo || this.__bundle;
    const cleanContext = contextBundleInfo ? { ...context } : context || {};
    if (contextBundleInfo && cleanContext) {
      delete cleanContext.__bundle;
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: Date.now(),
      bundle: bundleInfo?.symbolicName,
      exception,
      context: Object.keys(cleanContext).length > 0 ? cleanContext : undefined,
    };

    this.writeToConsole(entry);
    this.notifyListeners(entry);
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
    return level <= this.currentLevel;
  }

  setLogLevel(level: LogLevel): void {
    this.currentLevel = level;
  }

  getLogLevel(): LogLevel {
    return this.currentLevel;
  }

  addLogListener(listener: LogListener): void {
    this.listeners.push(listener);
  }

  removeLogListener(listener: LogListener): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  private writeToConsole(entry: LogEntry): void {
    const timestamp = new Date(entry.timestamp).toISOString();
    const levelName = LogLevel[entry.level];
    const bundleStr = entry.bundle ? ` [${entry.bundle}]` : '';
    const contextStr = entry.context ? ` ${JSON.stringify(entry.context)}` : '';

    const logMessage = `[${timestamp}]${bundleStr} ${levelName}: ${entry.message}${contextStr}`;

    switch (entry.level) {
      case LogLevel.ERROR:
        console.error(logMessage, entry.exception);
        break;
      case LogLevel.WARN:
        console.warn(logMessage);
        break;
      case LogLevel.INFO:
        console.info(logMessage);
        break;
      case LogLevel.DEBUG:
        console.debug(logMessage);
        break;
    }
  }

  private notifyListeners(entry: LogEntry): void {
    for (const listener of this.listeners) {
      try {
        listener.logged(entry);
      } catch (error) {
        // We can't use the logger here to avoid potential infinite recursion
        // if the error is in the logger itself, so we use console directly
        console.error('Error in log listener:', error);
      }
    }
  }
}
