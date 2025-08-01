import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OSGiFramework } from '~/framework/framework';
import type { BundleContext, ServiceReference } from '~/framework/interfaces';
import { Activate, Component, Deactivate, Reference, Service } from './interfaces';
import { ServiceComponentRuntime } from './scr';

describe('SCR Advanced Functionality', () => {
  let framework: OSGiFramework;
  let scr: ServiceComponentRuntime;
  let bundleContext: BundleContext;

  beforeEach(async () => {
    framework = new OSGiFramework();
    await framework.start();
    bundleContext = framework.getBundleContext();
    scr = new ServiceComponentRuntime(framework, bundleContext);
  });

  describe('Bundle Lifecycle Management', () => {
    it('should register and activate immediate components', async () => {
      @Component({ name: 'immediate.component', immediate: true })
      class ImmediateComponent {
        activated = false;

        @Activate
        activate() {
          this.activated = true;
        }
      }

      // Use real registerComponent instead of mocking findComponents
      const bundleId = bundleContext.getBundle().getBundleId();
      await scr.registerComponent(ImmediateComponent, bundleId);

      // The component should be automatically activated due to immediate: true
      const entry = scr.getComponent(bundleId, 'immediate.component');
      expect(entry).toBeDefined();
      expect(entry?.instance).toBeInstanceOf(ImmediateComponent);
      expect(entry!.instance.activated).toBe(true);
    });

    it('should deactivate components when requested', async () => {
      const deactivationTracker: string[] = [];

      @Component({ name: 'test.component' })
      class TestComponent {
        @Activate
        activate() {}

        @Deactivate
        deactivate() {
          deactivationTracker.push('component-deactivated');
        }
      }

      // Use real component registration and activation
      const bundleId = bundleContext.getBundle().getBundleId();
      scr.registerComponent(TestComponent, bundleId);
      await scr.activateComponent(bundleId, 'test.component');

      // Verify component is active
      let entry = scr.getComponent(bundleId, 'test.component');
      expect(entry?.instance).toBeInstanceOf(TestComponent);

      // Deactivate and verify cleanup
      await scr.deactivateComponent(bundleId, 'test.component');
      expect(deactivationTracker).toEqual(['component-deactivated']);

      entry = scr.getComponent(bundleId, 'test.component');
      expect(entry?.instance).toBeNull();
    });

    it('should handle multiple components from the same bundle', async () => {
      const activationOrder: string[] = [];

      @Component({ name: 'first.component' })
      class FirstComponent {
        @Activate
        activate() {
          activationOrder.push('first');
        }
      }

      @Component({ name: 'second.component' })
      class SecondComponent {
        @Activate
        activate() {
          activationOrder.push('second');
        }
      }

      // Register multiple components
      const bundleId = bundleContext.getBundle().getBundleId();
      scr.registerComponent(FirstComponent, bundleId);
      scr.registerComponent(SecondComponent, bundleId);

      // Activate them manually to test order
      await scr.activateComponent(bundleId, 'first.component');
      await scr.activateComponent(bundleId, 'second.component');

      expect(activationOrder).toEqual(['first', 'second']);
      expect(scr.getComponent(bundleId, 'first.component')?.instance).toBeInstanceOf(FirstComponent);
      expect(scr.getComponent(bundleId, 'second.component')?.instance).toBeInstanceOf(SecondComponent);
    });
  });

  describe('Service Registration Integration', () => {
    it('should register component as OSGi service when @Service decorator is used', async () => {
      const registerServiceSpy = vi.spyOn(bundleContext, 'registerService');

      @Component({ name: 'service.component' })
      @Service({ interfaces: ['TestService', 'AnotherService'] })
      class ServiceComponent {
        @Activate
        activate() {}

        getValue(): string {
          return 'test-value';
        }
      }

      const bundleId = bundleContext.getBundle().getBundleId();
      await scr.registerComponent(ServiceComponent, bundleId);
      await scr.activateComponent(bundleId, 'service.component');

      expect(registerServiceSpy).toHaveBeenCalledWith(
        ['TestService', 'AnotherService'],
        expect.any(ServiceComponent),
        expect.any(Object),
      );

      const entry = scr.getComponent(bundleId, 'service.component');
      expect(entry?.serviceRegistration).toBeDefined();

      // Test that the service method works
      expect(entry!.instance.getValue()).toBe('test-value');
    });

    it('should unregister service when component is deactivated', async () => {
      const mockServiceRegistration = {
        unregister: vi.fn(),
        getReference: vi.fn().mockReturnValue({}),
      };

      const registerServiceSpy = vi
        .spyOn(bundleContext, 'registerService')
        .mockReturnValue(mockServiceRegistration as any);

      @Component({ name: 'service.component' })
      @Service({ interfaces: ['TestService'] })
      class ServiceComponent {
        @Activate
        activate() {}

        @Deactivate
        deactivate() {}
      }

      const bundleId = bundleContext.getBundle().getBundleId();
      scr.registerComponent(ServiceComponent, bundleId);
      await scr.activateComponent(bundleId, 'service.component');
      await scr.deactivateComponent(bundleId, 'service.component');

      expect(registerServiceSpy).toHaveBeenCalled();
      expect(mockServiceRegistration.unregister).toHaveBeenCalled();
    });

    it('should make registered services discoverable through bundle context', async () => {
      @Component({ name: 'discoverable.service' })
      @Service({ interfaces: ['DiscoverableService'] })
      class DiscoverableService {
        @Activate
        activate() {}

        getData(): string {
          return 'service-data';
        }
      }

      const bundleId = bundleContext.getBundle().getBundleId();
      await scr.registerComponent(DiscoverableService, bundleId);
      await scr.activateComponent(bundleId, 'discoverable.service');

      // Verify the service is actually registered and discoverable
      const serviceRefs = bundleContext.getServiceReferences('DiscoverableService');
      expect(serviceRefs).toHaveLength(1);

      const service = bundleContext.getService(serviceRefs![0]) as DiscoverableService;
      expect(service).toBeInstanceOf(DiscoverableService);
      expect(service.getData()).toBe('service-data');
    });
  });

  describe('Reference Dependency Injection', () => {
    it('should inject services using real service registry', async () => {
      // First, register a provider service
      @Component({ name: 'provider.service' })
      @Service({ interfaces: ['ProviderService'] })
      class ProviderService {
        @Activate
        activate() {}

        provide(): string {
          return 'provided-value';
        }
      }

      // Then, register a consumer that references it
      @Component({ name: 'consumer.component' })
      class ConsumerComponent {
        private injectedService?: ProviderService;

        @Reference({
          interface: 'ProviderService',
          cardinality: '0..1',
          bind: 'bindProvider',
        })
        bindProvider(service: ProviderService) {
          this.injectedService = service;
        }

        @Activate
        activate() {}

        getInjectedValue(): string {
          return this.injectedService?.provide() || 'no-service';
        }
      }

      // Register and activate provider first
      const bundleId = bundleContext.getBundle().getBundleId();
      await scr.registerComponent(ProviderService, bundleId);
      await scr.activateComponent(bundleId, 'provider.service');

      // Then register and activate consumer
      await scr.registerComponent(ConsumerComponent, bundleId);
      await scr.activateComponent(bundleId, 'consumer.component');

      const consumerEntry = scr.getComponent(bundleId, 'consumer.component');
      const consumerInstance = consumerEntry?.instance as ConsumerComponent;

      expect(consumerInstance.getInjectedValue()).toBe('provided-value');
    });

    it('should handle multiple service references with 1..n cardinality', async () => {
      const boundServices: number[] = [];

      // Register multiple provider services
      @Component({ name: 'provider1' })
      @Service({ interfaces: ['MultiService'] })
      class Provider1 {
        @Activate
        activate() {}

        getId(): number {
          return 1;
        }
      }

      @Component({ name: 'provider2' })
      @Service({ interfaces: ['MultiService'] })
      class Provider2 {
        @Activate
        activate() {}

        getId(): number {
          return 2;
        }
      }

      @Component({ name: 'multi.consumer' })
      class MultiConsumer {
        @Reference({
          interface: 'MultiService',
          cardinality: '1..n',
          bind: 'bindService',
        })
        private services: any[] = [];

        @Activate
        activate() {}

        bindService(service: Provider1 | Provider2) {
          this.services.push(service);
          boundServices.push(service.getId());
        }

        getServiceCount(): number {
          return this.services.length;
        }
      }

      // Register providers first
      const bundleId = bundleContext.getBundle().getBundleId();
      await scr.registerComponent(Provider1, bundleId);
      await scr.registerComponent(Provider2, bundleId);
      await scr.activateComponent(bundleId, 'provider1');
      await scr.activateComponent(bundleId, 'provider2');

      // Then register consumer
      await scr.registerComponent(MultiConsumer, bundleId);
      await scr.activateComponent(bundleId, 'multi.consumer');

      const consumerEntry = scr.getComponent(bundleId, 'multi.consumer');
      const consumerInstance = consumerEntry?.instance as MultiConsumer;

      expect(consumerInstance.getServiceCount()).toBe(2);
      expect(boundServices.sort()).toEqual([1, 2]);
    });

    it('should throw error when mandatory reference not satisfied', async () => {
      @Component({ name: 'mandatory.consumer' })
      class MandatoryConsumer {
        @Reference({
          interface: 'NonExistentService',
          cardinality: '1..1',
          bind: 'bindService',
        })
        bindService(_service: any) {}

        @Activate
        activate() {}
      }

      const bundleId = bundleContext.getBundle().getBundleId();
      scr.registerComponent(MandatoryConsumer, bundleId);

      await expect(scr.activateComponent(bundleId, 'mandatory.consumer')).rejects.toThrow(
        'Mandatory reference NonExistentService not satisfied',
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle activation errors and cleanup properly', async () => {
      const unregisterSpy = vi.fn();
      const mockServiceRegistration = {
        unregister: unregisterSpy,
        getReference: vi.fn().mockReturnValue({}),
      };

      vi.spyOn(bundleContext, 'registerService').mockReturnValue(mockServiceRegistration as any);

      @Component({ name: 'failing.component' })
      @Service({ interfaces: ['FailingService'] })
      class FailingComponent {
        @Activate
        activate() {
          throw new Error('Activation failed');
        }
      }

      const bundleId = bundleContext.getBundle().getBundleId();
      scr.registerComponent(FailingComponent, bundleId);

      await expect(scr.activateComponent(bundleId, 'failing.component')).rejects.toThrow('Activation failed');

      expect(unregisterSpy).toHaveBeenCalled();

      const entry = scr.getComponent(bundleId, 'failing.component');
      expect(entry?.instance).toBeNull();
    });

    it('should throw error for invalid component constructor', async () => {
      const invalidMetadata = {
        name: 'invalid.component',
        class: 'not-a-function', // Invalid constructor
      };

      const bundleId = 0;
      if (!(scr as any).components.has(bundleId)) {
        (scr as any).components.set(bundleId, new Map());
      }
      (scr as any).components.get(bundleId).set('invalid.component', {
        instance: null,
        metadata: invalidMetadata,
      });

      await expect(scr.activateComponent(bundleId, 'invalid.component')).rejects.toThrow(
        'Component invalid.component does not have a valid constructor',
      );
    });
  });

  describe('Configuration Integration', () => {
    it('should update component configuration dynamically', async () => {
      let lastConfig: Record<string, any> | null = null;

      @Component({ name: 'configurable.component' })
      class ConfigurableComponent {
        @Activate
        activate() {}

        modified(config: Record<string, any>) {
          lastConfig = config;
        }
      }

      const metadata = (ConfigurableComponent as any).__osgi_component__;
      metadata.modified = 'modified';

      const bundleId = bundleContext.getBundle().getBundleId();
      scr.registerComponent(ConfigurableComponent, bundleId);
      await scr.activateComponent(bundleId, 'configurable.component');

      const newConfig = { key: 'value', updated: true };
      await (scr as any).updateComponentConfiguration(bundleId, 'configurable.component', newConfig);

      expect(lastConfig).toEqual(newConfig);
    });

    it('should throw error when updating configuration of inactive component', async () => {
      @Component({ name: 'inactive.config.component' })
      class InactiveConfigComponent {}

      const bundleId = bundleContext.getBundle().getBundleId();
      scr.registerComponent(InactiveConfigComponent, bundleId);

      await expect(
        (scr as any).updateComponentConfiguration(bundleId, 'inactive.config.component', {}),
      ).rejects.toThrow('Component inactive.config.component not active in bundle ' + bundleId);
    });
  });

  describe('Service Event Processing', () => {
    it('should handle service registration events for dynamic references', async () => {
      const bindTracker: string[] = [];

      @Component({ name: 'dynamic.component' })
      class DynamicComponent {
        @Reference({
          interface: 'DynamicService',
          policy: 'dynamic',
          cardinality: '0..1',
          bind: 'bindService',
        })
        private service?: any;

        @Activate
        activate() {}

        bindService(_service: any) {
          bindTracker.push('service-bound');
        }
      }

      const mockServiceRef = { getProperty: vi.fn() } as unknown as ServiceReference<any>;
      const mockService = { dynamic: true };

      bundleContext.getService = vi.fn().mockReturnValue(mockService);
      bundleContext.getServiceReferences = vi.fn().mockReturnValue([]);

      const bundleId = bundleContext.getBundle().getBundleId();
      scr.registerComponent(DynamicComponent, bundleId);
      await scr.activateComponent(bundleId, 'dynamic.component');

      // Simulate service registration event
      await scr.processServiceEvent('DynamicService', 'registered', mockServiceRef);

      expect(bindTracker).toEqual(['service-bound']);
      expect(bundleContext.getService).toHaveBeenCalledWith(mockServiceRef);
    });

    it('should handle service modified events', async () => {
      const updateTracker: any[] = [];

      @Component({ name: 'update.component' })
      class UpdateComponent {
        @Reference({
          interface: 'UpdateService',
          policy: 'dynamic',
          cardinality: '0..1',
          updated: 'updateService',
        })
        private service?: any;

        @Activate
        activate() {}

        updateService(service: any) {
          updateTracker.push(service);
        }
      }

      const mockServiceRef = { getProperty: vi.fn() } as unknown as ServiceReference<any>;
      const updatedService = { modified: true };

      bundleContext.getService = vi.fn().mockReturnValue(updatedService);
      bundleContext.getServiceReferences = vi.fn().mockReturnValue([]);

      const bundleId = bundleContext.getBundle().getBundleId();
      scr.registerComponent(UpdateComponent, bundleId);
      await scr.activateComponent(bundleId, 'update.component');

      // Simulate service modified event
      await scr.processServiceEvent('UpdateService', 'modified', mockServiceRef);

      expect(updateTracker).toEqual([updatedService]);
      expect(bundleContext.getService).toHaveBeenCalledWith(mockServiceRef);
    });
  });
});
