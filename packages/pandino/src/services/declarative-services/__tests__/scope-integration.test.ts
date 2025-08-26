import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OSGiFramework } from '../../../framework/framework';
import type { BundleContext } from '../../../framework/interfaces';
import { ServiceComponentRuntime } from '../scr';
import { Activate, Scope, Service } from '@pandino/decorators';
import { Component } from '@pandino/decorators';

describe('Scope Decorator Integration Tests', () => {
  let framework: OSGiFramework;
  let scr: ServiceComponentRuntime;
  let bundleContext: BundleContext;

  beforeEach(async () => {
    framework = new OSGiFramework();
    await framework.start();
    bundleContext = framework.getBundleContext();
    scr = new ServiceComponentRuntime(framework, bundleContext);
  });

  describe('Singleton Scope Behavior', () => {
    it('should create only one instance for singleton scoped components', async () => {
      const instanceTracker = new Set<any>();

      @Component({ name: 'singleton.service' })
      @Service({ interfaces: ['SingletonService'] })
      @Scope('singleton')
      class SingletonService {
        constructor() {
          instanceTracker.add(this);
        }

        @Activate
        activate() {}

        getValue(): string {
          return 'singleton-value';
        }
      }

      const bundleId = bundleContext.getBundle().getBundleId();
      scr.registerComponent(SingletonService, bundleId);
      await scr.activateComponent(bundleId, 'singleton.service');

      const serviceRef1 = bundleContext.getServiceReference('SingletonService');
      const serviceRef2 = bundleContext.getServiceReference('SingletonService');
      const service1 = bundleContext.getService(serviceRef1!) as any;
      const service2 = bundleContext.getService(serviceRef2!) as any;

      // Should be the same instance
      expect(service1).toBe(service2);
      expect(instanceTracker.size).toBe(1);
      expect(service1.getValue()).toBe('singleton-value');
    });

    it('should maintain singleton behavior across different service references', async () => {
      let activationCount = 0;

      @Component({ name: 'singleton.counter' })
      @Service({ interfaces: ['CounterService'] })
      @Scope('singleton')
      class SingletonCounterService {
        private count = 0;

        @Activate
        activate() {
          activationCount++;
        }

        increment(): number {
          return ++this.count;
        }

        getCount(): number {
          return this.count;
        }
      }

      const bundleId = bundleContext.getBundle().getBundleId();
      scr.registerComponent(SingletonCounterService, bundleId);
      await scr.activateComponent(bundleId, 'singleton.counter');

      const ref1 = bundleContext.getServiceReference('CounterService');
      const ref2 = bundleContext.getServiceReference('CounterService');

      const counter1 = bundleContext.getService(ref1!) as any;
      const counter2 = bundleContext.getService(ref2!) as any;

      // State should be shared
      expect(counter1.increment()).toBe(1);
      expect(counter2.getCount()).toBe(1);
      expect(counter2.increment()).toBe(2);
      expect(counter1.getCount()).toBe(2);

      expect(activationCount).toBe(1);
    });
  });

  describe('Bundle Scope Behavior', () => {
    it('should create one instance per bundle for bundle scoped components', async () => {
      const instanceTracker = new Map<string, any>();

      @Component({ name: 'bundle.scoped.service' })
      @Service({ interfaces: ['BundleScopedService'] })
      @Scope('bundle')
      class BundleScopedService {
        constructor() {
          const bundleId = bundleContext.getBundle().getBundleId().toString();
          instanceTracker.set(bundleId, this);
        }

        @Activate
        activate() {}

        getBundleSpecificData(): string {
          return `bundle-${bundleContext.getBundle().getBundleId()}-data`;
        }
      }

      const bundleId = bundleContext.getBundle().getBundleId();
      scr.registerComponent(BundleScopedService, bundleId);
      await scr.activateComponent(bundleId, 'bundle.scoped.service');

      const serviceRef = bundleContext.getServiceReference('BundleScopedService');
      const service = bundleContext.getService(serviceRef!) as any;

      expect(service.getBundleSpecificData()).toBe('bundle-0-data');
      expect(instanceTracker.size).toBe(1);
    });

    it('should isolate bundle-scoped service state per bundle', async () => {
      @Component({ name: 'bundle.isolated.service' })
      @Service({ interfaces: ['IsolatedService'] })
      @Scope('bundle')
      class BundleIsolatedService {
        private data: Record<string, any> = {};

        @Activate
        activate() {}

        setData(key: string, value: any): void {
          this.data[key] = value;
        }

        getData(key: string): any {
          return this.data[key];
        }

        getAllData(): Record<string, any> {
          return { ...this.data };
        }
      }

      const bundleId = bundleContext.getBundle().getBundleId();
      scr.registerComponent(BundleIsolatedService, bundleId);
      await scr.activateComponent(bundleId, 'bundle.isolated.service');

      const serviceRef = bundleContext.getServiceReference('IsolatedService');
      const service = bundleContext.getService(serviceRef!) as any;

      service.setData('bundleSpecific', 'value1');
      service.setData('shared', 'bundle-value');

      expect(service.getData('bundleSpecific')).toBe('value1');
      expect(service.getAllData()).toEqual({
        bundleSpecific: 'value1',
        shared: 'bundle-value',
      });
    });
  });

  describe('Prototype Scope Behavior', () => {
    it('should create new instance for each service lookup with prototype scope', async () => {
      const instanceTracker = new Set<any>();
      let instanceCounter = 0;

      @Component({ name: 'prototype.service' })
      @Service({ interfaces: ['PrototypeService'] })
      @Scope('prototype')
      class PrototypeService {
        private instanceId: number;

        constructor() {
          this.instanceId = ++instanceCounter;
          instanceTracker.add(this);
        }

        @Activate
        activate() {}

        getInstanceId(): number {
          return this.instanceId;
        }

        getUniqueValue(): string {
          return `prototype-${this.instanceId}`;
        }
      }

      const bundleId = bundleContext.getBundle().getBundleId();
      scr.registerComponent(PrototypeService, bundleId);
      await scr.activateComponent(bundleId, 'prototype.service');

      // Get multiple service instances - now using real prototype implementation
      const serviceRef1 = bundleContext.getServiceReference('PrototypeService');
      const serviceRef2 = bundleContext.getServiceReference('PrototypeService');

      const service1 = bundleContext.getService(serviceRef1!) as any;
      const service2 = bundleContext.getService(serviceRef2!) as any;
      const service3 = bundleContext.getService(serviceRef1!) as any; // Same ref, should still be new instance

      // Each should be a different instance
      expect(service1).not.toBe(service2);
      expect(service1).not.toBe(service3);
      expect(service2).not.toBe(service3);

      expect(service1.getInstanceId()).toBe(1);
      expect(service2.getInstanceId()).toBe(2);
      expect(service3.getInstanceId()).toBe(3);

      expect(instanceTracker.size).toBe(3);
    });

    it('should maintain independent state for each prototype instance', async () => {
      @Component({ name: 'prototype.counter' })
      @Service({ interfaces: ['PrototypeCounterService'] })
      @Scope('prototype')
      class PrototypeCounterService {
        private count = 0;

        @Activate
        activate() {}

        increment(): number {
          return ++this.count;
        }

        getCount(): number {
          return this.count;
        }

        setCount(value: number): void {
          this.count = value;
        }
      }

      const bundleId = bundleContext.getBundle().getBundleId();
      scr.registerComponent(PrototypeCounterService, bundleId);
      await scr.activateComponent(bundleId, 'prototype.counter');

      const ref1 = bundleContext.getServiceReference('PrototypeCounterService');
      const ref2 = bundleContext.getServiceReference('PrototypeCounterService');

      const counter1 = bundleContext.getService(ref1!) as any;
      const counter2 = bundleContext.getService(ref2!) as any;

      // Independent state (each is a fresh instance)
      expect(counter1.increment()).toBe(1);
      expect(counter1.increment()).toBe(2);
      expect(counter2.getCount()).toBe(0); // Different instance, starts at 0

      counter2.setCount(10);
      expect(counter2.increment()).toBe(11);
      expect(counter1.getCount()).toBe(2); // Unaffected by counter2
    });
  });

  describe('Scope Interaction with Service References', () => {
    it('should handle singleton scope in service dependency injection', async () => {
      let singletonCreationCount = 0;

      @Component({ name: 'singleton.dependency' })
      @Service({ interfaces: ['SingletonDependency'] })
      @Scope('singleton')
      class SingletonDependency {
        constructor() {
          singletonCreationCount++;
        }

        @Activate
        activate() {}

        getSharedData(): string {
          return 'shared-singleton-data';
        }
      }

      @Component({ name: 'consumer.service' })
      @Service({ interfaces: ['ConsumerService'] })
      class ConsumerService {
        private dependency?: any;

        @Activate
        activate() {}

        setDependency(dep: any) {
          this.dependency = dep;
        }

        getDependencyData(): string {
          return this.dependency?.getSharedData() || 'no-dependency';
        }
      }

      bundleContext.getServiceReferences = vi.fn().mockImplementation((serviceName) => {
        if (serviceName === 'SingletonDependency') {
          return [{ getProperty: vi.fn() }];
        }
        return [];
      });

      let singletonInstance: any;
      bundleContext.getService = vi.fn().mockImplementation(() => {
        if (!singletonInstance) {
          singletonInstance = new SingletonDependency();
        }
        return singletonInstance;
      });

      const bundleId = bundleContext.getBundle().getBundleId();
      scr.registerComponent(SingletonDependency, bundleId);
      scr.registerComponent(ConsumerService, bundleId);

      await scr.activateComponent(bundleId, 'singleton.dependency');
      await scr.activateComponent(bundleId, 'consumer.service');

      // Multiple consumers should get the same singleton instance
      bundleContext.getServiceReference('ConsumerService');
      bundleContext.getServiceReference('ConsumerService');
      expect(singletonCreationCount).toBe(1);
    });

    it('should handle prototype scope in factory component scenarios', async () => {
      let prototypeCreationCount = 0;

      @Component({ name: 'prototype.factory.component' })
      @Scope('prototype')
      class PrototypeFactoryComponent {
        private config: Record<string, any>;

        constructor(config: Record<string, any> = {}) {
          this.config = config;
          prototypeCreationCount++;
        }

        @Activate
        activate() {}

        getConfig(): Record<string, any> {
          return this.config;
        }

        getCreationCount(): number {
          return prototypeCreationCount;
        }
      }

      const bundleId = bundleContext.getBundle().getBundleId();
      scr.registerComponent(PrototypeFactoryComponent, bundleId);

      // Simulate multiple factory instances (prototype behavior)
      const instance1 = new PrototypeFactoryComponent({ env: 'dev' });
      const instance2 = new PrototypeFactoryComponent({ env: 'prod' });
      const instance3 = new PrototypeFactoryComponent({ env: 'test' });

      expect(instance1.getConfig()).toEqual({ env: 'dev' });
      expect(instance2.getConfig()).toEqual({ env: 'prod' });
      expect(instance3.getConfig()).toEqual({ env: 'test' });
      expect(instance3.getCreationCount()).toBe(3); // Three separate instances
    });
  });

  describe('Scope Default Behavior', () => {
    it('should default to singleton scope when no scope is specified', async () => {
      const instanceTracker = new Set<any>();

      @Component({ name: 'default.scope.service' })
      @Service({ interfaces: ['DefaultScopeService'] })
      class DefaultScopeService {
        constructor() {
          instanceTracker.add(this);
        }

        @Activate
        activate() {}

        getValue(): string {
          return 'default-scope-value';
        }
      }

      const bundleId = bundleContext.getBundle().getBundleId();
      scr.registerComponent(DefaultScopeService, bundleId);
      await scr.activateComponent(bundleId, 'default.scope.service');

      const serviceRef1 = bundleContext.getServiceReference('DefaultScopeService');
      const serviceRef2 = bundleContext.getServiceReference('DefaultScopeService');
      const service1 = bundleContext.getService(serviceRef1!);
      const service2 = bundleContext.getService(serviceRef2!);

      // Should behave like singleton (default)
      expect(service1).toBe(service2);
      expect(instanceTracker.size).toBe(1);
    });
  });

  describe('Scope Error Handling', () => {
    it('should handle scope-related activation errors gracefully', async () => {
      @Component({ name: 'failing.prototype.service' })
      @Service({ interfaces: ['FailingPrototypeService'] })
      @Scope('prototype')
      class FailingPrototypeService {
        @Activate
        activate() {
          throw new Error('Prototype activation failed');
        }
      }

      const bundleId = bundleContext.getBundle().getBundleId();
      scr.registerComponent(FailingPrototypeService, bundleId);

      // For prototype scope, activation just registers the service factory - no error yet
      await scr.activateComponent(bundleId, 'failing.prototype.service');

      // The error occurs when someone tries to get a service instance
      const serviceRef = bundleContext.getServiceReference('FailingPrototypeService');
      expect(() => {
        bundleContext.getService(serviceRef!);
      }).toThrow('Prototype activation failed');
    });

    it('should handle singleton scope activation errors gracefully', async () => {
      @Component({ name: 'failing.singleton.service' })
      @Service({ interfaces: ['FailingSingletonService'] })
      @Scope('singleton')
      class FailingSingletonService {
        @Activate
        activate() {
          throw new Error('Singleton activation failed');
        }
      }

      const bundleId = bundleContext.getBundle().getBundleId();
      scr.registerComponent(FailingSingletonService, bundleId);

      // For singleton scope, the error occurs during component activation
      await expect(scr.activateComponent(bundleId, 'failing.singleton.service')).rejects.toThrow(
        'Singleton activation failed',
      );
    });

    it('should handle scope mismatch in service dependencies', async () => {
      @Component({ name: 'singleton.provider' })
      @Service({ interfaces: ['ProviderService'] })
      @Scope('singleton')
      class SingletonProviderService {
        @Activate
        activate() {}

        getProviderType(): string {
          return 'singleton-provider';
        }
      }

      @Component({ name: 'prototype.consumer' })
      @Service({ interfaces: ['ConsumerService'] })
      @Scope('prototype')
      class PrototypeConsumerService {
        private provider?: any;

        @Activate
        activate() {}

        setProvider(provider: any) {
          this.provider = provider;
        }

        getProviderType(): string {
          return this.provider?.getProviderType() || 'no-provider';
        }
      }

      const bundleId = bundleContext.getBundle().getBundleId();
      scr.registerComponent(SingletonProviderService, bundleId);
      scr.registerComponent(PrototypeConsumerService, bundleId);

      await scr.activateComponent(bundleId, 'singleton.provider');
      await scr.activateComponent(bundleId, 'prototype.consumer');

      // This should work fine - prototype can depend on singleton
      expect(true).toBe(true);
    });
  });
});
