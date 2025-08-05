import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BundleHeader } from '~/framework/interfaces';
import { ConsoleLogService } from '../console-log-service';
import { LogLevel, type LogListener } from '../interfaces';

describe('ConsoleLogService', () => {
  let consoleLogService: ConsoleLogService;
  let mockListener: LogListener;

  const verifyLogFormat = (
    logMessage: string,
    level: string,
    message: string,
    bundleName?: string,
    context?: Record<string, unknown>,
  ) => {
    expect(logMessage).toMatch(/^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/);

    if (bundleName) {
      expect(logMessage).toContain(` [${bundleName}]`);
    } else {
      expect(logMessage).not.toMatch(/ \[\w+\]/);
    }

    expect(logMessage).toContain(`${level}: ${message}`);

    if (context && Object.keys(context).length > 0) {
      const contextStr = JSON.stringify(context);
      expect(logMessage).toContain(contextStr);
    }
  };

  beforeEach(() => {
    consoleLogService = new ConsoleLogService();

    mockListener = {
      logged: vi.fn(),
    };

    vi.spyOn(console, 'error');
    vi.spyOn(console, 'warn');
    vi.spyOn(console, 'info');
    vi.spyOn(console, 'debug');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('bundle name inclusion in log messages', () => {
    it('should include bundle name in log messages when __bundle property is set', () => {
      const bundleInfo: BundleHeader = {
        symbolicName: 'test.bundle',
        version: '1.0.0',
        id: '123',
        location: '/test/bundle/location',
      };
      (consoleLogService as any).__bundle = bundleInfo;

      consoleLogService.info('Test message');

      consoleLogService.addLogListener(mockListener);
      consoleLogService.info('Test message');
      expect(mockListener.logged).toHaveBeenCalledWith(
        expect.objectContaining({
          level: LogLevel.INFO,
          message: 'Test message',
          bundle: 'test.bundle',
        }),
      );

      expect(console.info).toHaveBeenCalledTimes(2);
      const logMessage = (console.info as any).mock.calls[0][0];
      verifyLogFormat(logMessage, 'INFO', 'Test message', 'test.bundle');
    });

    it('should include bundle name in log messages when provided via context', () => {
      const context = {
        __bundle: {
          symbolicName: 'context.bundle',
          version: '2.0.0',
          id: 456,
          location: '/context/bundle/location',
        },
        userId: '123',
      };
      consoleLogService.info('Test message with context', undefined, context);

      consoleLogService.addLogListener(mockListener);
      consoleLogService.info('Test message with context', undefined, context);
      expect(mockListener.logged).toHaveBeenCalledWith(
        expect.objectContaining({
          level: LogLevel.INFO,
          message: 'Test message with context',
          bundle: 'context.bundle',
          context: { userId: '123' },
        }),
      );

      expect(console.info).toHaveBeenCalledTimes(2);
      const logMessage = (console.info as any).mock.calls[0][0];
      verifyLogFormat(logMessage, 'INFO', 'Test message with context', 'context.bundle', { userId: '123' });
    });

    it('should prioritize bundle info from context over __bundle property', () => {
      const bundleInfo: BundleHeader = {
        symbolicName: 'service.bundle',
        version: '1.0.0',
        id: '123',
        location: '/service/bundle/location',
      };
      (consoleLogService as any).__bundle = bundleInfo;

      const context = {
        __bundle: {
          symbolicName: 'context.bundle',
          version: '2.0.0',
          id: 456,
          location: '/context/bundle/location',
        },
        userId: '123',
      };
      consoleLogService.info('Test message with both', undefined, context);

      consoleLogService.addLogListener(mockListener);
      consoleLogService.info('Test message with both', undefined, context);
      expect(mockListener.logged).toHaveBeenCalledWith(
        expect.objectContaining({
          level: LogLevel.INFO,
          message: 'Test message with both',
          bundle: 'context.bundle',
          context: { userId: '123' },
        }),
      );

      expect(console.info).toHaveBeenCalledTimes(2);
      const logMessage = (console.info as any).mock.calls[0][0];
      verifyLogFormat(logMessage, 'INFO', 'Test message with both', 'context.bundle', { userId: '123' });
    });

    it('should not include bundle name in log messages when no bundle info is provided', () => {
      consoleLogService.info('Test message without bundle');

      consoleLogService.addLogListener(mockListener);
      consoleLogService.info('Test message without bundle');
      expect(mockListener.logged).toHaveBeenCalledWith(
        expect.objectContaining({
          level: LogLevel.INFO,
          message: 'Test message without bundle',
          bundle: undefined,
        }),
      );

      expect(console.info).toHaveBeenCalledTimes(2);
      const logMessage = (console.info as any).mock.calls[0][0];
      verifyLogFormat(logMessage, 'INFO', 'Test message without bundle');
    });
  });

  describe('log level filtering', () => {
    it('should respect log level filtering', () => {
      consoleLogService.setLogLevel(LogLevel.WARN);

      consoleLogService.addLogListener(mockListener);

      consoleLogService.debug('Debug message');
      consoleLogService.info('Info message');
      consoleLogService.warn('Warn message');
      consoleLogService.error('Error message');

      expect(mockListener.logged).toHaveBeenCalledTimes(2);
      expect(console.debug).not.toHaveBeenCalled();
      expect(console.info).not.toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenCalledTimes(1);

      const warnMessage = (console.warn as any).mock.calls[0][0];
      verifyLogFormat(warnMessage, 'WARN', 'Warn message');

      const errorMessage = (console.error as any).mock.calls[0][0];
      verifyLogFormat(errorMessage, 'ERROR', 'Error message');
    });

    it('should log all messages when log level is DEBUG', () => {
      consoleLogService.setLogLevel(LogLevel.DEBUG);

      consoleLogService.addLogListener(mockListener);

      consoleLogService.debug('Debug message');
      consoleLogService.info('Info message');
      consoleLogService.warn('Warn message');
      consoleLogService.error('Error message');

      expect(mockListener.logged).toHaveBeenCalledTimes(4);
      expect(console.debug).toHaveBeenCalledTimes(1);
      expect(console.info).toHaveBeenCalledTimes(1);
      expect(console.warn).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenCalledTimes(1);

      const debugMessage = (console.debug as any).mock.calls[0][0];
      verifyLogFormat(debugMessage, 'DEBUG', 'Debug message');

      const infoMessage = (console.info as any).mock.calls[0][0];
      verifyLogFormat(infoMessage, 'INFO', 'Info message');

      const warnMessage = (console.warn as any).mock.calls[0][0];
      verifyLogFormat(warnMessage, 'WARN', 'Warn message');

      const errorMessage = (console.error as any).mock.calls[0][0];
      verifyLogFormat(errorMessage, 'ERROR', 'Error message');
    });
  });

  describe('log listeners', () => {
    it('should notify all registered listeners', () => {
      const listener1 = { logged: vi.fn() };
      const listener2 = { logged: vi.fn() };

      consoleLogService.addLogListener(listener1);
      consoleLogService.addLogListener(listener2);

      const testMessage = 'Test message for multiple listeners';
      consoleLogService.info(testMessage);

      expect(listener1.logged).toHaveBeenCalledTimes(1);
      expect(listener2.logged).toHaveBeenCalledTimes(1);

      const logEntry = listener1.logged.mock.calls[0][0];
      expect(logEntry).toEqual(
        expect.objectContaining({
          level: LogLevel.INFO,
          message: testMessage,
          timestamp: expect.any(Number),
        }),
      );

      const logMessage = (console.info as any).mock.calls[0][0];
      verifyLogFormat(logMessage, 'INFO', testMessage);
    });

    it('should handle errors in listeners gracefully', () => {
      const errorListener = {
        logged: vi.fn().mockImplementation(() => {
          throw new Error('Listener error');
        }),
      };

      consoleLogService.addLogListener(errorListener);
      consoleLogService.addLogListener(mockListener);

      const testMessage = 'Test message with error listener';
      consoleLogService.info(testMessage);

      expect(errorListener.logged).toHaveBeenCalledTimes(1);
      expect(mockListener.logged).toHaveBeenCalledTimes(1);

      expect(console.error).toHaveBeenCalledWith('Error in log listener:', expect.any(Error));

      const logMessage = (console.info as any).mock.calls[0][0];
      verifyLogFormat(logMessage, 'INFO', testMessage);
    });

    it('should allow removing listeners', () => {
      const listener = { logged: vi.fn() };

      consoleLogService.addLogListener(listener);

      consoleLogService.info('First message');

      expect(listener.logged).toHaveBeenCalledTimes(1);

      consoleLogService.removeLogListener(listener);

      consoleLogService.info('Second message');

      expect(listener.logged).toHaveBeenCalledTimes(1);

      expect(console.info).toHaveBeenCalledTimes(2);

      const firstLogMessage = (console.info as any).mock.calls[0][0];
      verifyLogFormat(firstLogMessage, 'INFO', 'First message');

      const secondLogMessage = (console.info as any).mock.calls[1][0];
      verifyLogFormat(secondLogMessage, 'INFO', 'Second message');
    });
  });

  describe('context handling', () => {
    it('should include context in log messages when provided', () => {
      const context = { userId: '123', action: 'login' };
      const testMessage = 'Test message with context';
      consoleLogService.info(testMessage, undefined, context);

      consoleLogService.addLogListener(mockListener);
      consoleLogService.info(testMessage, undefined, context);
      expect(mockListener.logged).toHaveBeenCalledWith(
        expect.objectContaining({
          level: LogLevel.INFO,
          message: testMessage,
          context,
        }),
      );

      expect(console.info).toHaveBeenCalledTimes(2);
      const logMessage = (console.info as any).mock.calls[0][0];
      verifyLogFormat(logMessage, 'INFO', testMessage, undefined, context);
    });

    it('should not include empty context in log messages', () => {
      const testMessage = 'Test message with empty context';
      consoleLogService.info(testMessage, undefined, {});

      consoleLogService.addLogListener(mockListener);
      consoleLogService.info(testMessage, undefined, {});
      expect(mockListener.logged).toHaveBeenCalledWith(
        expect.objectContaining({
          level: LogLevel.INFO,
          message: testMessage,
          context: undefined,
        }),
      );

      expect(console.info).toHaveBeenCalledTimes(2);
      const logMessage = (console.info as any).mock.calls[0][0];
      verifyLogFormat(logMessage, 'INFO', testMessage);

      expect(logMessage).not.toContain('{}');
    });

    it('should handle complex context objects correctly', () => {
      const complexContext = {
        user: {
          id: '456',
          roles: ['admin', 'user'],
          settings: {
            theme: 'dark',
            notifications: true,
          },
        },
        session: {
          id: 'abc123',
          startTime: new Date().toISOString(),
          active: true,
        },
      };

      const testMessage = 'Test message with complex context';
      consoleLogService.info(testMessage, undefined, complexContext);

      consoleLogService.addLogListener(mockListener);
      consoleLogService.info(testMessage, undefined, complexContext);
      expect(mockListener.logged).toHaveBeenCalledWith(
        expect.objectContaining({
          level: LogLevel.INFO,
          message: testMessage,
          context: complexContext,
        }),
      );

      expect(console.info).toHaveBeenCalledTimes(2);
      const logMessage = (console.info as any).mock.calls[0][0];
      verifyLogFormat(logMessage, 'INFO', testMessage, undefined, complexContext);

      const contextJson = JSON.stringify(complexContext);
      expect(logMessage).toContain(contextJson);
    });
  });
});
