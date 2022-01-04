import { LogLevel } from './log-level';

export interface Logger {
  trace(...data: any[]): void;
  debug(...data: any[]): void;
  log(...data: any[]): void;
  info(...data: any[]): void;
  warn(...data: any[]): void;
  error(...data: any[]): void;
  setLogLevel(level: LogLevel): void;
}
