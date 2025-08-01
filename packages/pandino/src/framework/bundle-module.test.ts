import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OSGiFramework } from '~/framework/framework';
import type { BundleActivator } from '~/framework/interfaces';
import type { BundleModule } from '~/types/bundle-metadata';
import { BUNDLE_STATES } from '~/types/constants';

function createBundleModule(
  symbolicName: string,
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

describe('BundleModule support', () => {
  let framework: OSGiFramework;

  beforeEach(async () => {
    framework = new OSGiFramework();
    await framework.start();
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
      const testService = { getData: vi.fn().mockReturnValue('test-data') };
      let serviceRegistration: any;

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
      const serviceRef = systemContext.getServiceReference('TestService');
      expect(serviceRef).not.toBeNull();

      const service = systemContext.getService<{ getData: () => string }>(serviceRef!);
      expect(service).toBe(testService);
      expect(service!.getData()).toBe('test-data');

      await bundle.stop();

      // Service should be unregistered after stop
      const serviceRefAfterStop = systemContext.getServiceReference('TestService');
      expect(serviceRefAfterStop).toBeNull();
    });

    it('should support async activator start/stop methods', async () => {
      const startResult = { success: true };
      const stopResult = { success: true };

      const activator: BundleActivator = {
        start: vi.fn().mockResolvedValue(startResult),
        stop: vi.fn().mockResolvedValue(stopResult),
      };

      const bundleModule = createBundleModule('com.example.async-activator', '1.0.0', {}, activator);

      const bundle = await framework.installBundle(bundleModule);

      await bundle.start();
      expect(activator.start).toHaveBeenCalled();

      await bundle.stop();
      expect(activator.stop).toHaveBeenCalled();
    });

    it('should handle errors in activator start method', async () => {
      const error = new Error('Failed to start');

      const activator: BundleActivator = {
        start: vi.fn().mockRejectedValue(error),
        stop: vi.fn(),
      };

      const bundleModule = createBundleModule('com.example.failing-activator', '1.0.0', {}, activator);

      const bundle = await framework.installBundle(bundleModule);

      await expect(bundle.start()).rejects.toThrow('Failed to start');
      expect(activator.start).toHaveBeenCalled();
      expect(activator.stop).not.toHaveBeenCalled();
    });
  });

  describe('bundle lifecycle', () => {
    it('should go through proper lifecycle states', async () => {
      const activator: BundleActivator = {
        start: vi.fn(),
        stop: vi.fn(),
      };

      const bundleModule = createBundleModule('com.example.lifecycle-bundle', '1.0.0', {}, activator);

      const bundle = await framework.installBundle(bundleModule);
      expect(bundle.getState()).toBe(BUNDLE_STATES.RESOLVED);

      await bundle.start();
      expect(bundle.getState()).toBe(BUNDLE_STATES.ACTIVE);
      expect(activator.start).toHaveBeenCalled();

      await bundle.stop();
      expect(bundle.getState()).toBe(BUNDLE_STATES.RESOLVED);
      expect(activator.stop).toHaveBeenCalled();

      await bundle.uninstall();
      expect(() => bundle.getState()).toThrow();
    });
  });

  describe('bundle context', () => {
    it('should provide access to bundle context', async () => {
      let bundleContext: any;

      const activator: BundleActivator = {
        start: vi.fn().mockImplementation((context) => {
          bundleContext = context;
        }),
        stop: vi.fn(),
      };

      const bundleModule = createBundleModule('com.example.context-bundle', '1.0.0', {}, activator);

      const bundle = await framework.installBundle(bundleModule);
      await bundle.start();

      expect(bundleContext).toBeDefined();
      expect(bundleContext.getBundle()).toBe(bundle);
      expect(bundleContext.getBundles()).toContain(bundle);
    });
  });
});
