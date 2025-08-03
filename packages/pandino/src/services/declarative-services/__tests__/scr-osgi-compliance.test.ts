import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OSGiFramework } from '~/framework/framework';
import type { BundleContext } from '~/framework/interfaces';
import { ServiceComponentRuntime } from '../scr';
import { Activate, Component, Reference, Service } from '@pandino/decorators';

describe('SCR OSGi Specification Compliance', () => {
  let framework: OSGiFramework;
  let scr: ServiceComponentRuntime;
  let bundleContext: BundleContext;

  beforeEach(async () => {
    framework = new OSGiFramework();
    await framework.start();
    bundleContext = framework.getBundleContext();
    scr = new ServiceComponentRuntime(framework, bundleContext);
  });

  describe('Immediate Component Activation Rules', () => {
    it('should NOT activate immediate component with unsatisfied mandatory reference (1..1)', async () => {
      const activationTracker: string[] = [];

      @Component({ name: 'dependent.immediate', immediate: true })
      class DependentImmediateComponent {
        @Reference({
          interface: 'RequiredService',
          cardinality: '1..1',
          bind: 'bindService',
        })
        bindService(_service: any) {}

        @Activate
        activate() {
          activationTracker.push('dependent-activated');
        }
      }

      // Register the component - it should NOT be activated yet
      const bundleId = bundleContext.getBundle().getBundleId();
      await scr.registerComponent(DependentImmediateComponent, bundleId);

      const entry = scr.getComponent(bundleId, 'dependent.immediate');
      expect(entry).toBeDefined();
      expect(entry?.instance).toBeNull(); // Should not be activated
      expect(activationTracker).toEqual([]); // No activation should have occurred
    });

    it('should NOT activate immediate component with unsatisfied mandatory reference (1..n)', async () => {
      const activationTracker: string[] = [];

      @Component({ name: 'multi.dependent.immediate', immediate: true })
      class MultiDependentImmediateComponent {
        @Reference({
          interface: 'MultiRequiredService',
          cardinality: '1..n',
          bind: 'bindService',
        })
        bindService(_service: any) {}

        @Activate
        activate() {
          activationTracker.push('multi-dependent-activated');
        }
      }

      const bundleId = bundleContext.getBundle().getBundleId();
      await scr.registerComponent(MultiDependentImmediateComponent, bundleId);

      const entry = scr.getComponent(bundleId, 'multi.dependent.immediate');
      expect(entry).toBeDefined();
      expect(entry?.instance).toBeNull();
      expect(activationTracker).toEqual([]);
    });

    it('should activate immediate component with satisfied mandatory reference (1..1)', async () => {
      const activationTracker: string[] = [];

      @Component({ name: 'required.service' })
      @Service({ interfaces: ['RequiredService'] })
      class RequiredServiceImpl {
        @Activate
        activate() {}

        getValue(): string {
          return 'required-value';
        }
      }

      @Component({ name: 'dependent.immediate', immediate: true })
      class DependentImmediateComponent {
        private requiredService?: any;

        @Reference({
          interface: 'RequiredService',
          cardinality: '1..1',
          bind: 'bindService',
        })
        bindService(service: any) {
          this.requiredService = service;
        }

        @Activate
        activate() {
          activationTracker.push('dependent-activated');
        }

        getRequiredValue(): string {
          return this.requiredService?.getValue() || 'no-service';
        }
      }

      const bundleId = bundleContext.getBundle().getBundleId();
      await scr.registerComponent(RequiredServiceImpl, bundleId);
      await scr.activateComponent(bundleId, 'required.service');

      // Register the immediate component - it should activate automatically
      await scr.registerComponent(DependentImmediateComponent, bundleId);

      const entry = scr.getComponent(bundleId, 'dependent.immediate');
      expect(entry).toBeDefined();
      expect(entry?.instance).toBeInstanceOf(DependentImmediateComponent);
      expect(activationTracker).toEqual(['dependent-activated']);
      expect(entry!.instance.getRequiredValue()).toBe('required-value');
    });

    it('should activate immediate component with satisfied mandatory references (1..n)', async () => {
      const activationTracker: string[] = [];
      const boundServices: number[] = [];

      @Component({ name: 'multi.service.1' })
      @Service({ interfaces: ['MultiRequiredService'] })
      class MultiService1 {
        @Activate
        activate() {}

        getId(): number {
          return 1;
        }
      }

      @Component({ name: 'multi.service.2' })
      @Service({ interfaces: ['MultiRequiredService'] })
      class MultiService2 {
        @Activate
        activate() {}

        getId(): number {
          return 2;
        }
      }

      @Component({ name: 'multi.dependent.immediate', immediate: true })
      class MultiDependentImmediateComponent {
        @Reference({
          interface: 'MultiRequiredService',
          cardinality: '1..n',
          bind: 'bindService',
        })
        bindService(service: MultiService1 | MultiService2) {
          boundServices.push(service.getId());
        }

        @Activate
        activate() {
          activationTracker.push('multi-dependent-activated');
        }
      }

      // Register and activate the required services first
      const bundleId = bundleContext.getBundle().getBundleId();
      await scr.registerComponent(MultiService1, bundleId);
      await scr.registerComponent(MultiService2, bundleId);
      await scr.activateComponent(bundleId, 'multi.service.1');
      await scr.activateComponent(bundleId, 'multi.service.2');

      // Now register the immediate component - it should activate automatically
      await scr.registerComponent(MultiDependentImmediateComponent, bundleId);

      const entry = scr.getComponent(bundleId, 'multi.dependent.immediate');
      expect(entry).toBeDefined();
      expect(entry?.instance).toBeInstanceOf(MultiDependentImmediateComponent);
      expect(activationTracker).toEqual(['multi-dependent-activated']);
      expect(boundServices.sort()).toEqual([1, 2]);
    });

    it('should activate immediate component when optional references are not satisfied (0..1)', async () => {
      const activationTracker: string[] = [];

      @Component({ name: 'optional.dependent.immediate', immediate: true })
      class OptionalDependentImmediateComponent {
        @Reference({
          interface: 'OptionalService',
          cardinality: '0..1',
          bind: 'bindService',
        })
        bindService(_service: any) {}

        @Activate
        activate() {
          activationTracker.push('optional-dependent-activated');
        }
      }

      // Register the component - it should be activated despite missing optional service
      const bundleId = bundleContext.getBundle().getBundleId();
      await scr.registerComponent(OptionalDependentImmediateComponent, bundleId);

      const entry = scr.getComponent(bundleId, 'optional.dependent.immediate');
      expect(entry).toBeDefined();
      expect(entry?.instance).toBeInstanceOf(OptionalDependentImmediateComponent);
      expect(activationTracker).toEqual(['optional-dependent-activated']);
    });

    it('should activate immediate component when optional references are not satisfied (0..n)', async () => {
      const activationTracker: string[] = [];

      @Component({ name: 'multi.optional.dependent.immediate', immediate: true })
      class MultiOptionalDependentImmediateComponent {
        @Reference({
          interface: 'MultiOptionalService',
          cardinality: '0..n',
          bind: 'bindService',
        })
        bindService(_service: any) {}

        @Activate
        activate() {
          activationTracker.push('multi-optional-dependent-activated');
        }
      }

      const bundleId = bundleContext.getBundle().getBundleId();
      await scr.registerComponent(MultiOptionalDependentImmediateComponent, bundleId);

      const entry = scr.getComponent(bundleId, 'multi.optional.dependent.immediate');
      expect(entry).toBeDefined();
      expect(entry?.instance).toBeInstanceOf(MultiOptionalDependentImmediateComponent);
      expect(activationTracker).toEqual(['multi-optional-dependent-activated']);
    });
  });

  describe('Dynamic Activation on Dependency Availability', () => {
    it('should activate immediate component when mandatory dependency becomes available', async () => {
      const activationTracker: string[] = [];
      const serviceBindTracker: string[] = [];

      @Component({ name: 'delayed.dependent.immediate', immediate: true })
      class DelayedDependentImmediateComponent {
        @Reference({
          interface: 'DelayedRequiredService',
          cardinality: '1..1',
          bind: 'bindService',
        })
        bindService(_service: any) {
          serviceBindTracker.push('service-bound');
        }

        @Activate
        activate() {
          activationTracker.push('delayed-dependent-activated');
        }
      }

      @Component({ name: 'delayed.required.service' })
      @Service({ interfaces: ['DelayedRequiredService'] })
      class DelayedRequiredService {
        @Activate
        activate() {}

        getValue(): string {
          return 'delayed-value';
        }
      }

      // Register the dependent component first - should not activate
      const bundleId = bundleContext.getBundle().getBundleId();
      await scr.registerComponent(DelayedDependentImmediateComponent, bundleId);
      expect(scr.getComponent(bundleId, 'delayed.dependent.immediate')?.instance).toBeNull();
      expect(activationTracker).toEqual([]);

      // Now register and activate the required service
      await scr.registerComponent(DelayedRequiredService, bundleId);
      await scr.activateComponent(bundleId, 'delayed.required.service');

      // Simulate service registration event to trigger dependency resolution
      const serviceRefs = bundleContext.getServiceReferences('DelayedRequiredService');
      if (serviceRefs && serviceRefs.length > 0) {
        await scr.processServiceEvent('DelayedRequiredService', 'registered', serviceRefs[0]);
      }

      // Now the immediate component should be activated
      const entry = scr.getComponent(bundleId, 'delayed.dependent.immediate');
      expect(entry?.instance).toBeInstanceOf(DelayedDependentImmediateComponent);
      expect(activationTracker).toEqual(['delayed-dependent-activated']);
      expect(serviceBindTracker).toEqual(['service-bound']);
    });

    it('should activate multiple immediate components when shared dependency becomes available', async () => {
      const activationTracker: string[] = [];

      @Component({ name: 'shared.dependent.1', immediate: true })
      class SharedDependent1 {
        @Reference({
          interface: 'SharedRequiredService',
          cardinality: '1..1',
          bind: 'bindService',
        })
        bindService(_service: any) {}

        @Activate
        activate() {
          activationTracker.push('shared-dependent-1-activated');
        }
      }

      @Component({ name: 'shared.dependent.2', immediate: true })
      class SharedDependent2 {
        @Reference({
          interface: 'SharedRequiredService',
          cardinality: '1..1',
          bind: 'bindService',
        })
        bindService(_service: any) {}

        @Activate
        activate() {
          activationTracker.push('shared-dependent-2-activated');
        }
      }

      @Component({ name: 'shared.required.service' })
      @Service({ interfaces: ['SharedRequiredService'] })
      class SharedRequiredService {
        @Activate
        activate() {}
      }

      // Register dependent components first - neither should activate
      const bundleId = bundleContext.getBundle().getBundleId();
      await scr.registerComponent(SharedDependent1, bundleId);
      await scr.registerComponent(SharedDependent2, bundleId);
      expect(scr.getComponent(bundleId, 'shared.dependent.1')?.instance).toBeNull();
      expect(scr.getComponent(bundleId, 'shared.dependent.2')?.instance).toBeNull();
      expect(activationTracker).toEqual([]);

      // Register and activate the shared required service
      await scr.registerComponent(SharedRequiredService, bundleId);
      await scr.activateComponent(bundleId, 'shared.required.service');

      // Simulate service registration event
      const serviceRefs = bundleContext.getServiceReferences('SharedRequiredService');
      if (serviceRefs && serviceRefs.length > 0) {
        await scr.processServiceEvent('SharedRequiredService', 'registered', serviceRefs[0]);
      }

      // Both immediate components should now be activated
      expect(scr.getComponent(bundleId, 'shared.dependent.1')?.instance).toBeInstanceOf(SharedDependent1);
      expect(scr.getComponent(bundleId, 'shared.dependent.2')?.instance).toBeInstanceOf(SharedDependent2);
      expect(activationTracker.sort()).toEqual(['shared-dependent-1-activated', 'shared-dependent-2-activated']);
    });
  });

  describe('Configuration Policy Compliance', () => {
    it('should NOT activate immediate component with configurationPolicy=require when no configuration is available', async () => {
      const activationTracker: string[] = [];

      @Component({
        name: 'config.required.immediate',
        immediate: true,
        configurationPolicy: 'require',
        configurationPid: 'test.config.pid',
      })
      class ConfigRequiredImmediateComponent {
        @Activate
        activate() {
          activationTracker.push('config-required-activated');
        }
      }

      const bundleId = bundleContext.getBundle().getBundleId();
      await scr.registerComponent(ConfigRequiredImmediateComponent, bundleId);

      const entry = scr.getComponent(bundleId, 'config.required.immediate');
      expect(entry).toBeDefined();
      expect(entry?.instance).toBeNull(); // Should not be activated without configuration
      expect(activationTracker).toEqual([]);
    });

    it('should activate immediate component with configurationPolicy=optional regardless of configuration', async () => {
      const activationTracker: string[] = [];

      @Component({
        name: 'config.optional.immediate',
        immediate: true,
        configurationPolicy: 'optional',
      })
      class ConfigOptionalImmediateComponent {
        @Activate
        activate() {
          activationTracker.push('config-optional-activated');
        }
      }

      const bundleId = bundleContext.getBundle().getBundleId();
      await scr.registerComponent(ConfigOptionalImmediateComponent, bundleId);

      const entry = scr.getComponent(bundleId, 'config.optional.immediate');
      expect(entry).toBeDefined();
      expect(entry?.instance).toBeInstanceOf(ConfigOptionalImmediateComponent);
      expect(activationTracker).toEqual(['config-optional-activated']);
    });
  });

  describe('Complex Dependency Scenarios', () => {
    it('should handle immediate component with mixed mandatory and optional references', async () => {
      const activationTracker: string[] = [];
      const boundServices: string[] = [];

      @Component({ name: 'mixed.dependency.immediate', immediate: true })
      class MixedDependencyImmediateComponent {
        @Reference({
          interface: 'MandatoryService',
          cardinality: '1..1',
          bind: 'bindMandatory',
        })
        bindMandatory(_service: any) {
          boundServices.push('mandatory');
        }

        @Reference({
          interface: 'OptionalService',
          cardinality: '0..1',
          bind: 'bindOptional',
        })
        bindOptional(_service: any) {
          boundServices.push('optional');
        }

        @Activate
        activate() {
          activationTracker.push('mixed-dependency-activated');
        }
      }

      @Component({ name: 'mandatory.service' })
      @Service({ interfaces: ['MandatoryService'] })
      class MandatoryService {
        @Activate
        activate() {}
      }

      // Register the immediate component first - should not activate (missing mandatory service)
      const bundleId = bundleContext.getBundle().getBundleId();
      await scr.registerComponent(MixedDependencyImmediateComponent, bundleId);
      expect(scr.getComponent(bundleId, 'mixed.dependency.immediate')?.instance).toBeNull();

      // Register and activate the mandatory service
      await scr.registerComponent(MandatoryService, bundleId);
      await scr.activateComponent(bundleId, 'mandatory.service');

      // Simulate service registration event
      const serviceRefs = bundleContext.getServiceReferences('MandatoryService');
      if (serviceRefs && serviceRefs.length > 0) {
        await scr.processServiceEvent('MandatoryService', 'registered', serviceRefs[0]);
      }

      // Now the component should be activated (even without optional service)
      const entry = scr.getComponent(bundleId, 'mixed.dependency.immediate');
      expect(entry?.instance).toBeInstanceOf(MixedDependencyImmediateComponent);
      expect(activationTracker).toEqual(['mixed-dependency-activated']);
      expect(boundServices).toEqual(['mandatory']); // Only mandatory service bound
    });

    it('should handle activation failure and not leave component in inconsistent state', async () => {
      const activationAttempts: string[] = [];

      @Component({ name: 'failing.immediate', immediate: true })
      class FailingImmediateComponent {
        @Activate
        activate() {
          activationAttempts.push('activation-attempt');
          throw new Error('Activation failed intentionally');
        }
      }

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const bundleId = bundleContext.getBundle().getBundleId();
      await scr.registerComponent(FailingImmediateComponent, bundleId);

      const entry = scr.getComponent(bundleId, 'failing.immediate');
      expect(entry).toBeDefined();
      expect(entry?.instance).toBeNull(); // Should remain null after failed activation
      expect(activationAttempts).toEqual(['activation-attempt']);

      // Should have logged a warning but not thrown
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to activate immediate component failing.immediate'),
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Non-Immediate Component Behavior', () => {
    it('should NOT automatically activate non-immediate components on registration', async () => {
      const activationTracker: string[] = [];

      @Component({ name: 'non.immediate', immediate: false })
      class NonImmediateComponent {
        @Activate
        activate() {
          activationTracker.push('non-immediate-activated');
        }
      }

      const bundleId = bundleContext.getBundle().getBundleId();
      await scr.registerComponent(NonImmediateComponent, bundleId);

      const entry = scr.getComponent(bundleId, 'non.immediate');
      expect(entry).toBeDefined();
      expect(entry?.instance).toBeNull(); // Should not be activated automatically
      expect(activationTracker).toEqual([]);
    });

    it('should NOT automatically activate components without immediate flag (default behavior)', async () => {
      const activationTracker: string[] = [];

      @Component({ name: 'default.component' }) // No immediate flag specified
      class DefaultComponent {
        @Activate
        activate() {
          activationTracker.push('default-activated');
        }
      }

      const bundleId = bundleContext.getBundle().getBundleId();
      await scr.registerComponent(DefaultComponent, bundleId);

      const entry = scr.getComponent(bundleId, 'default.component');
      expect(entry).toBeDefined();
      expect(entry?.instance).toBeNull(); // Should not be activated automatically
      expect(activationTracker).toEqual([]);
    });
  });
});
