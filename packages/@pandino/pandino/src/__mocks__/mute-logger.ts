import type { Logger, LogLevel } from '@pandino/pandino-api';

export class MuteLogger implements Logger {
  debug(...data: any[]): void {}

  error(...data: any[]): void {}

  info(...data: any[]): void {}

  log(...data: any[]): void {}

  setLogLevel(level: LogLevel): void {}

  trace(...data: any[]): void {}

  warn(...data: any[]): void {}
}
