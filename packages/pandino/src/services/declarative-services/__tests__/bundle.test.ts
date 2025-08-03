import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OSGiFramework } from '~/framework/framework';
import type { Bundle, BundleContext, BundleEvent } from '~/framework/interfaces';
import { BUNDLE_STATES } from '~/types/constants';
import { Component, Service, Activate } from '@pandino/decorators';
import { ServiceComponentRuntimeBundleActivator } from '../bundle';
import type { ServiceComponentRuntime } from '../scr';
import type { SCRBundleConfiguration } from '../interfaces';

describe('ServiceComponentRuntimeBundleActivator', () => {
  let framework: OSGiFramework;
  let bundleContext: BundleContext;
  let activator: ServiceComponentRuntimeBundleActivator;

  // Helper function to cast service with proper typing
  function getSCRService(bundleContext: BundleContext): ServiceComponentRuntime {
    const scrServiceRef = bundleContext.getServiceReference('ServiceComponentRuntime')!;
    return bundleContext.getService(scrServiceRef) as any;
  }

  beforeEach(async () => {
    framework = new OSGiFramework();
    await framework.start();
    bundleContext = framework.getBundleContext();

    activator = new ServiceComponentRuntimeBundleActivator();
  });

  afterEach(async () => {
    if (activator) {
      try {
        await activator.stop(bundleContext);
        // oxlint-disable-next-line no-unused-vars
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    if (framework) {
      await framework.stop();
    }
  });

  describe('start', () => {
    it('should register as a bundle listener', async () => {
      const addBundleListenerSpy = vi.spyOn(bundleContext, 'addBundleListener');

      await activator.start(bundleContext);

      expect(addBundleListenerSpy).toHaveBeenCalledWith(activator);
    });

    it('should register SCR service', async () => {
      await activator.start(bundleContext);

      const scrServiceRef = bundleContext.getServiceReference('ServiceComponentRuntime');
      expect(scrServiceRef).toBeDefined();

      const scrService = getSCRService(bundleContext);
      expect(scrService).toBeDefined();
      expect(typeof scrService.registerComponent).toBe('function');
    });

    it('should process existing bundles', async () => {
      const getBundlesSpy = vi.spyOn(bundleContext, 'getBundles');

      await activator.start(bundleContext);

      expect(getBundlesSpy).toHaveBeenCalled();
    });
  });

  describe('stop', () => {
    it('should remove itself as a bundle listener', async () => {
      const removeBundleListenerSpy = vi.spyOn(bundleContext, 'removeBundleListener');

      await activator.start(bundleContext);
      await activator.stop(bundleContext);

      expect(removeBundleListenerSpy).toHaveBeenCalledWith(activator);
    });

    it('should unregister the SCR service', async () => {
      await activator.start(bundleContext);

      let scrServiceRef = bundleContext.getServiceReference('ServiceComponentRuntime');
      expect(scrServiceRef).toBeDefined();

      await activator.stop(bundleContext);

      scrServiceRef = bundleContext.getServiceReference('ServiceComponentRuntime');
      expect(scrServiceRef).toBeNull();
    });
  });

  describe('bundleChanged', () => {
    it('should process the bundle when a bundle event occurs', async () => {
      const mockBundle = createMockBundleWithComponents();
      const mockBundleEvent = {
        getBundle: () => mockBundle,
        getType: () => BUNDLE_STATES.ACTIVE,
      } as BundleEvent;

      const processBundleSpy = vi.spyOn(activator as any, 'processBundle');

      await activator.start(bundleContext);
      activator.bundleChanged(mockBundleEvent);

      expect(processBundleSpy).toHaveBeenCalledWith(mockBundle);
    });

    it('should deactivate components when bundle is stopping', async () => {
      const mockBundle = createMockBundleWithComponents();
      const mockBundleEvent = {
        getBundle: () => mockBundle,
        getType: () => BUNDLE_STATES.STOPPING,
      } as BundleEvent;

      const deactivateBundleComponentsSpy = vi.spyOn(activator as any, 'deactivateBundleComponents');

      await activator.start(bundleContext);
      activator.bundleChanged(mockBundleEvent);

      expect(deactivateBundleComponentsSpy).toHaveBeenCalledWith(1);
    });

    it('should remove components when bundle is uninstalled', async () => {
      const mockBundle = createMockBundleWithComponents();
      const mockBundleEvent = {
        getBundle: () => mockBundle,
        getType: () => BUNDLE_STATES.UNINSTALLED,
      } as BundleEvent;

      const removeBundleComponentsSpy = vi.spyOn(activator as any, 'removeBundleComponents');

      await activator.start(bundleContext);
      activator.bundleChanged(mockBundleEvent);

      expect(removeBundleComponentsSpy).toHaveBeenCalledWith(1);
    });

    it('should not take action for other bundle states', async () => {
      const mockBundle = createMockBundleWithComponents();
      const mockBundleEvent = {
        getBundle: () => mockBundle,
        getType: () => BUNDLE_STATES.STARTING,
      } as BundleEvent;

      await activator.start(bundleContext);

      // Clear any spy calls from the startup process
      const processBundleSpy = vi.spyOn(activator as any, 'processBundle');
      const deactivateBundleComponentsSpy = vi.spyOn(activator as any, 'deactivateBundleComponents');
      const removeBundleComponentsSpy = vi.spyOn(activator as any, 'removeBundleComponents');

      activator.bundleChanged(mockBundleEvent);

      expect(processBundleSpy).not.toHaveBeenCalled();
      expect(deactivateBundleComponentsSpy).not.toHaveBeenCalled();
      expect(removeBundleComponentsSpy).not.toHaveBeenCalled();
    });
  });

  describe('processBundle integration', () => {
    @Component({ name: 'test.component1' })
    @Service({ interfaces: ['TestService1'] })
    class TestComponent1 {
      @Activate
      activate() {}
    }

    @Component({ name: 'test.component2' })
    @Service({ interfaces: ['TestService2'] })
    class TestComponent2 {
      @Activate
      activate() {}
    }

    it('should register components from bundle module components array', async () => {
      const mockBundle = createMockBundleWithComponents({
        components: [TestComponent1, TestComponent2],
      });

      await activator.start(bundleContext);

      const scrService = getSCRService(bundleContext);
      const registerComponentSpy = vi.spyOn(scrService, 'registerComponent');

      (activator as any).processBundle(mockBundle);

      expect(registerComponentSpy).toHaveBeenCalledTimes(2);
      expect(registerComponentSpy).toHaveBeenCalledWith(TestComponent1, 1);
      expect(registerComponentSpy).toHaveBeenCalledWith(TestComponent2, 1);
    });

    it('should register components from SCRBundleConfiguration in default export', async () => {
      const bundleConfig: SCRBundleConfiguration = {
        headers: {
          bundleSymbolicName: 'test.bundle',
          bundleVersion: '1.0.0',
        },
        components: [TestComponent1, TestComponent2],
      };

      const mockBundle = createMockBundleWithComponents({
        default: bundleConfig,
      });

      await activator.start(bundleContext);

      const scrService = getSCRService(bundleContext);
      const registerComponentSpy = vi.spyOn(scrService, 'registerComponent');

      (activator as any).processBundle(mockBundle);

      expect(registerComponentSpy).toHaveBeenCalledTimes(2);
      expect(registerComponentSpy).toHaveBeenCalledWith(TestComponent1, 1);
      expect(registerComponentSpy).toHaveBeenCalledWith(TestComponent2, 1);
    });

    it('should merge components from both sources', async () => {
      const bundleConfig: SCRBundleConfiguration = {
        headers: {
          bundleSymbolicName: 'test.bundle',
          bundleVersion: '1.0.0',
        },
        components: [TestComponent2],
      };

      const mockBundle = createMockBundleWithComponents({
        components: [TestComponent1],
        default: bundleConfig,
      });

      await activator.start(bundleContext);

      const scrService = getSCRService(bundleContext);
      const registerComponentSpy = vi.spyOn(scrService, 'registerComponent');

      (activator as any).processBundle(mockBundle);

      expect(registerComponentSpy).toHaveBeenCalledTimes(2);
      expect(registerComponentSpy).toHaveBeenCalledWith(TestComponent1, 1);
      expect(registerComponentSpy).toHaveBeenCalledWith(TestComponent2, 1);
    });

    it('should handle errors when registering components', async () => {
      const mockBundle = createMockBundleWithComponents({
        components: [TestComponent1, TestComponent2],
      });

      await activator.start(bundleContext);

      const scrService = getSCRService(bundleContext);
      const registerComponentSpy = vi
        .spyOn(scrService, 'registerComponent')
        .mockImplementationOnce(() => {
          throw new Error('Registration failed');
        })
        .mockImplementationOnce(() => Promise.resolve());

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      (activator as any).processBundle(mockBundle);

      expect(registerComponentSpy).toHaveBeenCalledTimes(2);
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('Failed to register component from bundle 1');

      consoleErrorSpy.mockRestore();
    });

    it('should handle errors when processing bundle', async () => {
      const mockBundle = {
        getBundleId: () => 1,
        getBundleModule: () => {
          throw new Error('Bundle module error');
        },
      } as any;

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await activator.start(bundleContext);
      (activator as any).processBundle(mockBundle);

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy.mock.calls[0][0]).toBe('Error processing bundle for components:');

      consoleErrorSpy.mockRestore();
    });

    it('should do nothing if no components are found', async () => {
      const mockBundle = createMockBundleWithComponents({
        default: {
          headers: {
            bundleSymbolicName: 'test.bundle',
            bundleVersion: '1.0.0',
          },
        },
      });

      await activator.start(bundleContext);

      const scrService = getSCRService(bundleContext);
      const registerComponentSpy = vi.spyOn(scrService, 'registerComponent');

      (activator as any).processBundle(mockBundle);

      expect(registerComponentSpy).not.toHaveBeenCalled();
    });
  });

  function createMockBundleWithComponents(bundleModule?: any): Bundle {
    return {
      getBundleId: () => 1,
      getBundleModule: () => bundleModule,
      getSymbolicName: () => 'test.bundle',
      getVersion: () => '1.0.0',
      getState: () => 32, // ACTIVE
      getHeaders: () => ({}),
      getLocation: () => 'test://bundle',
      start: async () => {},
      stop: async () => {},
      update: async () => {},
      uninstall: async () => {},
      getRegisteredServices: () => [],
      getServicesInUse: () => [],
      getContext: () => bundleContext,
    } as Bundle;
  }
});
