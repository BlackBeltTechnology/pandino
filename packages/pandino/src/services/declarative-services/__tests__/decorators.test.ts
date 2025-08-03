import { describe, expect, it } from 'vitest';
import {
  Activate,
  Component,
  ConfigurationPolicy,
  Deactivate,
  Factory,
  Immediate,
  Modified,
  Property,
  Reference,
  Scope,
  Service,
} from '../interfaces';
import { getComponentMetadata } from '../reflection';

describe('Declarative Services Decorators', () => {
  describe('Basic Component Decorators', () => {
    it('should properly decorate a component class', () => {
      @Component({
        name: 'test.component',
        immediate: true,
        enabled: true,
        configurationPid: 'test.config',
      })
      class TestComponent {}

      const metadata = getComponentMetadata(TestComponent);
      expect(metadata).toBeDefined();
      expect(metadata.name).toBe('test.component');
      expect(metadata.immediate).toBe(true);
      expect(metadata.enabled).toBe(true);
      expect(metadata.configurationPid).toBe('test.config');
    });

    it('should handle multiple decorators on a class', () => {
      @Component({ name: 'multi.decorator.component' })
      @Service({ interfaces: ['TestService', 'AnotherService'] })
      @Property('service.ranking', 100)
      class MultiDecoratorComponent {}

      const metadata = getComponentMetadata(MultiDecoratorComponent);
      expect(metadata.name).toBe('multi.decorator.component');
      expect(metadata.service.interfaces).toEqual(['TestService', 'AnotherService']);
      expect(metadata.properties['service.ranking']).toBe(100);
    });
  });

  describe('New Decorators', () => {
    it('should apply ConfigurationPolicy decorator', () => {
      @Component({ name: 'config.policy.component' })
      @ConfigurationPolicy('require')
      class ConfigPolicyComponent {}

      const metadata = getComponentMetadata(ConfigPolicyComponent);
      expect(metadata.configurationPolicy).toBe('require');
    });

    it('should apply Factory decorator', () => {
      @Component({ name: 'factory.component' })
      @Factory('test.factory')
      class FactoryComponent {}

      const metadata = getComponentMetadata(FactoryComponent);
      expect(metadata.factory).toBe('test.factory');
    });

    it('should apply Immediate decorator', () => {
      @Component({ name: 'immediate.component' })
      @Immediate
      class ImmediateComponent {}

      const metadata = getComponentMetadata(ImmediateComponent);
      expect(metadata.immediate).toBe(true);
    });

    it('should apply Scope decorator', () => {
      @Component({ name: 'scope.component' })
      @Scope('prototype')
      class ScopeComponent {}

      const metadata = getComponentMetadata(ScopeComponent);
      expect(metadata.service).toBeDefined();
      expect(metadata.service.scope).toBe('prototype');
    });

    it('should apply Scope decorator with all valid scope values', () => {
      @Component({ name: 'singleton.component' })
      @Scope('singleton')
      class SingletonComponent {}

      @Component({ name: 'bundle.component' })
      @Scope('bundle')
      class BundleComponent {}

      @Component({ name: 'prototype.component' })
      @Scope('prototype')
      class PrototypeComponent {}

      const singletonMetadata = getComponentMetadata(SingletonComponent);
      const bundleMetadata = getComponentMetadata(BundleComponent);
      const prototypeMetadata = getComponentMetadata(PrototypeComponent);

      expect(singletonMetadata.service.scope).toBe('singleton');
      expect(bundleMetadata.service.scope).toBe('bundle');
      expect(prototypeMetadata.service.scope).toBe('prototype');
    });

    it('should apply Scope decorator to class without existing component metadata', () => {
      @Scope('bundle')
      class StandaloneComponent {}

      const metadata = getComponentMetadata(StandaloneComponent);
      expect(metadata).toBeDefined();
      expect(metadata.name).toBe('StandaloneComponent');
      expect(metadata.service).toBeDefined();
      expect(metadata.service.interfaces).toEqual(['StandaloneComponent']);
      expect(metadata.service.scope).toBe('bundle');
    });

    it('should apply Scope decorator when component has existing service descriptor', () => {
      @Component({ name: 'existing.service.component' })
      @Service({ interfaces: ['ExistingService'] })
      @Scope('prototype')
      class ExistingServiceComponent {}

      const metadata = getComponentMetadata(ExistingServiceComponent);
      expect(metadata.service.interfaces).toEqual(['ExistingService']); // Preserves existing interfaces
      expect(metadata.service.scope).toBe('prototype'); // Updates scope
    });

    it('should override existing scope when Scope decorator is applied', () => {
      @Component({ name: 'override.scope.component' })
      @Service({ interfaces: ['OverrideService'], scope: 'singleton' })
      @Scope('prototype') // Should override the singleton scope from @Service
      class OverrideScopeComponent {}

      const metadata = getComponentMetadata(OverrideScopeComponent);
      expect(metadata.service.scope).toBe('prototype');
      expect(metadata.service.interfaces).toEqual(['OverrideService']);
    });
  });

  describe('Lifecycle Method Decorators', () => {
    it('should apply Activate, Deactivate, and Modified decorators', () => {
      @Component({ name: 'lifecycle.component' })
      class LifecycleComponent {
        @Activate
        activate() {}

        @Deactivate
        deactivate() {}

        @Modified
        modified() {}
      }

      const metadata = getComponentMetadata(LifecycleComponent);
      expect(metadata.activate).toBe('activate');
      expect(metadata.deactivate).toBe('deactivate');
      expect(metadata.modified).toBe('modified');
    });
  });

  describe('Reference Decorators', () => {
    it('should apply Reference decorator with various options', () => {
      @Component({ name: 'reference.component' })
      class ReferenceComponent {
        @Reference({
          interface: 'LogService',
          cardinality: '0..n',
          policy: 'dynamic',
          policyOption: 'greedy',
          bind: 'bindLog',
          unbind: 'unbindLog',
          updated: 'updatedLog',
        })
        private logServices?: any[];

        bindLog(_service: any) {}
        unbindLog(_service: any) {}
        updatedLog(_service: any) {}
      }

      const metadata = getComponentMetadata(ReferenceComponent);
      expect(metadata.references.length).toBe(1);
      const ref = metadata.references[0];
      expect(ref.interface).toBe('LogService');
      expect(ref.cardinality).toBe('0..n');
      expect(ref.policy).toBe('dynamic');
      expect(ref.policyOption).toBe('greedy');
      expect(ref.bind).toBe('bindLog');
      expect(ref.unbind).toBe('unbindLog');
      expect(ref.updated).toBe('updatedLog');
    });

    it('should handle multiple references', () => {
      @Component({ name: 'multi.reference.component' })
      class MultiReferenceComponent {
        @Reference({ interface: 'ServiceA' })
        private serviceA?: any;

        @Reference({ interface: 'ServiceB' })
        private serviceB?: any;

        @Reference({ interface: 'ServiceC' })
        private serviceC?: any;
      }

      const metadata = getComponentMetadata(MultiReferenceComponent);
      expect(metadata.references.length).toBe(3);
      expect(metadata.references[0].interface).toBe('ServiceA');
      expect(metadata.references[1].interface).toBe('ServiceB');
      expect(metadata.references[2].interface).toBe('ServiceC');
    });

    it('should set target filter directly in Reference decorator', () => {
      @Component({ name: 'target.reference.component' })
      class TargetReferenceComponent {
        @Reference({
          interface: 'PaymentProvider',
          target: '(&(service.ranking>=100)(provider.type=credit_card))',
        })
        private paymentProvider?: any;
      }

      const metadata = getComponentMetadata(TargetReferenceComponent);
      expect(metadata.references.length).toBe(1);
      const ref = metadata.references[0];
      expect(ref.interface).toBe('PaymentProvider');
      expect(ref.target).toBe('(&(service.ranking>=100)(provider.type=credit_card))');
    });
  });

  describe('Complex Decorator Combinations', () => {
    it('should handle complex combinations of decorators', () => {
      @Component({
        name: 'complex.component',
        configurationPid: 'complex.config',
      })
      @Service({ interfaces: ['ComplexService'] })
      @ConfigurationPolicy('require')
      @Scope('prototype')
      @Property('service.description', 'A complex component')
      class ComplexComponent {
        @Reference({
          interface: 'DependencyService',
          cardinality: '1..1',
          policy: 'static',
          target: '(component.name=dependency.provider)',
        })
        private dependency?: any;

        @Activate
        activate() {}

        @Deactivate
        deactivate() {}

        @Modified
        modified() {}
      }

      const metadata = getComponentMetadata(ComplexComponent);
      expect(metadata.name).toBe('complex.component');
      expect(metadata.configurationPid).toBe('complex.config');
      expect(metadata.configurationPolicy).toBe('require');
      expect(metadata.service.interfaces).toEqual(['ComplexService']);
      expect(metadata.service.scope).toBe('prototype');
      expect(metadata.properties['service.description']).toBe('A complex component');
      expect(metadata.activate).toBe('activate');
      expect(metadata.deactivate).toBe('deactivate');
      expect(metadata.modified).toBe('modified');
      expect(metadata.references.length).toBe(1);
      expect(metadata.references[0].interface).toBe('DependencyService');
      expect(metadata.references[0].cardinality).toBe('1..1');
      expect(metadata.references[0].policy).toBe('static');
      expect(metadata.references[0].target).toBe('(component.name=dependency.provider)');
    });
  });
});
