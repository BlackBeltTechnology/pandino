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
      await scr.registerComponent(ImmediateComponent);

      // The component should be automatically activated due to immediate: true
      const entry = scr.getComponent('immediate.component');
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
      scr.registerComponent(TestComponent);
      await scr.activateComponent('test.component');

      // Verify component is active
      let entry = scr.getComponent('test.component');
      expect(entry?.instance).toBeInstanceOf(TestComponent);

      // Deactivate and verify cleanup
      await scr.deactivateComponent('test.component');
      expect(deactivationTracker).toEqual(['component-deactivated']);

      entry = scr.getComponent('test.component');
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
      scr.registerComponent(FirstComponent);
      scr.registerComponent(SecondComponent);

      // Activate them manually to test order
      await scr.activateComponent('first.component');
      await scr.activateComponent('second.component');

      expect(activationOrder).toEqual(['first', 'second']);
      expect(scr.getComponent('first.component')?.instance).toBeInstanceOf(FirstComponent);
      expect(scr.getComponent('second.component')?.instance).toBeInstanceOf(SecondComponent);
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

      await scr.registerComponent(ServiceComponent);
      await scr.activateComponent('service.component');

      expect(registerServiceSpy).toHaveBeenCalledWith(
        ['TestService', 'AnotherService'],
        expect.any(ServiceComponent),
        expect.any(Object),
      );

      const entry = scr.getComponent('service.component');
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

      scr.registerComponent(ServiceComponent);
      await scr.activateComponent('service.component');
      await scr.deactivateComponent('service.component');

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

      await scr.registerComponent(DiscoverableService);
      await scr.activateComponent('discoverable.service');

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
      await scr.registerComponent(ProviderService);
      await scr.activateComponent('provider.service');

      // Then register and activate consumer
      await scr.registerComponent(ConsumerComponent);
      await scr.activateComponent('consumer.component');

      const consumerEntry = scr.getComponent('consumer.component');
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
      await scr.registerComponent(Provider1);
      await scr.registerComponent(Provider2);
      await scr.activateComponent('provider1');
      await scr.activateComponent('provider2');

      // Then register consumer
      await scr.registerComponent(MultiConsumer);
      await scr.activateComponent('multi.consumer');

      const consumerEntry = scr.getComponent('multi.consumer');
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

      scr.registerComponent(MandatoryConsumer);

      await expect(scr.activateComponent('mandatory.consumer')).rejects.toThrow(
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

      scr.registerComponent(FailingComponent);

      await expect(scr.activateComponent('failing.component')).rejects.toThrow('Activation failed');

      expect(unregisterSpy).toHaveBeenCalled();

      const entry = scr.getComponent('failing.component');
      expect(entry?.instance).toBeNull();
    });

    it('should throw error for invalid component constructor', async () => {
      const invalidMetadata = {
        name: 'invalid.component',
        class: 'not-a-function', // Invalid constructor
      };

      (scr as any).components.set('invalid.component', {
        instance: null,
        metadata: invalidMetadata,
      });

      await expect(scr.activateComponent('invalid.component')).rejects.toThrow(
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

      scr.registerComponent(ConfigurableComponent);
      await scr.activateComponent('configurable.component');

      const newConfig = { key: 'value', updated: true };
      await (scr as any).updateComponentConfiguration('configurable.component', newConfig);

      expect(lastConfig).toEqual(newConfig);
    });

    it('should throw error when updating configuration of inactive component', async () => {
      @Component({ name: 'inactive.config.component' })
      class InactiveConfigComponent {}

      scr.registerComponent(InactiveConfigComponent);

      await expect((scr as any).updateComponentConfiguration('inactive.config.component', {})).rejects.toThrow(
        'Component inactive.config.component not active',
      );
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

      scr.registerComponent(DynamicComponent);
      await scr.activateComponent('dynamic.component');

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

      scr.registerComponent(UpdateComponent);
      await scr.activateComponent('update.component');

      // Simulate service modified event
      await scr.processServiceEvent('UpdateService', 'modified', mockServiceRef);

      expect(updateTracker).toEqual([updatedService]);
      expect(bundleContext.getService).toHaveBeenCalledWith(mockServiceRef);
    });
  });
});
