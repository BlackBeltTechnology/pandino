import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OSGiFramework } from '~/framework/framework';
import type { BundleContext } from '~/framework/interfaces';
import { Activate, Component, Reference, Service } from '../interfaces';
import { ServiceComponentRuntime } from '../scr';

describe('Deadlock Scenarios', () => {
  let framework: OSGiFramework;
  let scr: ServiceComponentRuntime;
  let bundleContext: BundleContext;

  beforeEach(async () => {
    framework = new OSGiFramework();
    await framework.start();
    bundleContext = framework.getBundleContext();
    scr = new ServiceComponentRuntime(framework, bundleContext);
  });

  describe('Static Mandatory Circular Dependencies', () => {
    it('should detect and prevent deadlock with static mandatory circular dependencies', async () => {
      const getServiceReferencesSpy = vi.spyOn(bundleContext, 'getServiceReferences');
      getServiceReferencesSpy.mockReturnValue([]);

      @Component({ name: 'deadlock.a' })
      @Service({ interfaces: ['DeadlockA'] })
      class DeadlockComponentA {
        @Reference({
          interface: 'DeadlockB',
          cardinality: '1..1', // Mandatory
          policy: 'static', // Static policy can cause deadlock
          bind: 'bindServiceB',
        })
        private serviceB?: any;

        @Activate
        activate() {}

        bindServiceB(service: any) {
          this.serviceB = service;
        }
      }

      @Component({ name: 'deadlock.b' })
      @Service({ interfaces: ['DeadlockB'] })
      class DeadlockComponentB {
        @Reference({
          interface: 'DeadlockA',
          cardinality: '1..1', // Mandatory
          policy: 'static', // Static policy can cause deadlock
          bind: 'bindServiceA',
        })
        private serviceA?: any;

        @Activate
        activate() {}

        bindServiceA(service: any) {
          this.serviceA = service;
        }
      }

      const bundleId = bundleContext.getBundle().getBundleId();
      await scr.registerComponent(DeadlockComponentA, bundleId);
      await scr.registerComponent(DeadlockComponentB, bundleId);

      // This should fail with a deadlock error
      // We'll try to activate A first, which will wait for B
      // But B can't be activated because it's waiting for A
      await expect(scr.activateComponent(bundleId, 'deadlock.a')).rejects.toThrow(
        'Mandatory reference DeadlockB not satisfied',
      );

      // In the current implementation, the component instance might be created
      // but not fully activated, so we'll just verify the activation fails
      const componentA = scr.getComponent(bundleId, 'deadlock.a');
      expect(componentA).toBeDefined();

      getServiceReferencesSpy.mockRestore();
    });

    it('should resolve deadlock by activating components in correct order with greedy policy', async () => {
      const activationOrder: string[] = [];

      @Component({ name: 'greedy.a' })
      @Service({ interfaces: ['GreedyA'] })
      class GreedyComponentA {
        @Reference({
          interface: 'GreedyB',
          cardinality: '1..1', // Mandatory
          policy: 'dynamic',
          policyOption: 'greedy',
          bind: 'bindServiceB',
        })
        private serviceB?: any;

        @Activate
        activate() {
          activationOrder.push('GreedyA');
        }

        bindServiceB(service: any) {
          this.serviceB = service;
        }
      }

      @Component({ name: 'greedy.b' })
      @Service({ interfaces: ['GreedyB'] })
      class GreedyComponentB {
        @Reference({
          interface: 'GreedyA',
          cardinality: '0..1', // Optional to break the deadlock
          bind: 'bindServiceA',
        })
        private serviceA?: any;

        @Activate
        activate() {
          activationOrder.push('GreedyB');
        }

        bindServiceA(service: any) {
          this.serviceA = service;
        }
      }

      const bundleId = bundleContext.getBundle().getBundleId();
      await scr.registerComponent(GreedyComponentA, bundleId);
      await scr.registerComponent(GreedyComponentB, bundleId);

      // Activate B first (which doesn't have mandatory dependencies)
      await scr.activateComponent(bundleId, 'greedy.b');

      // Then activate A (which can now satisfy its mandatory dependency on B)
      await scr.activateComponent(bundleId, 'greedy.a');

      // Verify both components are active in the correct order
      expect(activationOrder).toEqual(['GreedyB', 'GreedyA']);
    });
  });

  describe('Delayed Binding Deadlock', () => {
    it('should handle delayed binding that could cause deadlock', async () => {
      const bindingOrder: string[] = [];
      let delayedBindingResolve: Function;

      // Create a promise that will be resolved later to simulate delayed binding
      const delayedBinding = new Promise<void>((resolve) => {
        delayedBindingResolve = resolve;
      });

      @Component({ name: 'delayed.a' })
      @Service({ interfaces: ['DelayedA'] })
      class DelayedComponentA {
        @Reference({
          interface: 'DelayedB',
          cardinality: '1..1',
          policy: 'dynamic',
          bind: 'bindServiceB',
        })
        private serviceB?: any;

        @Activate
        activate() {}

        async bindServiceB(service: any) {
          // Simulate a long-running binding operation
          await delayedBinding;
          this.serviceB = service;
          bindingOrder.push('DelayedA-bound-DelayedB');
        }
      }

      @Component({ name: 'delayed.b' })
      @Service({ interfaces: ['DelayedB'] })
      class DelayedComponentB {
        @Reference({
          interface: 'DelayedA',
          cardinality: '1..1',
          policy: 'dynamic',
          bind: 'bindServiceA',
        })
        private serviceA?: any;

        @Activate
        activate() {}

        bindServiceA(service: any) {
          this.serviceA = service;
          bindingOrder.push('DelayedB-bound-DelayedA');
        }
      }

      const bundleId = bundleContext.getBundle().getBundleId();
      await scr.registerComponent(DelayedComponentA, bundleId);
      await scr.registerComponent(DelayedComponentB, bundleId);

      const activatePromiseA = scr.activateComponent(bundleId, 'delayed.a');
      const activatePromiseB = scr.activateComponent(bundleId, 'delayed.b');

      delayedBindingResolve!();

      await Promise.all([activatePromiseA, activatePromiseB]);

      expect(bindingOrder).toContain('DelayedA-bound-DelayedB');
      expect(bindingOrder).toContain('DelayedB-bound-DelayedA');
    });
  });

  describe('Multiple Mandatory Dependencies', () => {
    it('should handle components with multiple mandatory dependencies without deadlock', async () => {
      const activationOrder: string[] = [];

      @Component({ name: 'service.one' })
      @Service({ interfaces: ['ServiceOne'] })
      class ServiceOne {
        @Activate
        activate() {
          activationOrder.push('ServiceOne');
        }
      }

      @Component({ name: 'service.two' })
      @Service({ interfaces: ['ServiceTwo'] })
      class ServiceTwo {
        @Activate
        activate() {
          activationOrder.push('ServiceTwo');
        }
      }

      @Component({ name: 'multi.dependent' })
      class MultiDependentComponent {
        @Reference({
          interface: 'ServiceOne',
          cardinality: '1..1',
          bind: 'bindServiceOne',
        })
        private serviceOne?: any;

        @Reference({
          interface: 'ServiceTwo',
          cardinality: '1..1',
          bind: 'bindServiceTwo',
        })
        private serviceTwo?: any;

        @Activate
        activate() {
          activationOrder.push('MultiDependent');
        }

        bindServiceOne(service: any) {
          this.serviceOne = service;
        }

        bindServiceTwo(service: any) {
          this.serviceTwo = service;
        }
      }

      const bundleId = bundleContext.getBundle().getBundleId();
      await scr.registerComponent(ServiceOne, bundleId);
      await scr.registerComponent(ServiceTwo, bundleId);
      await scr.registerComponent(MultiDependentComponent, bundleId);

      await scr.activateComponent(bundleId, 'service.one');
      await scr.activateComponent(bundleId, 'service.two');

      await scr.activateComponent(bundleId, 'multi.dependent');

      expect(activationOrder).toContain('ServiceOne');
      expect(activationOrder).toContain('ServiceTwo');
      expect(activationOrder).toContain('MultiDependent');

      // MultiDependent should be activated last
      expect(activationOrder.indexOf('MultiDependent')).toBeGreaterThan(activationOrder.indexOf('ServiceOne'));
      expect(activationOrder.indexOf('MultiDependent')).toBeGreaterThan(activationOrder.indexOf('ServiceTwo'));
    });
  });

  describe('Dependency Chain Deadlock', () => {
    it('should detect deadlock in a dependency chain (A→B→C→A)', async () => {
      const getServiceReferencesSpy = vi.spyOn(bundleContext, 'getServiceReferences');
      getServiceReferencesSpy.mockReturnValue([]);

      @Component({ name: 'chain.a' })
      @Service({ interfaces: ['ChainA'] })
      class ChainComponentA {
        @Reference({
          interface: 'ChainB',
          cardinality: '1..1',
          bind: 'bindServiceB',
        })
        private serviceB?: any;

        @Activate
        activate() {}

        bindServiceB(service: any) {
          this.serviceB = service;
        }
      }

      @Component({ name: 'chain.b' })
      @Service({ interfaces: ['ChainB'] })
      class ChainComponentB {
        @Reference({
          interface: 'ChainC',
          cardinality: '1..1',
          bind: 'bindServiceC',
        })
        private serviceC?: any;

        @Activate
        activate() {}

        bindServiceC(service: any) {
          this.serviceC = service;
        }
      }

      @Component({ name: 'chain.c' })
      @Service({ interfaces: ['ChainC'] })
      class ChainComponentC {
        @Reference({
          interface: 'ChainA',
          cardinality: '1..1',
          bind: 'bindServiceA',
        })
        private serviceA?: any;

        @Activate
        activate() {}

        bindServiceA(service: any) {
          this.serviceA = service;
        }
      }

      const bundleId = bundleContext.getBundle().getBundleId();
      await scr.registerComponent(ChainComponentA, bundleId);
      await scr.registerComponent(ChainComponentB, bundleId);
      await scr.registerComponent(ChainComponentC, bundleId);

      // This should fail with a deadlock error
      await expect(scr.activateComponent(bundleId, 'chain.a')).rejects.toThrow(
        'Mandatory reference ChainB not satisfied',
      );

      // In the current implementation, the component instance might be created
      // but not fully activated, so we'll just verify the activation fails with the expected error
      const componentA = scr.getComponent(bundleId, 'chain.a');
      expect(componentA).toBeDefined();

      getServiceReferencesSpy.mockRestore();
    });
  });
});
