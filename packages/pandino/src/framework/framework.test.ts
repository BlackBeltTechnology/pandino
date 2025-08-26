import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BundleActivator, BundleListener, ServiceListener } from './interfaces';
import { ConsoleLogService, type LogService } from '../services/log-service';
import { LogLevel } from '../services/log-service';
import type { BundleModule } from '../types/bundle-metadata';
import { BUNDLE_STATES, SERVICE_EVENT_TYPES } from '../types/constants';
import { OSGiFramework } from './framework';

function createBundleModule(
  symbolicName: string = 'test.bundle',
  version: string = '1.0.0',
  options: {
    bundleName?: string;
    bundleDescription?: string;
    bundleManifestVersion?: string;
    [key: string]: any;
  } = {},
  activator: BundleActivator = {
    start: vi.fn(),
    stop: vi.fn(),
  },
): Promise<BundleModule> {
  return Promise.resolve({
    default: {
      headers: {
        bundleSymbolicName: symbolicName,
        bundleVersion: version,
        bundleName: options.bundleName,
        bundleDescription: options.bundleDescription,
        bundleManifestVersion: options.bundleManifestVersion,
        ...Object.entries(options)
          .filter(([key]) => !['bundleName', 'bundleDescription', 'bundleManifestVersion'].includes(key))
          .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {}),
      },
      activator,
    },
  });
}

