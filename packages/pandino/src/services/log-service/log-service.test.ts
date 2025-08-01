import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ConsoleLogService } from './console-log-service';
import { LogLevel, type LogListener } from './interfaces';

describe('ConsoleLogService', () => {
  let logService: ConsoleLogService;
  let mockListener: LogListener;

  beforeEach(() => {
    logService = new ConsoleLogService();
    mockListener = {
      logged: vi.fn(),
    };

    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('log levels', () => {
    it('should respect log level filtering', () => {
      logService.setLogLevel(LogLevel.WARN);

      logService.debug('debug message');
      logService.info('info message');
      logService.warn('warn message');
      logService.error('error message');

      expect(console.debug).not.toHaveBeenCalled();
      expect(console.info).not.toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenCalledTimes(1);
    });

    it('should check if level is loggable', () => {
      logService.setLogLevel(LogLevel.INFO);

      expect(logService.isLoggable(LogLevel.ERROR)).toBe(true);
      expect(logService.isLoggable(LogLevel.WARN)).toBe(true);
      expect(logService.isLoggable(LogLevel.INFO)).toBe(true);
      expect(logService.isLoggable(LogLevel.DEBUG)).toBe(false);
    });

    it('should get and set log level', () => {
      expect(logService.getLogLevel()).toBe(LogLevel.INFO);

      logService.setLogLevel(LogLevel.DEBUG);
      expect(logService.getLogLevel()).toBe(LogLevel.DEBUG);
    });

    it('should not log anything when level is set to ERROR and only DEBUG/INFO/WARN messages are sent', () => {
      logService.setLogLevel(LogLevel.ERROR);

      logService.debug('debug message');
      logService.info('info message');
      logService.warn('warn message');

      expect(console.debug).not.toHaveBeenCalled();
      expect(console.info).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
    });

    it('should only log ERROR messages when level is set to ERROR', () => {
      logService.setLogLevel(LogLevel.ERROR);

      logService.debug('debug message');
      logService.info('info message');
      logService.warn('warn message');
      logService.error('error message');

      expect(console.debug).not.toHaveBeenCalled();
      expect(console.info).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledTimes(1);
    });

    it('should log ERROR and WARN when level is set to WARN', () => {
      logService.setLogLevel(LogLevel.WARN);

      logService.debug('debug message');
      logService.info('info message');
      logService.warn('warn message');
      logService.error('error message');

      expect(console.debug).not.toHaveBeenCalled();
      expect(console.info).not.toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenCalledTimes(1);
    });

    it('should log ERROR, WARN, and INFO when level is set to INFO', () => {
      logService.setLogLevel(LogLevel.INFO);

      logService.debug('debug message');
      logService.info('info message');
      logService.warn('warn message');
      logService.error('error message');

      expect(console.debug).not.toHaveBeenCalled();
      expect(console.info).toHaveBeenCalledTimes(1);
      expect(console.warn).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenCalledTimes(1);
    });

    it('should log all levels when set to DEBUG', () => {
      logService.setLogLevel(LogLevel.DEBUG);

      logService.debug('debug message');
      logService.info('info message');
      logService.warn('warn message');
      logService.error('error message');

      expect(console.debug).toHaveBeenCalledTimes(1);
      expect(console.info).toHaveBeenCalledTimes(1);
      expect(console.warn).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenCalledTimes(1);
    });
  });

  describe('logging methods', () => {
    it('should log error messages', () => {
      const error = new Error('test error');
      const context = { userId: 123 };

      logService.error('error message', error, context);

      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('ERROR: error message'), error);
    });

    it('should log with context', () => {
      const context = { sessionId: 'abc123', action: 'login' };

      logService.info('user action', undefined, context);

      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('INFO: user action {"sessionId":"abc123","action":"login"}'),
      );
    });

    it('should format timestamps correctly', () => {
      const beforeTime = Date.now();
      logService.info('test message');
      const afterTime = Date.now();

      const call = (console.info as any).mock.calls[0][0];
      const timestampMatch = call.match(/\[(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)\]/);

      expect(timestampMatch).toBeTruthy();
      const logTime = new Date(timestampMatch[1]).getTime();
      expect(logTime).toBeGreaterThanOrEqual(beforeTime);
      expect(logTime).toBeLessThanOrEqual(afterTime);
    });
  });

  describe('log listeners', () => {
    it('should notify listeners when logging', () => {
      logService.addLogListener(mockListener);

      logService.info('test message');

      expect(mockListener.logged).toHaveBeenCalledWith(
        expect.objectContaining({
          level: LogLevel.INFO,
          message: 'test message',
          timestamp: expect.any(Number),
        }),
      );
    });

    it('should handle multiple listeners', () => {
      const listener1 = { logged: vi.fn() };
      const listener2 = { logged: vi.fn() };

      logService.addLogListener(listener1);
      logService.addLogListener(listener2);

      logService.warn('test warning');

      expect(listener1.logged).toHaveBeenCalledTimes(1);
      expect(listener2.logged).toHaveBeenCalledTimes(1);
    });

    it('should remove listeners', () => {
      logService.addLogListener(mockListener);
      logService.removeLogListener(mockListener);

      logService.info('test message');

      expect(mockListener.logged).not.toHaveBeenCalled();
    });

    it('should handle listener errors gracefully', () => {
      const faultyListener = {
        logged: vi.fn().mockImplementation(() => {
          throw new Error('Listener error');
        }),
      };

      logService.addLogListener(faultyListener);

      expect(() => logService.info('test message')).not.toThrow();
      expect(console.error).toHaveBeenCalledWith('Error in log listener:', expect.any(Error));
    });

    it('should not notify listeners when log level filters out message', () => {
      logService.setLogLevel(LogLevel.WARN);
      logService.addLogListener(mockListener);

      logService.debug('debug message');

      expect(mockListener.logged).not.toHaveBeenCalled();
    });
  });

  describe('log entry creation', () => {
    it('should create complete log entries', () => {
      logService.addLogListener(mockListener);
      const error = new Error('test error');
      const context = { key: 'value' };

      logService.error('error message', error, context);

      expect(mockListener.logged).toHaveBeenCalledWith({
        level: LogLevel.ERROR,
        message: 'error message',
        timestamp: expect.any(Number),
        exception: error,
        context,
      });
    });
  });
});
