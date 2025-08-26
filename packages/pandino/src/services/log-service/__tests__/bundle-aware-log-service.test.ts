import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Bundle } from '../../../framework/interfaces';
import { BundleAwareLogService } from '../bundle-aware-log-service';
import { ConsoleLogService } from '../console-log-service';
import { LogLevel, type LogListener } from '../interfaces';

describe('BundleAwareLogService', () => {
  let mockBundle: Bundle;
  let baseLogService: ConsoleLogService;
  let bundleAwareLogService: BundleAwareLogService;
  let mockListener: LogListener;

  beforeEach(() => {
    mockBundle = {
      getBundleId: vi.fn().mockReturnValue(123),
      getSymbolicName: vi.fn().mockReturnValue('test.bundle'),
      getVersion: vi.fn().mockReturnValue('1.0.0'),
      getLocation: vi.fn().mockReturnValue('/test/bundle/location'),
      getState: vi.fn(),
      getHeaders: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      update: vi.fn(),
      uninstall: vi.fn(),
      getRegisteredServices: vi.fn(),
      getServicesInUse: vi.fn(),
      getContext: vi.fn(),
    } as unknown as Bundle;

    baseLogService = new ConsoleLogService();
    bundleAwareLogService = new BundleAwareLogService(baseLogService, mockBundle);

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

  describe('bundle metadata injection', () => {
    it('should automatically inject bundle metadata in log entries', () => {
      bundleAwareLogService.addLogListener(mockListener);

      bundleAwareLogService.info('Test message', undefined, { userId: '123' });

      expect(mockListener.logged).toHaveBeenCalledWith(
        expect.objectContaining({
          level: LogLevel.INFO,
          message: 'Test message',
          bundle: 'test.bundle',
          context: { userId: '123' },
        }),
      );
    });

    it('should inject bundle metadata even when no context is provided', () => {
      bundleAwareLogService.addLogListener(mockListener);

      bundleAwareLogService.error('Error message');

      expect(mockListener.logged).toHaveBeenCalledWith(
        expect.objectContaining({
          level: LogLevel.ERROR,
          message: 'Error message',
          bundle: 'test.bundle',
          context: undefined,
        }),
      );
    });

    it('should preserve existing context while adding bundle metadata', () => {
      bundleAwareLogService.addLogListener(mockListener);
      const context = { action: 'login', sessionId: 'abc123' };

      bundleAwareLogService.warn('User action', undefined, context);

      expect(mockListener.logged).toHaveBeenCalledWith(
        expect.objectContaining({
          level: LogLevel.WARN,
          message: 'User action',
          bundle: 'test.bundle',
          context: { action: 'login', sessionId: 'abc123' },
        }),
      );
    });

    it('should include bundle information in console output', () => {
      bundleAwareLogService.info('Bundle message');

      expect(console.info).toHaveBeenCalledWith(expect.stringContaining('[test.bundle] INFO: Bundle message'));
    });
  });

  describe('log level filtering with bundle awareness', () => {
    it('should respect log level filtering and not log filtered messages', () => {
      bundleAwareLogService.addLogListener(mockListener);
      bundleAwareLogService.setLogLevel(LogLevel.WARN);

      bundleAwareLogService.debug('Debug message');
      bundleAwareLogService.info('Info message');
      bundleAwareLogService.warn('Warn message');
      bundleAwareLogService.error('Error message');

      // Only WARN and ERROR should be logged
      expect(mockListener.logged).toHaveBeenCalledTimes(2);
      expect(mockListener.logged).toHaveBeenCalledWith(
        expect.objectContaining({
          level: LogLevel.WARN,
          bundle: 'test.bundle',
        }),
      );
      expect(mockListener.logged).toHaveBeenCalledWith(
        expect.objectContaining({
          level: LogLevel.ERROR,
          bundle: 'test.bundle',
        }),
      );
    });

    it('should not inject bundle metadata for filtered messages', () => {
      bundleAwareLogService.addLogListener(mockListener);
      bundleAwareLogService.setLogLevel(LogLevel.ERROR);

      bundleAwareLogService.debug('Debug message');
      bundleAwareLogService.info('Info message');
      bundleAwareLogService.warn('Warn message');

      // No messages should be logged due to level filtering
      expect(mockListener.logged).not.toHaveBeenCalled();
      expect(console.debug).not.toHaveBeenCalled();
      expect(console.info).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
    });
  });

  describe('delegation to wrapped service', () => {
    it('should delegate log level management to wrapped service', () => {
      expect(bundleAwareLogService.getLogLevel()).toBe(LogLevel.INFO);

      bundleAwareLogService.setLogLevel(LogLevel.DEBUG);
      expect(bundleAwareLogService.getLogLevel()).toBe(LogLevel.DEBUG);
      expect(baseLogService.getLogLevel()).toBe(LogLevel.DEBUG);
    });

    it('should delegate isLoggable checks to wrapped service', () => {
      bundleAwareLogService.setLogLevel(LogLevel.WARN);

      expect(bundleAwareLogService.isLoggable(LogLevel.ERROR)).toBe(true);
      expect(bundleAwareLogService.isLoggable(LogLevel.WARN)).toBe(true);
      expect(bundleAwareLogService.isLoggable(LogLevel.INFO)).toBe(false);
      expect(bundleAwareLogService.isLoggable(LogLevel.DEBUG)).toBe(false);
    });

    it('should delegate listener management to wrapped service', () => {
      bundleAwareLogService.addLogListener(mockListener);
      bundleAwareLogService.info('Test message');

      expect(mockListener.logged).toHaveBeenCalledTimes(1);

      bundleAwareLogService.removeLogListener(mockListener);
      bundleAwareLogService.info('Another message');

      // Should still be 1 since listener was removed
      expect(mockListener.logged).toHaveBeenCalledTimes(1);
    });
  });

  describe('bundle access', () => {
    it('should provide access to the associated bundle', () => {
      const bundle = bundleAwareLogService.getBundle();

      expect(bundle).toBe(mockBundle);
      expect(bundle.getSymbolicName()).toBe('test.bundle');
      expect(bundle.getBundleId()).toBe(123);
    });
  });

  describe('error handling', () => {
    it('should handle exceptions in log entries with bundle information', () => {
      bundleAwareLogService.addLogListener(mockListener);
      const error = new Error('Test error');

      bundleAwareLogService.error('Operation failed', error, { operation: 'save' });

      expect(mockListener.logged).toHaveBeenCalledWith(
        expect.objectContaining({
          level: LogLevel.ERROR,
          message: 'Operation failed',
          bundle: 'test.bundle',
          exception: error,
          context: { operation: 'save' },
        }),
      );
    });
  });
});