describe('OSGiFramework', () => {
  let framework: OSGiFramework;
  let mockLogService: LogService;

  beforeEach(() => {
    framework = new OSGiFramework();

    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'debug').mockImplementation(() => {});

    mockLogService = {
      log: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
      debug: vi.fn(),
      isLoggable: vi.fn().mockReturnValue(true),
      setLogLevel: vi.fn(),
      getLogLevel: vi.fn().mockReturnValue(LogLevel.INFO),
      addLogListener: vi.fn(),
      removeLogListener: vi.fn(),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('lifecycle', () => {
    it('should start and initialize system bundle', async () => {
      await framework.start();

      const systemBundle = framework.getBundle(0);
      expect(systemBundle).toBeDefined();
      expect(systemBundle?.getBundleId()).toBe(0);
      expect(systemBundle?.getState()).toBe(BUNDLE_STATES.ACTIVE);
    });

    it('should stop and cleanup', async () => {
      await framework.start();
      await framework.stop();

      const bundles = framework.getBundles();
      expect(
        bundles.every((bundle) => bundle.getState() === BUNDLE_STATES.UNINSTALLED || bundle.getBundleId() === 0),
      ).toBe(true);
    });
  });

  describe('bundle management', () => {
    beforeEach(async () => {
      await framework.start();
    });

    it('should install bundle', async () => {
      const bundle = await framework.installBundle(createBundleModule());

      expect(bundle.getBundleId()).toBeGreaterThan(0);
      expect(bundle.getState()).toBe(BUNDLE_STATES.RESOLVED);
      expect(bundle.getLocation()).toContain(bundle.getSymbolicName());
    });

    it('should start installed bundle', async () => {
      const bundle = await framework.installBundle(createBundleModule());
      await bundle.start();

      expect(bundle.getState()).toBe(BUNDLE_STATES.ACTIVE);
    });

    it('should stop active bundle', async () => {
      const bundle = await framework.installBundle(createBundleModule());
      await bundle.start();
      await bundle.stop();

      expect(bundle.getState()).toBe(BUNDLE_STATES.RESOLVED);
    });

    it('should uninstall bundle', async () => {
      const bundle = await framework.installBundle(createBundleModule());
      const bundleId = bundle.getBundleId();
      await bundle.uninstall();

      expect(() => bundle.getState()).toThrow(`Bundle ${bundleId} has been uninstalled`);
      expect(framework.getBundle(bundleId)).toBeNull();
    });

    it('should get bundle by id', async () => {
      const bundle = await framework.installBundle(createBundleModule());
      const retrieved = framework.getBundle(bundle.getBundleId());

      expect(retrieved).toBe(bundle);
    });

    it('should return null for non-existent bundle id', () => {
      const bundle = framework.getBundle(999);
      expect(bundle).toBeNull();
    });
  });

  describe('service registry', () => {
    beforeEach(async () => {
      await framework.start();
    });

    it('should register service', () => {
      const context = framework.getBundleContext();
      const service = { test: 'service' };

      const registration = context.registerService('TestService', service);

      expect(registration).toBeDefined();
      expect(registration.getReference()).toBeDefined();
    });

    it('should find registered service', () => {
      const context = framework.getBundleContext();
      const service = { test: 'service' };

      context.registerService('TestService', service);
      const ref = context.getServiceReference('TestService');

      expect(ref).toBeDefined();
      expect(ref?.getProperty('objectClass')).toBe('TestService');
    });

    it('should get service from reference', () => {
      const context = framework.getBundleContext();
      const service = { test: 'service' };

      context.registerService('TestService', service);
      const ref = context.getServiceReference('TestService');
      const retrieved = context.getService(ref!);

      expect(retrieved).toBe(service);
    });

    it('should unregister service', () => {
      const context = framework.getBundleContext();
      const service = { test: 'service' };

      const registration = context.registerService('TestService', service);
      registration.unregister();

      const ref = context.getServiceReference('TestService');
      expect(ref).toBeNull();
    });

    it('should filter services by LDAP filter', () => {
      const context = framework.getBundleContext();

      context.registerService('TestService', {}, { version: '1.0' });
      context.registerService('TestService', {}, { version: '2.0' });

      const refs = context.getServiceReferences('TestService', '(version>=1.5)');

      expect(refs).toHaveLength(1);
      expect(refs![0].getProperty('version')).toBe('2.0');
    });
  });

  describe('bundle context invalidation', () => {
    beforeEach(async () => {
      await framework.start();
    });

    it('should invalidate bundle context when bundle is stopped', async () => {
      const bundle = await framework.installBundle(createBundleModule());
      await bundle.start();

      const context = bundle.getContext();

      expect(() => context.getBundle()).not.toThrow();

      await bundle.stop();

      expect(() => context.getBundle()).toThrow('BundleContext is no longer valid');
    });

    it('should prevent service registration on invalidated context', async () => {
      const bundle = await framework.installBundle(createBundleModule());
      await bundle.start();

      const context = bundle.getContext();

      await bundle.stop();

      expect(() => {
        context.registerService('TestService', {});
      }).toThrow('BundleContext is no longer valid');
    });

    it('should prevent service lookup on invalidated context', async () => {
      const bundle = await framework.installBundle(createBundleModule());
      await bundle.start();

      const context = bundle.getContext();

      await bundle.stop();

      expect(() => {
        context.getServiceReference('TestService');
      }).toThrow('BundleContext is no longer valid');
    });

    it('should prevent bundle operations on invalidated context', async () => {
      const bundle = await framework.installBundle(createBundleModule());
      await bundle.start();

      const context = bundle.getContext();

      await bundle.stop();

      await expect(context.installBundle(createBundleModule('another.bundle'))).rejects.toThrow(
        'BundleContext is no longer valid',
      );
    });

    it('should clear service listeners when context is invalidated', async () => {
      const bundle = await framework.installBundle(createBundleModule());
      await bundle.start();

      const context = bundle.getContext();
      const serviceListener: ServiceListener = {
        serviceChanged: vi.fn(),
      };

      context.addServiceListener(serviceListener);

      await bundle.stop();

      const mainContext = framework.getBundleContext();
      mainContext.registerService('TestService', {});

      expect(serviceListener.serviceChanged).not.toHaveBeenCalled();
    });

    it('should clear bundle listeners when context is invalidated', async () => {
      const bundle = await framework.installBundle(createBundleModule());
      await bundle.start();

      const context = bundle.getContext();
      const bundleListener: BundleListener = {
        bundleChanged: vi.fn(),
      };

      context.addBundleListener(bundleListener);

      await bundle.stop();

      await framework.installBundle(createBundleModule('another.bundle'));

      expect(bundleListener.bundleChanged).not.toHaveBeenCalled();
    });

    it('should prevent listener management on invalidated context', async () => {
      const bundle = await framework.installBundle(createBundleModule());
      await bundle.start();

      const context = bundle.getContext();

      await bundle.stop();

      const serviceListener: ServiceListener = {
        serviceChanged: vi.fn(),
      };

      expect(() => {
        context.addServiceListener(serviceListener);
      }).toThrow('BundleContext is no longer valid');

      expect(() => {
        context.removeServiceListener(serviceListener);
      }).toThrow('BundleContext is no longer valid');
    });

    it('should prevent property access on invalidated context', async () => {
      const bundle = await framework.installBundle(createBundleModule());
      await bundle.start();

      const context = bundle.getContext();

      await bundle.stop();

      expect(() => {
        context.getProperty('test.property');
      }).toThrow('BundleContext is no longer valid');
    });

    it('should prevent filter creation on invalidated context', async () => {
      const bundle = await framework.installBundle(createBundleModule());
      await bundle.start();

      const context = bundle.getContext();

      await bundle.stop();

      expect(() => {
        context.createFilter('(test=value)');
      }).toThrow('BundleContext is no longer valid');
    });

    it('should handle multiple stop calls gracefully', async () => {
      const bundle = await framework.installBundle(createBundleModule());
      await bundle.start();

      const context = bundle.getContext();

      await bundle.stop();
      await bundle.stop();
      await bundle.stop();

      expect(() => context.getBundle()).toThrow('BundleContext is no longer valid');
    });

    it('should invalidate context after bundle uninstall', async () => {
      const bundle = await framework.installBundle(createBundleModule());
      await bundle.start();

      const context = bundle.getContext();

      await bundle.uninstall();

      expect(() => context.getBundle()).toThrow('BundleContext is no longer valid');
    });
  });

  describe('event handling', () => {
    beforeEach(async () => {
      await framework.start();
    });

    it('should fire service events', () => {
      const context = framework.getBundleContext();
      const listener: ServiceListener = {
        serviceChanged: vi.fn(),
      };

      context.addServiceListener(listener);
      context.registerService('TestService', {});

      expect(listener.serviceChanged).toHaveBeenCalledWith(
        expect.objectContaining({
          type: SERVICE_EVENT_TYPES.REGISTERED,
        }),
      );
    });

    it('should fire bundle events', async () => {
      const context = framework.getBundleContext();
      const listener: BundleListener = {
        bundleChanged: vi.fn(),
      };

      context.addBundleListener(listener);
      const _bundle = await framework.installBundle(createBundleModule());

      expect(listener.bundleChanged).toHaveBeenCalled();
    });

    it('should remove listeners', () => {
      const context = framework.getBundleContext();
      const listener: ServiceListener = {
        serviceChanged: vi.fn(),
      };

      context.addServiceListener(listener);
      context.removeServiceListener(listener);
      context.registerService('TestService', {});

      expect(listener.serviceChanged).not.toHaveBeenCalled();
    });
  });

  describe('no default log service', () => {
    beforeEach(async () => {
      await framework.start();
    });

    it('should not have default LogService registered', () => {
      const context = framework.getBundleContext();
      const serviceRef = context.getServiceReference<LogService>('LogService');

      expect(serviceRef).toBeNull();
    });

    it('should return null when no LogService is available', () => {
      const context = framework.getBundleContext();
      const logService = context.getLogService();

      expect(logService).toBeNull();
    });

    it('should allow registration of LogService through service registry', () => {
      const context = framework.getBundleContext();
      const consoleLogService = new ConsoleLogService();

      const registration = context.registerService('LogService', consoleLogService, {
        'service.ranking': 100,
        'service.description': 'Console Log Service',
      });

      expect(registration).toBeDefined();
      expect(registration.getReference().getProperty('objectClass')).toBe('LogService');
    });
  });

  describe('log service registration', () => {
    beforeEach(async () => {
      await framework.start();
    });

    it('should register ConsoleLogService as LogService', () => {
      const context = framework.getBundleContext();
      const consoleLogService = new ConsoleLogService();

      const _registration = context.registerService('LogService', consoleLogService, {
        'service.ranking': 100,
      });

      const serviceRef = context.getServiceReference<LogService>('LogService');
      expect(serviceRef).toBeDefined();
      expect(serviceRef?.getProperty('objectClass')).toBe('LogService');
      expect(serviceRef?.getProperty('service.ranking')).toBe(100);

      const retrievedService = context.getService(serviceRef!);
      expect(retrievedService).toBe(consoleLogService);
    });

    it('should make registered LogService available through BundleContext', () => {
      const context = framework.getBundleContext();
      const consoleLogService = new ConsoleLogService();

      context.registerService('LogService', consoleLogService);

      const logService = context.getLogService();
      expect(logService).toBe(consoleLogService);
    });

    it('should notify service listeners when LogService is registered', () => {
      const context = framework.getBundleContext();
      const serviceListener: ServiceListener = {
        serviceChanged: vi.fn(),
      };

      context.addServiceListener(serviceListener, '(objectClass=LogService)');

      const consoleLogService = new ConsoleLogService();
      context.registerService('LogService', consoleLogService);

      expect(serviceListener.serviceChanged).toHaveBeenCalledWith(
        expect.objectContaining({
          type: SERVICE_EVENT_TYPES.REGISTERED,
        }),
      );
    });
  });

  describe('service ranking', () => {
    beforeEach(async () => {
      await framework.start();
    });

    it('should prioritize LogService with higher ranking', () => {
      const context = framework.getBundleContext();

      const lowRankingLogService = new ConsoleLogService();
      const highRankingLogService = new ConsoleLogService();

      context.registerService('LogService', lowRankingLogService, { 'service.ranking': 100 });
      context.registerService('LogService', highRankingLogService, { 'service.ranking': 200 });

      const serviceRef = context.getServiceReference<LogService>('LogService');
      const retrievedService = context.getService(serviceRef!);

      expect(retrievedService).toBe(highRankingLogService);
      expect(serviceRef?.getProperty('service.ranking')).toBe(200);
    });

    it('should fall back to lower ranking service when higher ranking is unregistered', () => {
      const context = framework.getBundleContext();

      const lowRankingLogService = new ConsoleLogService();
      const highRankingLogService = new ConsoleLogService();

      context.registerService('LogService', lowRankingLogService, { 'service.ranking': 100 });
      const highRankingRegistration = context.registerService('LogService', highRankingLogService, {
        'service.ranking': 200,
      });

      highRankingRegistration.unregister();

      const serviceRef = context.getServiceReference<LogService>('LogService');
      const retrievedService = context.getService(serviceRef!);

      expect(retrievedService).toBe(lowRankingLogService);
      expect(serviceRef?.getProperty('service.ranking')).toBe(100);
    });
  });

  describe('bundle context integration', () => {
    beforeEach(async () => {
      await framework.start();
    });

    it('should handle multiple LogService registrations', () => {
      const context = framework.getBundleContext();

      const logService1 = new ConsoleLogService();
      const logService2 = new ConsoleLogService();
      const logService3 = new ConsoleLogService();

      context.registerService('LogService', logService1, { 'service.ranking': 100 });
      context.registerService('LogService', logService2, { 'service.ranking': 200 });
      context.registerService('LogService', logService3, { 'service.ranking': 150 });

      const serviceRefs = context.getServiceReferences<LogService>('LogService');
      expect(serviceRefs).toHaveLength(3);

      const topServiceRef = context.getServiceReference<LogService>('LogService');
      const topService = context.getService(topServiceRef!);
      expect(topService).toBe(logService2);
    });

    it('should support bundle registering LogService during activation', async () => {
      const bundle = await framework.installBundle(createBundleModule('log.provider'));
      const bundleContext = bundle.getContext();

      const customLogService = new ConsoleLogService();
      const registration = bundleContext.registerService('LogService', customLogService, { 'service.ranking': 150 });

      const mainContext = framework.getBundleContext();
      const serviceRef = mainContext.getServiceReference<LogService>('LogService');
      const retrievedService = mainContext.getService(serviceRef!);

      expect(retrievedService).toBe(customLogService);
      expect(registration.getReference().getProperty('service.ranking')).toBe(150);
    });
  });

  describe('error handling', () => {
    beforeEach(async () => {
      await framework.start();
    });

    it('should handle LogService method calls gracefully when service is available', () => {
      const context = framework.getBundleContext();
      const consoleLogService = new ConsoleLogService();

      context.registerService('LogService', consoleLogService);
      const logService = context.getLogService();

      expect(() => {
        logService?.info('test message');
        logService?.error('test error', new Error('test'));
        logService?.debug('test debug', undefined, { key: 'value' });
      }).not.toThrow();
    });

    it('should handle null LogService gracefully', () => {
      const context = framework.getBundleContext();
      const logService = context.getLogService();

      expect(logService).toBeNull();

      expect(() => {
        logService?.info('test message');
        logService?.error('test error');
      }).not.toThrow();
    });
  });

  describe('framework modularity', () => {
    beforeEach(async () => {
      await framework.start();
    });

    it('should start framework without any log service', async () => {
      const newFramework = new OSGiFramework();

      expect(() => newFramework.start()).not.toThrow();

      const context = newFramework.getBundleContext();
      expect(context.getLogService()).toBeNull();
    });

    it('should allow developers to choose their logging implementation', () => {
      const context = framework.getBundleContext();

      const customLogService = mockLogService;
      const registration = context.registerService('LogService', customLogService, {
        'service.ranking': 300,
        'service.description': 'Custom Log Service',
      });

      const retrievedService = context.getLogService();
      expect(retrievedService).toBe(customLogService);
      expect(registration.getReference().getProperty('service.description')).toBe('Custom Log Service');
    });
  });

  describe('factory services', () => {
    beforeEach(async () => {
      await framework.start();
    });

    it('should register and identify factory services', () => {
      const context = framework.getBundleContext();
      const factory = {
        getService: vi.fn().mockReturnValue({ data: 'test' }),
        ungetService: vi.fn(),
      };

      const registration = context.registerService('TestService', factory);
      const serviceRef = context.getServiceReference('TestService');

      expect(serviceRef?.getProperty('service.factory')).toBe(true);
      expect(registration.getReference().getProperty('service.factory')).toBe(true);
    });

    it('should create separate instances for different bundles', async () => {
      const context = framework.getBundleContext();
      const factory = {
        getService: vi.fn().mockImplementation((bundle) => ({
          bundleId: bundle.getBundleId(),
          data: `service-for-${bundle.getBundleId()}`,
        })),
        ungetService: vi.fn(),
      };

      context.registerService('TestService', factory);
      const serviceRef = context.getServiceReference('TestService')!;

      const bundle1 = await framework.installBundle(createBundleModule('bundle1'));
      const bundle2 = await framework.installBundle(createBundleModule('bundle2'));

      const service1 = bundle1.getContext().getService(serviceRef);
      const service2 = bundle2.getContext().getService(serviceRef);

      expect(factory.getService).toHaveBeenCalledTimes(2);
      expect(service1).toEqual({ bundleId: bundle1.getBundleId(), data: `service-for-${bundle1.getBundleId()}` });
      expect(service2).toEqual({ bundleId: bundle2.getBundleId(), data: `service-for-${bundle2.getBundleId()}` });
      expect(service1).not.toBe(service2);
    });

    it('should pass correct bundle and registration to factory methods', async () => {
      const context = framework.getBundleContext();
      const factory = {
        getService: vi.fn().mockReturnValue({ test: 'service' }),
        ungetService: vi.fn(),
      };

      const registration = context.registerService('TestService', factory);
      const serviceRef = context.getServiceReference('TestService')!;

      const bundle = await framework.installBundle(createBundleModule());
      const bundleContext = bundle.getContext();

      bundleContext.getService(serviceRef);

      expect(factory.getService).toHaveBeenCalledWith(bundle, registration);
    });

    it('should reuse same instance for same bundle', async () => {
      const context = framework.getBundleContext();
      const factory = {
        getService: vi.fn().mockReturnValue({ data: 'test' }),
        ungetService: vi.fn(),
      };

      context.registerService('TestService', factory);
      const serviceRef = context.getServiceReference('TestService')!;

      const bundle = await framework.installBundle(createBundleModule());
      const bundleContext = bundle.getContext();

      const service1 = bundleContext.getService(serviceRef);
      const service2 = bundleContext.getService(serviceRef);

      expect(factory.getService).toHaveBeenCalledTimes(1);
      expect(service1).toBe(service2);
    });

    it('should handle cross-bundle service access', async () => {
      const bundle1 = await framework.installBundle(createBundleModule('provider'));
      const bundle2 = await framework.installBundle(createBundleModule('consumer'));

      const providerContext = bundle1.getContext();
      const consumerContext = bundle2.getContext();

      const factory = {
        getService: vi.fn().mockImplementation((bundle) => ({
          providedTo: bundle.getBundleId(),
          data: `service-for-bundle-${bundle.getBundleId()}`,
        })),
        ungetService: vi.fn(),
      };

      const registration = providerContext.registerService('CrossBundleService', factory);

      const serviceRef = consumerContext.getServiceReference('CrossBundleService')!;
      const service = consumerContext.getService(serviceRef);

      expect(factory.getService).toHaveBeenCalledWith(bundle2, registration);
      expect(service).toEqual({
        providedTo: bundle2.getBundleId(),
        data: `service-for-bundle-${bundle2.getBundleId()}`,
      });
    });

    it('should create different instances for different consuming bundles', async () => {
      const provider = await framework.installBundle(createBundleModule('provider'));
      const consumer1 = await framework.installBundle(createBundleModule('consumer1'));
      const consumer2 = await framework.installBundle(createBundleModule('consumer2'));

      const providerContext = provider.getContext();
      const consumer1Context = consumer1.getContext();
      const consumer2Context = consumer2.getContext();

      const factory = {
        getService: vi.fn().mockImplementation((bundle) => ({
          forBundle: bundle.getBundleId(),
          timestamp: Date.now(),
        })),
        ungetService: vi.fn(),
      };

      providerContext.registerService('UniqueService', factory);

      const service1 = consumer1Context.getService(consumer1Context.getServiceReference('UniqueService')!) as {
        forBundle: number;
        timestamp: number;
      };
      const service2 = consumer2Context.getService(consumer2Context.getServiceReference('UniqueService')!) as {
        forBundle: number;
        timestamp: number;
      };

      expect(factory.getService).toHaveBeenCalledTimes(2);
      expect(service1?.forBundle).toBe(consumer1.getBundleId());
      expect(service2?.forBundle).toBe(consumer2.getBundleId());
      expect(service1).not.toBe(service2);
    });

    it('should call ungetService when bundle stops', async () => {
      const context = framework.getBundleContext();
      const factory = {
        getService: vi.fn().mockReturnValue({ data: 'test' }),
        ungetService: vi.fn(),
      };

      const registration = context.registerService('TestService', factory);
      const serviceRef = context.getServiceReference('TestService')!;

      const bundle = await framework.installBundle(createBundleModule());
      await bundle.start();

      const bundleContext = bundle.getContext();
      const service = bundleContext.getService(serviceRef);

      await bundle.stop();

      expect(factory.ungetService).toHaveBeenCalledWith(bundle, registration, service);
    });

    it('should handle factory service unregistration', async () => {
      const context = framework.getBundleContext();
      const factory = {
        getService: vi.fn().mockReturnValue({ data: 'test' }),
        ungetService: vi.fn(),
      };

      const registration = context.registerService('TestService', factory);
      const serviceRef = context.getServiceReference('TestService')!;

      const bundle = await framework.installBundle(createBundleModule());
      const bundleContext = bundle.getContext();

      bundleContext.getService(serviceRef);

      registration.unregister();

      expect(bundleContext.getServiceReference('TestService')).toBeNull();
      expect(bundleContext.getService(serviceRef)).toBeNull();
    });

    it('should handle factory service exceptions gracefully', async () => {
      const context = framework.getBundleContext();
      const factory = {
        getService: vi.fn().mockImplementation(() => {
          throw new Error('Factory error');
        }),
        ungetService: vi.fn(),
      };

      context.registerService('TestService', factory);
      const serviceRef = context.getServiceReference('TestService')!;

      const bundle = await framework.installBundle(createBundleModule());
      const bundleContext = bundle.getContext();

      expect(() => bundleContext.getService(serviceRef)).toThrow('Factory error');
    });

    it('should support factory service ranking', () => {
      const context = framework.getBundleContext();

      const factory1 = {
        getService: vi.fn().mockReturnValue({ priority: 'low' }),
        ungetService: vi.fn(),
      };

      const factory2 = {
        getService: vi.fn().mockReturnValue({ priority: 'high' }),
        ungetService: vi.fn(),
      };

      context.registerService('TestService', factory1, { 'service.ranking': 100 });
      context.registerService('TestService', factory2, { 'service.ranking': 200 });

      const serviceRef = context.getServiceReference('TestService')!;
      const service = context.getService(serviceRef);

      expect(service).toEqual({ priority: 'high' });
      expect(serviceRef.getProperty('service.ranking')).toBe(200);
    });

    it('should handle mixed singleton and factory services', () => {
      const context = framework.getBundleContext();

      const singletonService = { type: 'singleton' };
      const factory = {
        getService: vi.fn().mockReturnValue({ type: 'factory' }),
        ungetService: vi.fn(),
      };

      context.registerService('TestService', singletonService, { 'service.ranking': 100 });
      context.registerService('TestService', factory, { 'service.ranking': 200 });

      const refs = context.getServiceReferences('TestService');
      expect(refs).toHaveLength(2);

      const topRef = refs![0];
      const service = context.getService(topRef);

      expect(service).toEqual({ type: 'factory' });
      expect(topRef.getProperty('service.factory')).toBe(true);
    });

    it('should track factory service instances per bundle correctly', async () => {
      const context = framework.getBundleContext();
      const createdInstances = new Map<number, any>();

      const factory = {
        getService: vi.fn().mockImplementation((bundle) => {
          const instance = { bundleId: bundle.getBundleId(), created: Date.now() };
          createdInstances.set(bundle.getBundleId(), instance);
          return instance;
        }),
        ungetService: vi.fn().mockImplementation((bundle) => {
          createdInstances.delete(bundle.getBundleId());
        }),
      };

      context.registerService('TestService', factory);
      const serviceRef = context.getServiceReference('TestService')!;

      const bundle1 = await framework.installBundle(createBundleModule('bundle1'));
      const bundle2 = await framework.installBundle(createBundleModule('bundle2'));

      const service1a = bundle1.getContext().getService(serviceRef);
      const service1b = bundle1.getContext().getService(serviceRef);
      const service2 = bundle2.getContext().getService(serviceRef);

      expect(service1a).toBe(service1b); // Same bundle, same instance
      expect(service1a).not.toBe(service2); // Different bundles, different instances
      expect(createdInstances.size).toBe(2);
      expect(createdInstances.get(bundle1.getBundleId())).toBe(service1a);
      expect(createdInstances.get(bundle2.getBundleId())).toBe(service2);
    });

    it('should handle service factory with bundle lifecycle', async () => {
      const context = framework.getBundleContext();
      const factory = {
        getService: vi.fn().mockImplementation((bundle) => ({
          bundleId: bundle.getBundleId(),
          cleanup: vi.fn(),
        })),
        ungetService: vi.fn().mockImplementation((_bundle, _registration, service) => {
          service.cleanup();
        }),
      };

      context.registerService('TestService', factory);
      const serviceRef = context.getServiceReference('TestService')!;

      const bundle = await framework.installBundle(createBundleModule());
      await bundle.start();

      const bundleContext = bundle.getContext();
      const service = bundleContext.getService<{ bundleId: number; cleanup: () => void }>(serviceRef);

      expect(factory.getService).toHaveBeenCalledWith(bundle, expect.any(Object));
      expect(service?.bundleId).toBe(bundle.getBundleId());

      await bundle.stop();

      expect(factory.ungetService).toHaveBeenCalledWith(bundle, expect.any(Object), service);
      expect(service?.cleanup).toHaveBeenCalled();
    });

    it('should handle multiple service factories for same interface', async () => {
      const context = framework.getBundleContext();

      const factory1 = {
        getService: vi.fn().mockReturnValue({ provider: 'factory1' }),
        ungetService: vi.fn(),
      };

      const factory2 = {
        getService: vi.fn().mockReturnValue({ provider: 'factory2' }),
        ungetService: vi.fn(),
      };

      context.registerService('TestService', factory1, { 'service.ranking': 100 });
      context.registerService('TestService', factory2, { 'service.ranking': 200 });

      const bundle = await framework.installBundle(createBundleModule());
      const bundleContext = bundle.getContext();

      const refs = bundleContext.getServiceReferences('TestService');
      expect(refs).toHaveLength(2);

      const highestRankingService = bundleContext.getService(refs![0]);
      const lowerRankingService = bundleContext.getService(refs![1]);

      expect(highestRankingService).toEqual({ provider: 'factory2' });
      expect(lowerRankingService).toEqual({ provider: 'factory1' });
      expect(factory1.getService).toHaveBeenCalledWith(bundle, expect.any(Object));
      expect(factory2.getService).toHaveBeenCalledWith(bundle, expect.any(Object));
    });

    it('should handle service factory properties modification', async () => {
      const context = framework.getBundleContext();
      const factory = {
        getService: vi.fn().mockReturnValue({ data: 'test' }),
        ungetService: vi.fn(),
      };

      const registration = context.registerService('TestService', factory, {
        'service.ranking': 100,
        'custom.prop': 'initial',
      });

      const bundle = await framework.installBundle(createBundleModule());
      const bundleContext = bundle.getContext();

      const service = bundleContext.getService(registration.getReference());
      expect(service).toBeDefined();

      const serviceListener: ServiceListener = {
        serviceChanged: vi.fn(),
      };
      bundleContext.addServiceListener(serviceListener);

      registration.setProperties({
        'service.ranking': 200,
        'custom.prop': 'modified',
        'service.factory': true, // Ensure factory property is preserved
      });

      expect(serviceListener.serviceChanged).toHaveBeenCalledWith(
        expect.objectContaining({
          type: SERVICE_EVENT_TYPES.MODIFIED,
        }),
      );

      const event = (serviceListener.serviceChanged as unknown as { mock: { calls: any[][] } }).mock.calls[0][0];
      expect(event.getServiceReference()).toBe(registration.getReference());

      const updatedRef = registration.getReference();
      expect(updatedRef.getProperty('custom.prop')).toBe('modified');
      expect(updatedRef.getProperty('service.ranking')).toBe(200);
      expect(updatedRef.getProperty('service.factory')).toBe(true);
    });
  });

  describe('bundle headers', () => {
    beforeEach(async () => {
      await framework.start();
    });

    it('should preserve custom bundle headers', async () => {
      const customHeaders = {
        bundleName: 'Test Bundle Name',
        bundleDescription: 'Test bundle description',
        bundleManifestVersion: '2.0',
        customProperty: 'custom value',
      };

      const bundle = await framework.installBundle(createBundleModule('test.custom.headers', '1.2.3', customHeaders));

      const headers = bundle.getHeaders();

      // Standard OSGi headers should be present with hyphenated names
      expect(headers['Bundle-SymbolicName']).toBe('test.custom.headers');
      expect(headers['Bundle-Version']).toBe('1.2.3');
      expect(headers['Bundle-Activator']).toBe('');

      // Custom headers should be preserved with camelCase names
      expect(headers['bundleName']).toBe('Test Bundle Name');
      expect(headers['bundleDescription']).toBe('Test bundle description');
      expect(headers['bundleManifestVersion']).toBe('2.0');
      expect(headers['customProperty']).toBe('custom value');
    });

    it('should handle bundles with only standard headers', async () => {
      const bundle = await framework.installBundle(createBundleModule('test.standard.only', '0.1.0'));

      const headers = bundle.getHeaders();

      // Standard headers should be present
      expect(headers['Bundle-SymbolicName']).toBe('test.standard.only');
      expect(headers['Bundle-Version']).toBe('0.1.0');
      expect(headers['Bundle-Activator']).toBe('');

      // Custom headers should not be present
      expect(headers['bundleName']).toBeUndefined();
      expect(headers['bundleDescription']).toBeUndefined();
      expect(headers['bundleManifestVersion']).toBeUndefined();
    });

    it('should handle bundles with partial custom headers', async () => {
      const bundle = await framework.installBundle(
        createBundleModule('test.partial', '2.0.0', {
          bundleName: 'Partial Bundle',
          // bundleDescription intentionally omitted
          bundleManifestVersion: '1.0',
        }),
      );

      const headers = bundle.getHeaders();

      // Standard headers
      expect(headers['Bundle-SymbolicName']).toBe('test.partial');
      expect(headers['Bundle-Version']).toBe('2.0.0');

      // Present custom headers
      expect(headers['bundleName']).toBe('Partial Bundle');
      expect(headers['bundleManifestVersion']).toBe('1.0');

      // Missing custom headers should be undefined
      expect(headers['bundleDescription']).toBeUndefined();
    });

    it('should handle empty string values in custom headers', async () => {
      const bundle = await framework.installBundle(
        createBundleModule('test.empty.strings', '1.0.0', {
          bundleName: '',
          bundleDescription: '',
          bundleManifestVersion: '',
        }),
      );

      const headers = bundle.getHeaders();

      // Empty strings should be preserved
      expect(headers['bundleName']).toBe('');
      expect(headers['bundleDescription']).toBe('');
      expect(headers['bundleManifestVersion']).toBe('');
    });

    it('should handle bundle headers with special characters', async () => {
      const specialHeaders = {
        bundleName: 'Test Bundle with Special Characters: åäö',
        bundleDescription: 'Description with unicode: 🚀 and symbols: &<>',
        customField: 'value with "quotes" and \'apostrophes\'',
      };

      const bundle = await framework.installBundle(createBundleModule('test.special.chars', '1.0.0', specialHeaders));

      const headers = bundle.getHeaders();

      expect(headers['bundleName']).toBe('Test Bundle with Special Characters: åäö');
      expect(headers['bundleDescription']).toBe('Description with unicode: 🚀 and symbols: &<>');
      expect(headers['customField']).toBe('value with "quotes" and \'apostrophes\'');
    });

    it('should preserve all header keys including dynamic ones', async () => {
      const dynamicHeaders = {
        bundleName: 'Dynamic Headers Test',
        bundleDescription: 'Testing dynamic header preservation',
        'Import-Package': 'com.example.api',
        'Export-Package': 'com.example.impl',
        'Bundle-RequiredExecutionEnvironment': 'JavaSE-11',
        customProperty1: 'value1',
        customProperty2: 'value2',
      };

      const bundle = await framework.installBundle(createBundleModule('test.dynamic', '1.0.0', dynamicHeaders));

      const headers = bundle.getHeaders();
      const headerKeys = Object.keys(headers);

      // Should contain all expected keys
      expect(headerKeys).toContain('Bundle-SymbolicName');
      expect(headerKeys).toContain('Bundle-Version');
      expect(headerKeys).toContain('Bundle-Activator');
      expect(headerKeys).toContain('bundleName');
      expect(headerKeys).toContain('bundleDescription');
      expect(headerKeys).toContain('Import-Package');
      expect(headerKeys).toContain('Export-Package');
      expect(headerKeys).toContain('Bundle-RequiredExecutionEnvironment');
      expect(headerKeys).toContain('customProperty1');
      expect(headerKeys).toContain('customProperty2');

      // Verify values
      expect(headers['Import-Package']).toBe('com.example.api');
      expect(headers['Export-Package']).toBe('com.example.impl');
      expect(headers['Bundle-RequiredExecutionEnvironment']).toBe('JavaSE-11');
      expect(headers['customProperty1']).toBe('value1');
      expect(headers['customProperty2']).toBe('value2');
    });
  });

  // ...existing code...
});
