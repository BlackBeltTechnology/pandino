import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OSGiFramework } from '~/framework/framework';
import type { BundleContext, ServiceReference } from '~/framework/interfaces';
import { Activate, Component, Reference } from './interfaces';
import { getComponentMetadata } from './reflection';
import { ServiceComponentRuntime } from './scr';

describe('Service References', () => {
  let framework: OSGiFramework;
  let scr: ServiceComponentRuntime;
  let bundleContext: BundleContext;
  let mockServiceRef: ServiceReference<any>;

  beforeEach(async () => {
    framework = new OSGiFramework();
    await framework.start();
    bundleContext = framework.getBundleContext();
    scr = new ServiceComponentRuntime(framework, bundleContext);

    mockServiceRef = {
      getProperty: vi.fn(),
      getPropertyKeys: vi.fn().mockReturnValue([]),
      getBundle: vi.fn(),
      isAssignableTo: vi.fn().mockReturnValue(true),
    } as unknown as ServiceReference<any>;
  });

  describe('Reference Satisfaction', () => {
    it('should bind services to a component with proper service lookup', async () => {
      const bindTracker: any[] = [];

      @Component({ name: 'reference.component' })
      class ReferenceComponent {
        @Reference({ interface: 'TestService', bind: 'bindService' })
        private service?: any;

        @Activate
        activate() {}

        bindService(service: any) {
          this.service = service;
          bindTracker.push(service);
        }
      }

      const mockService = { test: true, value: 'service-data' };
      bundleContext.getServiceReferences = vi.fn().mockReturnValue([mockServiceRef]);
      bundleContext.getService = vi.fn().mockReturnValue(mockService);

      const bundleId = 0;
      scr.registerComponent(ReferenceComponent, bundleId);
      await scr.activateComponent(bundleId, 'reference.component');

      expect(bindTracker).toEqual([mockService]);
      expect(bundleContext.getServiceReferences).toHaveBeenCalledWith('TestService', null);
      expect(bundleContext.getService).toHaveBeenCalledWith(mockServiceRef);
    });

    it('should handle multiple service references', async () => {
      const bindTracker: string[] = [];

      @Component({ name: 'multi.reference.component' })
      class MultiReferenceComponent {
        @Reference({ interface: 'ServiceA', bind: 'bindServiceA' })
        private serviceA?: any;

        @Reference({ interface: 'ServiceB', bind: 'bindServiceB' })
        private serviceB?: any;

        @Activate
        activate() {}

        bindServiceA(_service: any) {
          bindTracker.push('serviceA-bound');
        }

        bindServiceB(_service: any) {
          bindTracker.push('serviceB-bound');
        }
      }

      const mockServiceA = { type: 'A' };
      const mockServiceB = { type: 'B' };

      bundleContext.getServiceReferences = vi
        .fn()
        .mockReturnValueOnce([mockServiceRef]) // ServiceA
        .mockReturnValueOnce([mockServiceRef]); // ServiceB

      bundleContext.getService = vi.fn().mockReturnValueOnce(mockServiceA).mockReturnValueOnce(mockServiceB);

      const bundleId = 0;
      scr.registerComponent(MultiReferenceComponent, bundleId);
      await scr.activateComponent(bundleId, 'multi.reference.component');

      expect(bindTracker).toEqual(['serviceA-bound', 'serviceB-bound']);
    });

    it('should handle components with no references', async () => {
      @Component({ name: 'no.references.component' })
      class NoReferencesComponent {
        @Activate
        activate() {}
      }

      const bundleId = 0;
      scr.registerComponent(NoReferencesComponent, bundleId);
      await scr.activateComponent(bundleId, 'no.references.component');

      const getServiceReferencesSpy = vi.spyOn(bundleContext, 'getServiceReferences');
      getServiceReferencesSpy.mockClear();

      await scr.satisfyReferences(bundleId, 'no.references.component');

      expect(getServiceReferencesSpy).not.toHaveBeenCalled();
    });

    it('should handle services that are null', async () => {
      const bindTracker: string[] = [];

      @Component({ name: 'null.service.component' })
      class NullServiceComponent {
        @Reference({ interface: 'TestService', bind: 'bindService' })
        private service?: any;

        @Activate
        activate() {}

        bindService(_service: any) {
          bindTracker.push('service-bound');
        }
      }

      bundleContext.getServiceReferences = vi.fn().mockReturnValue([mockServiceRef]);
      bundleContext.getService = vi.fn().mockReturnValue(null);

      const bundleId = 0;
      scr.registerComponent(NullServiceComponent, bundleId);
      await scr.activateComponent(bundleId, 'null.service.component');
      await scr.satisfyReferences(bundleId, 'null.service.component');

      expect(bindTracker).toEqual([]);
    });
  });

  describe('Reference Handling', () => {
    it('should handle mandatory references', async () => {
      let boundService: any = null;

      @Component({ name: 'mandatory.reference.component' })
      class MandatoryReferenceComponent {
        @Reference({
          interface: 'TestService',
          cardinality: '1..1', // Mandatory
          bind: 'bindService',
        })
        private service?: any;

        bindService(service: any) {
          boundService = service;
          this.service = service;
        }
      }

      const testService = { test: true };
      bundleContext.getServiceReferences = vi.fn().mockReturnValue([mockServiceRef]);
      bundleContext.getService = vi.fn().mockReturnValue(testService);

      const bundleId = bundleContext.getBundle().getBundleId();
      scr.registerComponent(MandatoryReferenceComponent, bundleId);
      await scr.activateComponent(bundleId, 'mandatory.reference.component');

      expect(bundleContext.getServiceReferences).toHaveBeenCalledWith('TestService', null);
      expect(bundleContext.getService).toHaveBeenCalledWith(mockServiceRef);
      expect(boundService).toBe(testService);
    });
  });

  describe('Reference Management', () => {
    it('should handle dynamic references with greedy policy', () => {
      interface LogService {
        log(message: string): void;
      }

      @Component({ name: 'dynamic.consumer' })
      class DynamicConsumer {
        @Reference({
          interface: 'LogService',
          policy: 'dynamic',
          policyOption: 'greedy',
          cardinality: '0..n',
          bind: 'bindLogger',
          unbind: 'unbindLogger',
          updated: 'updatedLogger',
        })
        private loggers: LogService[] = [];

        bindLogger(logger: LogService) {
          this.loggers.push(logger);
        }

        unbindLogger(logger: LogService) {
          const index = this.loggers.indexOf(logger);
          if (index > -1) {
            this.loggers.splice(index, 1);
          }
        }

        updatedLogger(_logger: LogService) {}
      }

      const metadata = getComponentMetadata(DynamicConsumer);
      const ref = metadata.references[0];
      expect(ref.policy).toBe('dynamic');
      expect(ref.policyOption).toBe('greedy');
      expect(ref.bind).toBe('bindLogger');
      expect(ref.unbind).toBe('unbindLogger');
      expect(ref.updated).toBe('updatedLogger');
    });

    it('should handle field injection with update option', () => {
      interface DataService {
        getData(): string;
      }

      @Component({ name: 'field.injection.component' })
      class FieldInjectionComponent {
        @Reference({
          interface: 'DataService',
          field: 'dataService',
          fieldOption: 'update',
          cardinality: '0..1',
        })
        private dataService?: DataService;

        getData(): string {
          return this.dataService?.getData() || 'no-data';
        }
      }

      const metadata = getComponentMetadata(FieldInjectionComponent);
      const ref = metadata.references[0];
      expect(ref.field).toBe('dataService');
      expect(ref.fieldOption).toBe('update');
    });
  });

  describe('Service Event Processing', () => {
    it('should unbind services when a service is unregistered', async () => {
      const unbindTracker: string[] = [];

      @Component({ name: 'event.component' })
      class EventComponent {
        @Reference({ interface: 'TestService', unbind: 'unbindService' })
        private service?: any;

        @Activate
        activate() {}

        unbindService() {
          this.service = null;
          unbindTracker.push('service-unbound');
        }
      }

      const mockService = { value: 'test' };
      bundleContext.getServiceReferences = vi.fn().mockReturnValue([mockServiceRef]);
      bundleContext.getService = vi.fn().mockReturnValue(mockService);

      const bundleId = bundleContext.getBundle().getBundleId();
      scr.registerComponent(EventComponent, bundleId);
      await scr.activateComponent(bundleId, 'event.component');

      await scr.processServiceEvent('TestService', 'unregistered');

      expect(unbindTracker).toEqual(['service-unbound']);
    });

    it('should process events for multiple components', async () => {
      const unbindTracker: string[] = [];

      @Component({ name: 'event.component.1' })
      class EventComponent1 {
        @Reference({ interface: 'TestService', unbind: 'unbindService' })
        private service?: any;

        @Activate
        activate() {}

        unbindService() {
          unbindTracker.push('component1-unbound');
        }
      }

      @Component({ name: 'event.component.2' })
      class EventComponent2 {
        @Reference({ interface: 'TestService', unbind: 'unbindService' })
        private service?: any;

        @Activate
        activate() {}

        unbindService() {
          unbindTracker.push('component2-unbound');
        }
      }

      const mockService = { value: 'test' };
      bundleContext.getServiceReferences = vi.fn().mockReturnValue([mockServiceRef]);
      bundleContext.getService = vi.fn().mockReturnValue(mockService);

      const bundleId = bundleContext.getBundle().getBundleId();
      scr.registerComponent(EventComponent1, bundleId);
      scr.registerComponent(EventComponent2, bundleId);
      await scr.activateComponent(bundleId, 'event.component.1');
      await scr.activateComponent(bundleId, 'event.component.2');

      await scr.processServiceEvent('TestService', 'unregistered');

      expect(unbindTracker).toEqual(['component1-unbound', 'component2-unbound']);
    });

    it('should ignore events for inactive components', async () => {
      const unbindTracker: string[] = [];

      @Component({ name: 'inactive.event.component' })
      class InactiveEventComponent {
        @Reference({ interface: 'TestService', unbind: 'unbindService' })
        private service?: any;

        unbindService() {
          unbindTracker.push('should-not-be-called');
        }
      }

      const bundleId = bundleContext.getBundle().getBundleId();
      scr.registerComponent(InactiveEventComponent, bundleId);

      await scr.processServiceEvent('TestService', 'unregistered');

      expect(unbindTracker).toEqual([]);
    });

    it('should ignore events for non-matching interfaces', async () => {
      const unbindTracker: string[] = [];

      @Component({ name: 'mismatch.event.component' })
      class MismatchEventComponent {
        @Reference({ interface: 'DifferentService', unbind: 'unbindService', cardinality: '0..1' })
        private service?: any;

        @Activate
        activate() {}

        unbindService() {
          unbindTracker.push('should-not-be-called');
        }
      }

      const bundleId = bundleContext.getBundle().getBundleId();
      scr.registerComponent(MismatchEventComponent, bundleId);
      await scr.activateComponent(bundleId, 'mismatch.event.component');

      await scr.processServiceEvent('TestService', 'unregistered');

      expect(unbindTracker).toEqual([]);
    });
  });
});
