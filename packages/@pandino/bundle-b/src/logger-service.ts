import { LogLevel } from './log-level';

export type LoggerService = (message: string, level?: LogLevel) => void;
