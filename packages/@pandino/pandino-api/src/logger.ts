export enum LogLevel {
  TRACE = 5,
  DEBUG = 4,
  LOG = 3,
  INFO = 2,
  WARN = 1,
  ERROR = 0,
}

export interface Logger {
  trace(...data: any[]): void;
  debug(...data: any[]): void;
  log(...data: any[]): void;
  info(...data: any[]): void;
  warn(...data: any[]): void;
  error(...data: any[]): void;
  setLogLevel(level: LogLevel): void;
}
