import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Bundle } from '../../../framework/interfaces';
import { BundleAwareLogService } from '../bundle-aware-log-service';
import { ConsoleLogService } from '../console-log-service';
import { DefaultLogServiceFactory } from '../log-service-factory';

describe('DefaultLogServiceFactory', () => {
  let factory: DefaultLogServiceFactory;
  let mockBundle: Bundle;

  beforeEach(() => {
    factory = new DefaultLogServiceFactory();

    mockBundle = {
      getBundleId: vi.fn().mockReturnValue(456),
      getSymbolicName: vi.fn().mockReturnValue('factory.test.bundle'),
      getVersion: vi.fn().mockReturnValue('2.0.0'),
      getLocation: vi.fn().mockReturnValue('/factory/test/location'),
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
  });

  it('should create a LogService instance', () => {
    const logService = factory.createLogService();

    expect(logService).toBeInstanceOf(ConsoleLogService);
    expect(logService).toBeDefined();
  });

  it('should create LogService with correct interface', () => {
    const logService = factory.createLogService();

    expect(typeof logService.log).toBe('function');
    expect(typeof logService.error).toBe('function');
    expect(typeof logService.warn).toBe('function');
    expect(typeof logService.info).toBe('function');
    expect(typeof logService.debug).toBe('function');
    expect(typeof logService.isLoggable).toBe('function');
    expect(typeof logService.setLogLevel).toBe('function');
    expect(typeof logService.getLogLevel).toBe('function');
  });

  it('should create new instances each time', () => {
    const logService1 = factory.createLogService();
    const logService2 = factory.createLogService();

    expect(logService1).not.toBe(logService2);
  });

  it('should create functional LogService instances', () => {
    const logService = factory.createLogService();

    expect(() => logService.info('test message')).not.toThrow();
    expect(logService.isLoggable(logService.getLogLevel())).toBe(true);
  });

  describe('bundle-aware logging', () => {
    it('should create a BundleAwareLogService instance', () => {
      const logService = factory.createBundleAwareLogService(mockBundle);

      expect(logService).toBeInstanceOf(BundleAwareLogService);
      expect(logService).toBeDefined();
    });

    it('should create bundle-aware LogService with correct interface', () => {
      const logService = factory.createBundleAwareLogService(mockBundle);

      expect(typeof logService.log).toBe('function');
      expect(typeof logService.error).toBe('function');
      expect(typeof logService.warn).toBe('function');
      expect(typeof logService.info).toBe('function');
      expect(typeof logService.debug).toBe('function');
      expect(typeof logService.isLoggable).toBe('function');
      expect(typeof logService.setLogLevel).toBe('function');
      expect(typeof logService.getLogLevel).toBe('function');
    });

    it('should create new bundle-aware instances each time', () => {
      const logService1 = factory.createBundleAwareLogService(mockBundle);
      const logService2 = factory.createBundleAwareLogService(mockBundle);

      expect(logService1).not.toBe(logService2);
    });

    it('should create functional bundle-aware LogService instances', () => {
      const logService = factory.createBundleAwareLogService(mockBundle);

      expect(() => logService.info('test message')).not.toThrow();
      expect(logService.isLoggable(logService.getLogLevel())).toBe(true);
    });

    it('should associate the correct bundle with the logger', () => {
      const logService = factory.createBundleAwareLogService(mockBundle) as BundleAwareLogService;

      const associatedBundle = logService.getBundle();
      expect(associatedBundle).toBe(mockBundle);
      expect(associatedBundle.getSymbolicName()).toBe('factory.test.bundle');
      expect(associatedBundle.getBundleId()).toBe(456);
    });
  });
});
