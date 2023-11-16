import { LogLevel } from '@pandino/pandino-api';
import type { Logger } from '@pandino/pandino-api';

/* istanbul ignore file */
export class ConsoleLogger implements Logger {
  constructor(private level: LogLevel = LogLevel.DEBUG) {}

  debug(...data: any[]): void {
    if (this.level - LogLevel.DEBUG >= 0) {
      console.debug(new Date().toISOString(), '[DEBUG]', ...data);
    }
  }

  error(...data: any[]): void {
    if (this.level - LogLevel.ERROR >= 0) {
      console.error(new Date().toISOString(), '[ERROR]', ...data);
    }
  }

  info(...data: any[]): void {
    if (this.level - LogLevel.INFO >= 0) {
      console.info(new Date().toISOString(), '[INFO]', ...data);
    }
  }

  log(...data: any[]): void {
    if (this.level - LogLevel.LOG >= 0) {
      console.log(new Date().toISOString(), '[LOG]', ...data);
    }
  }

  trace(...data: any[]): void {
    if (this.level - LogLevel.TRACE >= 0) {
      console.trace(new Date().toISOString(), '[TRACE]', ...data);
    }
  }

  warn(...data: any[]): void {
    if (this.level - LogLevel.WARN >= 0) {
      console.warn(new Date().toISOString(), '[WARN]', ...data);
    }
  }

  setLogLevel(level: LogLevel): void {
    this.level = level;
  }
}
