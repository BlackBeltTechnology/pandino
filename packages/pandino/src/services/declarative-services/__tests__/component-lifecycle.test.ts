import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OSGiFramework } from '~/framework/framework';
import type { BundleContext, ServiceReference } from '~/framework/interfaces';
import { Activate, Component, Deactivate, Modified, Reference } from '@pandino/decorators';
import { getComponentMetadata } from '../reflection';
import { ServiceComponentRuntime } from '../scr';

describe('Component Lifecycle', () => {
  let framework: OSGiFramework;
  let scr: ServiceComponentRuntime;
  let bundleContext: BundleContext;
  let mockServiceRef: ServiceReference<any>;

  beforeEach(async () => {
    framework = new OSGiFramework();
    await framework.start();
    bundleContext = framework.getBundleContext();
    scr = new ServiceComponentRuntime(framework, bundleContext);

    mockServiceRef = { getProperty: vi.fn() } as unknown as ServiceReference<any>;
  });

  describe('Component Registration', () => {
    it('should register a component with metadata', () => {
      @Component({ name: 'test.component' })
      class TestComponent {}

      scr.registerComponent(TestComponent);

      const bundleId = bundleContext.getBundle().getBundleId();
      const entry = scr.getComponent(bundleId, 'test.component');
      expect(entry).toBeDefined();
      expect(entry?.metadata.name).toBe('test.component');
      expect(entry?.metadata.class).toBe(TestComponent);
    });

    it('should throw an error if metadata is missing', async () => {
      class InvalidComponent {}

      await expect(scr.registerComponent(InvalidComponent)).rejects.toThrow('Component metadata not found');
    });
  });

  describe('Component Activation', () => {
    it('should activate a component and call its @Activate method', async () => {
      const activationTracker: string[] = [];

      @Component({ name: 'activatable.component' })
      class ActivatableComponent {
        @Activate
        activate() {
          activationTracker.push('activated');
        }
      }

      // Get the system bundle ID (0)
      const bundleId = 0;
      scr.registerComponent(ActivatableComponent, bundleId);
      await scr.activateComponent(bundleId, 'activatable.component');

      expect(activationTracker).toEqual(['activated']);

      const entry = scr.getComponent(bundleId, 'activatable.component');
      expect(entry?.instance).toBeInstanceOf(ActivatableComponent);
    });

    it('should activate component without @Activate method', async () => {
      @Component({ name: 'simple.component' })
      class SimpleComponent {
        public value = 'test';
      }

      const bundleId = 0;
      scr.registerComponent(SimpleComponent, bundleId);
      await scr.activateComponent(bundleId, 'simple.component');

      const entry = scr.getComponent(bundleId, 'simple.component');
      expect(entry?.instance).toBeInstanceOf(SimpleComponent);
      expect(entry?.instance.value).toBe('test');
    });

    it('should handle async activation methods', async () => {
      const activationTracker: string[] = [];

      @Component({ name: 'async.component' })
      class AsyncComponent {
        @Activate
        async activate() {
          await new Promise((resolve) => setTimeout(resolve, 10));
          activationTracker.push('async-activated');
        }
      }

      const bundleId = 0;
      scr.registerComponent(AsyncComponent, bundleId);
      await scr.activateComponent(bundleId, 'async.component');

      expect(activationTracker).toEqual(['async-activated']);
    });

    it('should throw an error if the component is not registered', async () => {
      const bundleId = 0;
      await expect(scr.activateComponent(bundleId, 'nonexistent.component')).rejects.toThrow(
        'Component nonexistent.component not found in bundle 0',
      );
    });
  });

  describe('Component Deactivation', () => {
    it('should deactivate a component and call its @Deactivate method', async () => {
      const lifecycleTracker: string[] = [];

      @Component({ name: 'deactivatable.component' })
      class DeactivatableComponent {
        @Activate
        activate() {
          lifecycleTracker.push('activated');
        }

        @Deactivate
        deactivate() {
          lifecycleTracker.push('deactivated');
        }
      }

      const bundleId = 0;
      scr.registerComponent(DeactivatableComponent, bundleId);
      await scr.activateComponent(bundleId, 'deactivatable.component');
      await scr.deactivateComponent(bundleId, 'deactivatable.component');

      expect(lifecycleTracker).toEqual(['activated', 'deactivated']);

      const entry = scr.getComponent(bundleId, 'deactivatable.component');
      expect(entry?.instance).toBeNull();
    });

    it('should handle async deactivation methods', async () => {
      const lifecycleTracker: string[] = [];

      @Component({ name: 'async.deactivation.component' })
      class AsyncDeactivationComponent {
        @Activate
        activate() {
          lifecycleTracker.push('activated');
        }

        @Deactivate
        async deactivate() {
          await new Promise((resolve) => setTimeout(resolve, 10));
          lifecycleTracker.push('async-deactivated');
        }
      }

      const bundleId = 0;
      scr.registerComponent(AsyncDeactivationComponent, bundleId);
      await scr.activateComponent(bundleId, 'async.deactivation.component');
      await scr.deactivateComponent(bundleId, 'async.deactivation.component');

      expect(lifecycleTracker).toEqual(['activated', 'async-deactivated']);
    });

    it('should throw an error if the component is not active', async () => {
      @Component({ name: 'inactive.component' })
      class InactiveComponent {}

      const bundleId = 0;
      scr.registerComponent(InactiveComponent, bundleId);

      await expect(scr.deactivateComponent(bundleId, 'inactive.component')).rejects.toThrow(
        'Component inactive.component not active in bundle 0',
      );
    });

    it('should handle deactivation when component was never activated', async () => {
      @Component({ name: 'never.activated.component' })
      class NeverActivatedComponent {}

      const bundleId = 0;
      scr.registerComponent(NeverActivatedComponent, bundleId);

      await expect(scr.deactivateComponent(bundleId, 'never.activated.component')).rejects.toThrow(
        'Component never.activated.component not active in bundle 0',
      );
    });

    it('should handle deactivation exceptions gracefully', () => {
      @Component({ name: 'failing.deactivation.component' })
      class FailingDeactivationComponent {
        @Activate
        activate() {}

        @Deactivate
        deactivate() {
          throw new Error('Deactivation failed');
        }
      }

      const metadata = getComponentMetadata(FailingDeactivationComponent);
      expect(metadata.deactivate).toBe('deactivate');
    });

    it('should handle component with only deactivate method', () => {
      @Component({ name: 'deactivate.only.component' })
      class DeactivateOnlyComponent {
        private initialized = false;

        constructor() {
          this.initialized = true;
        }

        @Deactivate
        cleanup() {
          this.initialized = false;
        }

        isInitialized(): boolean {
          return this.initialized;
        }
      }

      const metadata = getComponentMetadata(DeactivateOnlyComponent);
      expect(metadata.activate).toBeUndefined();
      expect(metadata.deactivate).toBe('cleanup');
    });
  });

  describe('Lifecycle Order', () => {
    it('should handle deactivation order with multiple lifecycle methods', () => {
      const _callOrder: string[] = [];

      @Component({ name: 'lifecycle.order.component' })
      class LifecycleOrderComponent {
        @Activate
        activate() {
          _callOrder.push('activate');
        }

        @Modified
        modified() {
          _callOrder.push('modified');
        }

        @Deactivate
        deactivate() {
          _callOrder.push('deactivate');
        }
      }

      const metadata = getComponentMetadata(LifecycleOrderComponent);
      expect(metadata.activate).toBe('activate');
      expect(metadata.modified).toBe('modified');
      expect(metadata.deactivate).toBe('deactivate');
    });

    it('should handle complete component lifecycle with service binding', async () => {
      const lifecycleTracker: string[] = [];

      @Component({ name: 'full.lifecycle.component' })
      class FullLifecycleComponent {
        @Reference({ interface: 'TestService', bind: 'bindService', unbind: 'unbindService' })
        private service?: any;

        @Activate
        activate() {
          lifecycleTracker.push('activated');
        }

        @Deactivate
        deactivate() {
          lifecycleTracker.push('deactivated');
        }

        bindService(service: any) {
          this.service = service;
          lifecycleTracker.push('service-bound');
        }

        unbindService() {
          this.service = null;
          lifecycleTracker.push('service-unbound');
        }
      }

      const mockBundleContext = {
        getServiceReferences: vi.fn().mockReturnValue([mockServiceRef]),
        getService: vi.fn().mockReturnValue({ value: 'test' }),
        registerService: vi.fn(),
        ungetService: vi.fn(),
      } as unknown as BundleContext;

      const testScr = new ServiceComponentRuntime(framework, mockBundleContext);
      const bundleId = 0;
      testScr.registerComponent(FullLifecycleComponent, bundleId);
      await testScr.activateComponent(bundleId, 'full.lifecycle.component');

      await testScr.processServiceEvent('TestService', 'unregistered');
      await testScr.deactivateComponent(bundleId, 'full.lifecycle.component');

      expect(lifecycleTracker).toEqual(['activated', 'service-bound', 'service-unbound', 'deactivated']);
    });
  });

  describe('Bundle Lifecycle', () => {
    it('should handle component registration and deactivation', async () => {
      const lifecycleEvents: string[] = [];

      @Component({ name: 'bundle.lifecycle.component' })
      class BundleLifecycleComponent {
        @Activate
        activate() {
          lifecycleEvents.push('activated');
        }

        @Deactivate
        deactivate() {
          lifecycleEvents.push('deactivated');
        }
      }

      // Test direct component registration
      const bundleId = 0;
      await scr.registerComponent(BundleLifecycleComponent, bundleId);
      expect(
        (scr as any).components.has(bundleId) &&
          (scr as any).components.get(bundleId).has('bundle.lifecycle.component'),
      ).toBe(true);

      // Activate the component
      await scr.activateComponent(bundleId, 'bundle.lifecycle.component');
      expect(lifecycleEvents).toContain('activated');

      // Deactivate the component - it should still exist in registry but with null instance
      await scr.deactivateComponent(bundleId, 'bundle.lifecycle.component');
      expect(lifecycleEvents).toContain('deactivated');
      expect(
        (scr as any).components.has(bundleId) &&
          (scr as any).components.get(bundleId).has('bundle.lifecycle.component'),
      ).toBe(true); // Still registered

      const componentEntry = (scr as any).components.get(bundleId).get('bundle.lifecycle.component');
      expect(componentEntry.instance).toBeNull(); // But instance is null
    });
  });
});
