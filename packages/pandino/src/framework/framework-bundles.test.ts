import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OSGiFramework } from './framework';
import type { BundleActivator, BundleConfiguration, ServiceRegistration } from './interfaces';
import { BUNDLE_STATES } from '../types/constants';
import { createBundleModule } from '../test/bundle-module';

interface TestService {
  getData: () => string;
}

describe('BundleModule support', () => {
  let framework: OSGiFramework;

  beforeEach(async () => {
    framework = new OSGiFramework();
    await framework.start();
  });

  afterEach(async () => {
    await framework.stop();
  });

  describe('bundle manifest headers', () => {
    it('should install bundle with custom headers', async () => {
      const bundleModule = createBundleModule('com.example.test-bundle', '2.1.0', {
        bundleName: 'Test Bundle',
        bundleDescription: 'A test bundle for unit testing',
        bundleManifestVersion: '2',
        'Custom-Header': 'custom-value',
        'Vendor-Name': 'ACME Corp',
      });

      const bundle = await framework.installBundle(bundleModule);

      expect(bundle.getSymbolicName()).toBe('com.example.test-bundle');
      expect(bundle.getVersion()).toBe('2.1.0');

      const headers = bundle.getHeaders();
      expect(headers['Bundle-SymbolicName']).toBe('com.example.test-bundle');
      expect(headers['Bundle-Version']).toBe('2.1.0');
    });

    it('should use provided values for bundle headers', async () => {
      const bundleModule = createBundleModule('com.example.default-bundle');

      const bundle = await framework.installBundle(bundleModule);

      expect(bundle.getSymbolicName()).toBe('com.example.default-bundle');
      expect(bundle.getVersion()).toBe('1.0.0');
    });

    it('should support custom headers', async () => {
      const bundleModule = createBundleModule('com.example.custom', '1.0.0', {
        'Custom-Header': 'custom-value',
        'Vendor-Name': 'ACME Corp',
        'Build-Number': '12345',
      });

      const bundle = await framework.installBundle(bundleModule);

      expect(bundle.getSymbolicName()).toBe('com.example.custom');
      expect(bundle.getVersion()).toBe('1.0.0');
    });
  });

  describe('bundle activators', () => {
    it('should install bundle with activator', async () => {
      const activatorStart = vi.fn();
      const activatorStop = vi.fn();

      const activator: BundleActivator = {
        start: activatorStart,
        stop: activatorStop,
      };

      const bundleModule = createBundleModule('com.example.activator-bundle', '1.0.0', {}, activator);

      const bundle = await framework.installBundle(bundleModule);

      expect(activatorStart).not.toHaveBeenCalled(); // Not started yet

      await bundle.start();
      const contextBeforeStop = bundle.getContext();
      expect(activatorStart).toHaveBeenCalledWith(contextBeforeStop);

      await bundle.stop();
      expect(activatorStop).toHaveBeenCalledWith(contextBeforeStop);
    });

    it('should handle activator with service registration', async () => {
      const testService: TestService = { getData: vi.fn().mockReturnValue('test-data') };
      let serviceRegistration: ServiceRegistration<TestService>;

      const activator: BundleActivator = {
        start: vi.fn().mockImplementation((context) => {
          serviceRegistration = context.registerService('TestService', testService);
        }),
        stop: vi.fn().mockImplementation(() => {
          if (serviceRegistration) {
            serviceRegistration.unregister();
          }
        }),
      };

      const bundleModule = createBundleModule('com.example.service-provider', '1.0.0', {}, activator);

      const bundle = await framework.installBundle(bundleModule);

      await bundle.start();

      const systemContext = framework.getBundleContext();
      const serviceRef = systemContext.getServiceReference<TestService>('TestService');
      expect(serviceRef).not.toBeNull();

      if (serviceRef) {
        const service = systemContext.getService(serviceRef);
        expect(service).toBe(testService);
        expect(service?.getData()).toBe('test-data');
      }

      await bundle.stop();

      // Service should be unregistered after stop
      const serviceRefAfterStop = systemContext.getServiceReference('TestService');
      expect(serviceRefAfterStop).toBeNull();
    });

    it('should handle activator with service registration', async () => {
      const testService: TestService = { getData: vi.fn().mockReturnValue('test-data') };
      let serviceRegistration: ServiceRegistration<TestService>;

      const activator: BundleActivator = {
        start: vi.fn().mockImplementation((context) => {
          serviceRegistration = context.registerService('TestService', testService);
        }),
        stop: vi.fn().mockImplementation(() => {
          if (serviceRegistration) {
            serviceRegistration.unregister();
          }
        }),
      };

      const config: BundleConfiguration = {
        headers: {
          bundleSymbolicName: 'com.example.service-provider',
          bundleVersion: '1.0.0',
        },
        activator,
      };

      const bundle = await framework.installBundle('test://service-provider', config);
      await bundle.start();

      // Verify service was registered
      const context = framework.getBundleContext();
      const serviceRef = context.getServiceReference('TestService');
      expect(serviceRef).toBeDefined();

      if (serviceRef) {
        const retrievedService = context.getService(serviceRef);
        expect(retrievedService).toBe(testService);
      }

      await bundle.stop();

      // Verify service was unregistered
      const serviceRefAfterStop = context.getServiceReference('TestService');
      expect(serviceRefAfterStop).toBeNull();
    });

    it('should handle activator errors during start', async () => {
      const activator: BundleActivator = {
        start: vi.fn().mockRejectedValue(new Error('Activator start failed')),
        stop: vi.fn(),
      };

      const config: BundleConfiguration = {
        activator,
      };

      const bundle = await framework.installBundle('test://failing-activator', config);

      await expect(bundle.start()).rejects.toThrow('Activator start failed');
      expect(bundle.getState()).toBe(BUNDLE_STATES.RESOLVED); // Should remain resolved
    });

    it('should handle activator errors during stop', async () => {
      const activator: BundleActivator = {
        start: () => {},
        stop: () => {
          throw new Error('Activator stop failed');
        },
      };

      const config: BundleConfiguration = {
        activator,
      };

      const bundle = await framework.installBundle('test://failing-stop', config);
      await bundle.start();

      // Stop should complete despite activator error
      await bundle.stop();

      // Verify the bundle is in the RESOLVED state after stopping
      expect(bundle.getState()).toBe(BUNDLE_STATES.RESOLVED);
    });

    it('should validate activator factory return value', async () => {
      const invalidFactory = vi.fn().mockReturnValue({ invalid: 'object' });

      const config: BundleConfiguration = {
        activator: invalidFactory,
      };

      await expect(framework.installBundle('test://invalid-factory', config)).rejects.toThrow(
        'Activator factory function must return a BundleActivator object',
      );
    });

    it('should handle activator with async start and stop', async () => {
      const activatorStart = vi.fn().mockResolvedValue(undefined);
      const activatorStop = vi.fn().mockResolvedValue(undefined);

      const activator: BundleActivator = {
        start: activatorStart,
        stop: activatorStop,
      };

      const config: BundleConfiguration = {
        activator,
      };

      const bundle = await framework.installBundle('test://async-activator', config);

      await bundle.start();
      expect(activatorStart).toHaveBeenCalledWith(bundle.getContext());

      await bundle.stop();
      expect(activatorStop).toHaveBeenCalledWith(bundle.getContext());
    });
  });

  describe('complete bundle lifecycle', () => {
    it('should handle full lifecycle with headers and activator', async () => {
      const serviceRegistrations: ServiceRegistration<unknown>[] = [];

      const activator: BundleActivator = {
        start: vi.fn().mockImplementation((context) => {
          const service1 = context.registerService('Service1', { name: 'service1' });
          const service2 = context.registerService('Service2', { name: 'service2' });
          serviceRegistrations.push(service1, service2);
        }),
        stop: vi.fn().mockImplementation(() => {
          for (const reg of serviceRegistrations) {
            reg.unregister();
          }
          serviceRegistrations.length = 0;
        }),
      };

      const config: BundleConfiguration = {
        headers: {
          bundleSymbolicName: 'com.example.full-lifecycle',
          bundleVersion: '3.0.0',
          bundleName: 'Full Lifecycle Test Bundle',
          bundleDescription: 'Tests complete bundle lifecycle',
          'Custom-Property': 'test-value',
        },
        activator,
      };

      const bundle = await framework.installBundle('test://full-lifecycle', config);

      expect(bundle.getSymbolicName()).toBe('com.example.full-lifecycle');
      expect(bundle.getVersion()).toBe('3.0.0');
      expect(bundle.getState()).toBe(BUNDLE_STATES.RESOLVED);

      await bundle.start();
      expect(bundle.getState()).toBe(BUNDLE_STATES.ACTIVE);
      expect(activator.start).toHaveBeenCalledWith(bundle.getContext());
      expect(serviceRegistrations).toHaveLength(2);

      const context = framework.getBundleContext();
      const service1Ref = context.getServiceReference('Service1');
      const service2Ref = context.getServiceReference('Service2');
      expect(service1Ref).toBeDefined();
      expect(service2Ref).toBeDefined();

      await bundle.stop();
      expect(bundle.getState()).toBe(BUNDLE_STATES.RESOLVED);
      expect(activator.stop).toHaveBeenCalledWith(bundle.getContext());

      // Verify services are no longer available
      expect(context.getServiceReference('Service1')).toBeNull();
      expect(context.getServiceReference('Service2')).toBeNull();
    });

    it('should handle bundle uninstall with custom lifecycle', async () => {
      const activator: BundleActivator = {
        start: vi.fn(),
        stop: vi.fn(),
      };

      const config: BundleConfiguration = {
        headers: {
          bundleSymbolicName: 'com.example.uninstall-test',
          bundleVersion: '1.0.0',
        },
        activator,
      };

      const bundle = await framework.installBundle('test://uninstall-test', config);
      await bundle.start();

      const bundleId = bundle.getBundleId();
      expect(framework.getBundle(bundleId)).toBe(bundle);

      await bundle.uninstall();

      // After uninstall, getState() throws an error, so we can't check the state directly
      expect(() => bundle.getState()).toThrow(`Bundle ${bundleId} has been uninstalled`);
      expect(activator.stop).toHaveBeenCalled();
      expect(framework.getBundle(bundleId)).toBeNull();
    });
  });

  describe('bundle context integration', () => {
    beforeEach(async () => {
      await framework.start();
    });

    it('should support installBundle from bundle context with configuration', async () => {
      const parentBundle = await framework.installBundle('test://parent');
      const parentContext = parentBundle.getContext();

      const childConfig: BundleConfiguration = {
        headers: {
          bundleSymbolicName: 'com.example.child-bundle',
          bundleVersion: '1.5.0',
        },
        activator: {
          start: vi.fn(),
          stop: vi.fn(),
        },
      };

      const childBundle = await parentContext.installBundle('test://child', childConfig);

      expect(childBundle.getSymbolicName()).toBe('com.example.child-bundle');
      expect(childBundle.getVersion()).toBe('1.5.0');
    });

    it('should maintain bundle configuration across framework operations', async () => {
      const activator = {
        start: vi.fn(),
        stop: vi.fn(),
      };

      const config: BundleConfiguration = {
        headers: {
          bundleSymbolicName: 'com.example.persistent',
          bundleVersion: '2.0.0',
          bundleName: 'Persistent Bundle',
        },
        activator,
      };

      const bundle = await framework.installBundle('test://persistent', config);

      await bundle.start();
      await bundle.stop();
      await bundle.start();
      await bundle.stop();

      expect(bundle.getSymbolicName()).toBe('com.example.persistent');
      expect(bundle.getVersion()).toBe('2.0.0');
      expect(activator.start).toHaveBeenCalledTimes(2);
      expect(activator.stop).toHaveBeenCalledTimes(2);
    });
  });

  describe('error handling and validation', () => {
    it('should validate activator type', async () => {
      const invalidConfig: BundleConfiguration = {
        activator: 'invalid-activator' as unknown as BundleActivator,
      };

      await expect(framework.installBundle('test://invalid', invalidConfig)).rejects.toThrow(
        'Invalid activator: must be a BundleActivator object or factory function',
      );
    });

    it('should handle empty configuration gracefully', async () => {
      const emptyConfig: BundleConfiguration = {};

      const bundle = await framework.installBundle('test://empty-config', emptyConfig);

      expect(bundle.getSymbolicName()).toBe('empty-config');
      expect(bundle.getVersion()).toBe('1.0.0');
      expect(bundle.getState()).toBe(BUNDLE_STATES.RESOLVED);
    });

    it('should handle configuration with only headers', async () => {
      const config: BundleConfiguration = {
        headers: {
          bundleSymbolicName: 'com.example.headers-only',
          bundleVersion: '1.0.0',
        },
      };

      const bundle = await framework.installBundle('test://headers-only', config);

      expect(bundle.getSymbolicName()).toBe('com.example.headers-only');
      expect(bundle.getVersion()).toBe('1.0.0');

      // Should start/stop without issues even without activator
      await bundle.start();
      expect(bundle.getState()).toBe(BUNDLE_STATES.ACTIVE);

      await bundle.stop();
      expect(bundle.getState()).toBe(BUNDLE_STATES.RESOLVED);
    });

    it('should handle configuration with only activator', async () => {
      const activator: BundleActivator = {
        start: vi.fn(),
        stop: vi.fn(),
      };

      const config: BundleConfiguration = {
        activator,
      };

      const bundle = await framework.installBundle('test://activator-only', config);

      expect(bundle.getSymbolicName()).toBe('activator-only'); // Derived from location
      expect(bundle.getVersion()).toBe('1.0.0'); // Default version

      await bundle.start();
      expect(activator.start).toHaveBeenCalledWith(bundle.getContext());

      await bundle.stop();
      expect(activator.stop).toHaveBeenCalledWith(bundle.getContext());
    });
  });

  describe('backwards compatibility', () => {
    it('should maintain compatibility with no second parameter', async () => {
      const bundle = await framework.installBundle('test://no-config');

      // The symbolic name is derived from the location when no config is provided
      expect(bundle.getSymbolicName()).toBe('no-config');
      expect(bundle.getVersion()).toBe('1.0.0');
      expect(bundle.getState()).toBe(BUNDLE_STATES.RESOLVED);

      await bundle.start();
      expect(bundle.getState()).toBe(BUNDLE_STATES.ACTIVE);

      await bundle.stop();
      expect(bundle.getState()).toBe(BUNDLE_STATES.RESOLVED);
    });

    it('should support undefined configuration parameter', async () => {
      const bundle = await framework.installBundle('test://undefined-config', undefined);

      // The symbolic name is derived from the location when undefined config is provided
      expect(bundle.getSymbolicName()).toBe('undefined-config');
      expect(bundle.getVersion()).toBe('1.0.0');
      expect(bundle.getState()).toBe(BUNDLE_STATES.RESOLVED);
    });

    it('should support null configuration parameter', async () => {
      const bundle = await framework.installBundle('test://null-config', null as unknown as BundleConfiguration);

      // The symbolic name is derived from the location when null config is provided
      expect(bundle.getSymbolicName()).toBe('null-config');
      expect(bundle.getVersion()).toBe('1.0.0');
      expect(bundle.getState()).toBe(BUNDLE_STATES.RESOLVED);
    });
  });
});
