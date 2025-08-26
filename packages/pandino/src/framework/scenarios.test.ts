import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OSGiBootstrap } from './bootstrap';
import type { OSGiFramework } from './framework';
import type { BundleActivator, BundleContext, ServiceEvent, ServiceListener, ServiceReference } from './interfaces';
import { BUNDLE_STATES, type BundleState, SERVICE_EVENT_TYPES } from '../types/constants';

interface DataService {
  getData(): string;
}

interface ProcessorService {
  process(data: string): string;
}

interface OutputService {
  output(data: string): void;
}

class DataBundleActivator implements BundleActivator {
  private registration: any;

  async start(context: BundleContext): Promise<void> {
    const service: DataService = {
      getData: () => 'raw-data-from-source',
    };
    this.registration = context.registerService('DataService', service, {
      'service.ranking': 10,
      'data.source': 'primary',
    });
  }

  async stop(_context: BundleContext): Promise<void> {
    if (this.registration) {
      this.registration.unregister();
    }
  }
}

class ProcessorBundleActivator implements BundleActivator {
  private registration: any;
  private dataServiceRef: ServiceReference<DataService> | null = null;
  private listener: ServiceListener | null = null;

  async start(context: BundleContext): Promise<void> {
    const service: ProcessorService = {
      process: (data: string) => {
        const currentRef = context.getServiceReference('DataService');
        const dataService = currentRef ? (context.getService(currentRef) as DataService) : null;
        const sourceData = dataService ? dataService.getData() : data;
        return `processed-${sourceData}`;
      },
    };

    this.registration = context.registerService('ProcessorService', service, {
      'service.ranking': 5,
      'processor.type': 'text',
    });

    this.dataServiceRef = context.getServiceReference('DataService');

    this.listener = {
      serviceChanged: (event: ServiceEvent) => {
        if (event.getType() === SERVICE_EVENT_TYPES.UNREGISTERING) {
          this.dataServiceRef = context.getServiceReference('DataService');
        } else if (event.getType() === SERVICE_EVENT_TYPES.REGISTERED) {
          this.dataServiceRef = context.getServiceReference('DataService');
        }
      },
    };
    context.addServiceListener(this.listener, '(objectClass=DataService)');
  }

  async stop(context: BundleContext): Promise<void> {
    if (this.listener) {
      context.removeServiceListener(this.listener);
    }
    if (this.registration) {
      this.registration.unregister();
    }
    if (this.dataServiceRef) {
      context.ungetService(this.dataServiceRef);
    }
  }
}

class OutputBundleActivator implements BundleActivator {
  private registration: any;
  private processorServiceRef: ServiceReference<ProcessorService> | null = null;
  private outputs: string[] = [];

  async start(context: BundleContext): Promise<void> {
    this.processorServiceRef = context.getServiceReference('ProcessorService');

    const service: OutputService = {
      output: (data: string) => {
        const processorService = this.processorServiceRef ? context.getService(this.processorServiceRef) : null;
        const processedData = processorService ? processorService.process(data) : data;
        this.outputs.push(processedData);
      },
    };

    this.registration = context.registerService('OutputService', service, {
      'service.ranking': 1,
      'output.type': 'memory',
    });
  }

  async stop(context: BundleContext): Promise<void> {
    if (this.registration) {
      this.registration.unregister();
    }
    if (this.processorServiceRef) {
      context.ungetService(this.processorServiceRef);
    }
  }

  getOutputs(): string[] {
    return [...this.outputs];
  }
}

describe('Complex Bundle and Service Lifecycle', () => {
  let framework: OSGiFramework;
  let bootstrap: OSGiBootstrap;

  beforeEach(async () => {
    bootstrap = new OSGiBootstrap();
    framework = await bootstrap.start();
  });

  afterEach(async () => {
    await bootstrap.stop();
  });

  describe('Service Chain Dependencies', () => {
    it('should handle complete service chain lifecycle', async () => {
      const dataBundle = await framework.installBundle('data-bundle');
      const processorBundle = await framework.installBundle('processor-bundle');
      const outputBundle = await framework.installBundle('output-bundle');

      (dataBundle as any).activator = new DataBundleActivator();
      (processorBundle as any).activator = new ProcessorBundleActivator();
      (outputBundle as any).activator = new OutputBundleActivator();

      await dataBundle.start();
      await processorBundle.start();
      await outputBundle.start();

      expect(framework.getServiceReferences('DataService')).toHaveLength(1);
      expect(framework.getServiceReferences('ProcessorService')).toHaveLength(1);
      expect(framework.getServiceReferences('OutputService')).toHaveLength(1);

      const outputRef = framework.getServiceReferences('OutputService')[0];
      const outputService = framework.getService(outputRef) as OutputService;

      outputService.output('test-data');

      const outputs = ((outputBundle as any).activator as OutputBundleActivator).getOutputs();
      expect(outputs).toContain('processed-raw-data-from-source');
    });

    it('should handle intermediate bundle failure and recovery', async () => {
      const serviceListener = vi.fn();
      const dataBundle = await framework.installBundle('data-bundle');
      const processorBundle = await framework.installBundle('processor-bundle');
      const outputBundle = await framework.installBundle('output-bundle');

      framework.on('service-event', serviceListener);

      (dataBundle as any).activator = new DataBundleActivator();
      (processorBundle as any).activator = new ProcessorBundleActivator();
      (outputBundle as any).activator = new OutputBundleActivator();

      await dataBundle.start();
      await processorBundle.start();
      await outputBundle.start();

      expect(framework.getServiceReferences('DataService')).toHaveLength(1);
      expect(framework.getServiceReferences('ProcessorService')).toHaveLength(1);
      expect(framework.getServiceReferences('OutputService')).toHaveLength(1);

      await processorBundle.stop();

      expect(framework.getServiceReferences('ProcessorService')).toHaveLength(0);
      expect(framework.getServiceReferences('DataService')).toHaveLength(1);
      expect(framework.getServiceReferences('OutputService')).toHaveLength(1);

      await processorBundle.start();

      expect(framework.getServiceReferences('ProcessorService')).toHaveLength(1);

      const outputRef = framework.getServiceReferences('OutputService')[0];
      const outputService = framework.getService(outputRef) as OutputService;
      outputService.output('recovery-test');

      const outputs = ((outputBundle as any).activator as OutputBundleActivator).getOutputs();
      expect(outputs.length).toBeGreaterThan(0);
    });

    it('should handle multiple service providers with ranking', async () => {
      const dataBundle1 = await framework.installBundle('data-bundle-1');
      const dataBundle2 = await framework.installBundle('data-bundle-2');
      const processorBundle = await framework.installBundle('processor-bundle');

      const highRankingActivator = new (class implements BundleActivator {
        private registration: any;
        async start(context: BundleContext): Promise<void> {
          const service: DataService = {
            getData: () => 'high-priority-data',
          };
          this.registration = context.registerService('DataService', service, {
            'service.ranking': 100,
            'data.source': 'high-priority',
          });
        }
        async stop(_context: BundleContext): Promise<void> {
          if (this.registration) this.registration.unregister();
        }
      })();

      const lowRankingActivator = new (class implements BundleActivator {
        private registration: any;
        async start(context: BundleContext): Promise<void> {
          const service: DataService = {
            getData: () => 'low-priority-data',
          };
          this.registration = context.registerService('DataService', service, {
            'service.ranking': 1,
            'data.source': 'low-priority',
          });
        }
        async stop(_context: BundleContext): Promise<void> {
          if (this.registration) this.registration.unregister();
        }
      })();

      (dataBundle1 as any).activator = lowRankingActivator;
      (dataBundle2 as any).activator = highRankingActivator;
      (processorBundle as any).activator = new ProcessorBundleActivator();

      await dataBundle1.start();
      await processorBundle.start();

      const processorRef1 = framework.getServiceReferences('ProcessorService')[0];
      const processorService1 = framework.getService(processorRef1) as ProcessorService;
      const result1 = processorService1.process('test');
      expect(result1).toContain('low-priority-data');

      await dataBundle2.start();

      const processorRef2 = framework.getServiceReferences('ProcessorService')[0];
      const processorService2 = framework.getService(processorRef2) as ProcessorService;
      const result2 = processorService2.process('test');
      expect(result2).toContain('high-priority-data');

      await dataBundle2.stop();

      const processorRef3 = framework.getServiceReferences('ProcessorService')[0];
      const processorService3 = framework.getService(processorRef3) as ProcessorService;
      const result3 = processorService3.process('test');
      expect(result3).toContain('low-priority-data');
    });

    it('should handle complex service dependency chains with filters', async () => {
      const dataBundle = await framework.installBundle('data-bundle');
      const transformerBundle = await framework.installBundle('transformer-bundle');
      const validatorBundle = await framework.installBundle('validator-bundle');
      const outputBundle = await framework.installBundle('output-bundle');

      const dataActivator = new (class implements BundleActivator {
        private registration: any;
        async start(context: BundleContext): Promise<void> {
          const service = {
            getData: () => 'raw-data',
            getType: () => 'text',
          };
          this.registration = context.registerService('DataService', service, {
            'data.type': 'text',
            'data.format': 'plain',
          });
        }
        async stop(_context: BundleContext): Promise<void> {
          if (this.registration) this.registration.unregister();
        }
      })();

      const transformerActivator = new (class implements BundleActivator {
        private registration: any;
        private dataServiceRef: ServiceReference<any> | null = null;

        async start(context: BundleContext): Promise<void> {
          const refs = context.getServiceReferences('DataService', '(data.type=text)');
          this.dataServiceRef = refs && refs.length > 0 ? refs[0] : null;

          const service = {
            transform: (input: string) => {
              const dataService = this.dataServiceRef ? context.getService(this.dataServiceRef) : null;
              const data = dataService ? dataService.getData() : input;
              return `transformed-${data}`;
            },
          };

          this.registration = context.registerService('TransformerService', service, {
            'transformer.type': 'text-transformer',
            'input.format': 'plain',
            'output.format': 'processed',
          });
        }

        async stop(context: BundleContext): Promise<void> {
          if (this.registration) this.registration.unregister();
          if (this.dataServiceRef) context.ungetService(this.dataServiceRef);
        }
      })();

      const validatorActivator = new (class implements BundleActivator {
        private registration: any;
        private transformerServiceRef: ServiceReference<any> | null = null;

        async start(context: BundleContext): Promise<void> {
          const refs = context.getServiceReferences('TransformerService', '(transformer.type=text-transformer)');
          this.transformerServiceRef = refs && refs.length > 0 ? refs[0] : null;

          const service = {
            validate: (input: string) => {
              const transformerService = this.transformerServiceRef
                ? context.getService(this.transformerServiceRef)
                : null;
              const transformed = transformerService ? transformerService.transform(input) : input;
              return `validated-${transformed}`;
            },
          };

          this.registration = context.registerService('ValidatorService', service, {
            'validator.type': 'text-validator',
            'validation.level': 'strict',
          });
        }

        async stop(context: BundleContext): Promise<void> {
          if (this.registration) this.registration.unregister();
          if (this.transformerServiceRef) context.ungetService(this.transformerServiceRef);
        }
      })();

      const outputActivator = new (class implements BundleActivator {
        private registration: any;
        private validatorServiceRef: ServiceReference<any> | null = null;
        private results: string[] = [];

        async start(context: BundleContext): Promise<void> {
          const refs = context.getServiceReferences('ValidatorService', '(validation.level=strict)');
          this.validatorServiceRef = refs && refs.length > 0 ? refs[0] : null;

          const service = {
            output: (input: string) => {
              const validatorService = this.validatorServiceRef ? context.getService(this.validatorServiceRef) : null;
              const validated = validatorService ? validatorService.validate(input) : input;
              this.results.push(validated);
            },
            getResults: () => [...this.results],
          };

          this.registration = context.registerService('OutputService', service);
        }

        async stop(context: BundleContext): Promise<void> {
          if (this.registration) this.registration.unregister();
          if (this.validatorServiceRef) context.ungetService(this.validatorServiceRef);
        }
      })();

      (dataBundle as any).activator = dataActivator;
      (transformerBundle as any).activator = transformerActivator;
      (validatorBundle as any).activator = validatorActivator;
      (outputBundle as any).activator = outputActivator;

      await dataBundle.start();
      await transformerBundle.start();
      await validatorBundle.start();
      await outputBundle.start();

      const outputRef = framework.getServiceReferences('OutputService')[0];
      const outputService = framework.getService(outputRef) as any;

      outputService.output('test-input');

      const results = outputService.getResults();
      expect(results).toContain('validated-transformed-raw-data');
    });

    it('should handle cascade shutdown when root service disappears', async () => {
      const bundleStates: Record<string, BundleState[]> = {};
      const serviceEvents: string[] = [];

      framework.on('bundle-event', (event) => {
        const bundleName = event.getBundle().getSymbolicName();
        if (!bundleStates[bundleName]) bundleStates[bundleName] = [];
        bundleStates[bundleName].push(event.getBundle().getState());
      });

      framework.on('service-event', (event) => {
        serviceEvents.push(`${event.getType()}-${event.getServiceReference().getProperty('objectClass')}`);
      });

      const rootBundle = await framework.installBundle('root-bundle');
      const middleBundle = await framework.installBundle('middle-bundle');
      const leafBundle = await framework.installBundle('leaf-bundle');

      const rootActivator = new (class implements BundleActivator {
        private registration: any;
        async start(context: BundleContext): Promise<void> {
          const service = { getRootData: () => 'root-data' };
          this.registration = context.registerService('RootService', service);
        }
        async stop(_context: BundleContext): Promise<void> {
          if (this.registration) this.registration.unregister();
        }
      })();

      const middleActivator = new (class implements BundleActivator {
        private registration: any;
        private rootServiceRef: ServiceReference<any> | null = null;
        private listener: ServiceListener | null = null;

        async start(context: BundleContext): Promise<void> {
          this.rootServiceRef = context.getServiceReference('RootService');

          const service = {
            getMiddleData: () => {
              const rootService = this.rootServiceRef ? context.getService(this.rootServiceRef) : null;
              return rootService ? `middle-${rootService.getRootData()}` : 'middle-fallback';
            },
          };

          this.registration = context.registerService('MiddleService', service);

          this.listener = {
            serviceChanged: (event: ServiceEvent) => {
              if (event.getType() === SERVICE_EVENT_TYPES.UNREGISTERING) {
                setTimeout(() => middleBundle.stop(), 0);
              }
            },
          };
          context.addServiceListener(this.listener, '(objectClass=RootService)');
        }

        async stop(context: BundleContext): Promise<void> {
          if (this.listener) context.removeServiceListener(this.listener);
          if (this.registration) this.registration.unregister();
          if (this.rootServiceRef) context.ungetService(this.rootServiceRef);
        }
      })();

      const leafActivator = new (class implements BundleActivator {
        private registration: any;
        private middleServiceRef: ServiceReference<any> | null = null;
        private listener: ServiceListener | null = null;

        async start(context: BundleContext): Promise<void> {
          this.middleServiceRef = context.getServiceReference('MiddleService');

          const service = {
            getLeafData: () => {
              const middleService = this.middleServiceRef ? context.getService(this.middleServiceRef) : null;
              return middleService ? `leaf-${middleService.getMiddleData()}` : 'leaf-fallback';
            },
          };

          this.registration = context.registerService('LeafService', service);

          this.listener = {
            serviceChanged: (event: ServiceEvent) => {
              if (event.getType() === SERVICE_EVENT_TYPES.UNREGISTERING) {
                setTimeout(() => leafBundle.stop(), 0);
              }
            },
          };
          context.addServiceListener(this.listener, '(objectClass=MiddleService)');
        }

        async stop(context: BundleContext): Promise<void> {
          if (this.listener) context.removeServiceListener(this.listener);
          if (this.registration) this.registration.unregister();
          if (this.middleServiceRef) context.ungetService(this.middleServiceRef);
        }
      })();

      (rootBundle as any).activator = rootActivator;
      (middleBundle as any).activator = middleActivator;
      (leafBundle as any).activator = leafActivator;

      await rootBundle.start();
      await middleBundle.start();
      await leafBundle.start();

      expect(framework.getServiceReferences('RootService')).toHaveLength(1);
      expect(framework.getServiceReferences('MiddleService')).toHaveLength(1);
      expect(framework.getServiceReferences('LeafService')).toHaveLength(1);

      await rootBundle.stop();

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(framework.getServiceReferences('RootService')).toHaveLength(0);
      expect(framework.getServiceReferences('MiddleService')).toHaveLength(0);
      expect(framework.getServiceReferences('LeafService')).toHaveLength(0);

      expect(rootBundle.getState()).toBe(BUNDLE_STATES.RESOLVED);
      expect(middleBundle.getState()).toBe(BUNDLE_STATES.RESOLVED);
      expect(leafBundle.getState()).toBe(BUNDLE_STATES.RESOLVED);
    });

    it('should handle circular service dependencies gracefully', async () => {
      const bundle1 = await framework.installBundle('circular-bundle-1');
      const bundle2 = await framework.installBundle('circular-bundle-2');

      let service1Ref: ServiceReference<any> | null = null;
      let service2Ref: ServiceReference<any> | null = null;

      const activator1 = new (class implements BundleActivator {
        private registration: any;

        async start(context: BundleContext): Promise<void> {
          const service = {
            process1: (data: string, depth = 0) => {
              const result = `service1->${data}`;

              if (depth === 0) {
                service2Ref = context.getServiceReference('Service2');
                const service2 = service2Ref ? context.getService(service2Ref) : null;
                if (service2) {
                  return service2.process2(result, depth + 1);
                }
              }

              return result;
            },
          };

          this.registration = context.registerService('Service1', service);
        }

        async stop(context: BundleContext): Promise<void> {
          if (this.registration) this.registration.unregister();
          if (service2Ref) context.ungetService(service2Ref);
        }
      })();

      const activator2 = new (class implements BundleActivator {
        private registration: any;

        async start(context: BundleContext): Promise<void> {
          const service = {
            process2: (data: string, depth = 0) => {
              const result = `service2->${data}`;

              if (depth === 0) {
                service1Ref = context.getServiceReference('Service1');
                const service1 = service1Ref ? context.getService(service1Ref) : null;
                if (service1) {
                  return service1.process1(result, depth + 1);
                }
              }

              return result;
            },
          };

          this.registration = context.registerService('Service2', service);
        }

        async stop(context: BundleContext): Promise<void> {
          if (this.registration) this.registration.unregister();
          if (service1Ref) context.ungetService(service1Ref);
        }
      })();

      (bundle1 as any).activator = activator1;
      (bundle2 as any).activator = activator2;

      await bundle1.start();
      await bundle2.start();

      const service1 = framework.getService(framework.getServiceReferences('Service1')[0]) as any;
      const service2 = framework.getService(framework.getServiceReferences('Service2')[0]) as any;

      expect(() => service1.process1('test')).not.toThrow();
      expect(() => service2.process2('test')).not.toThrow();

      expect(service1.process1('test')).toBe('service2->service1->test');
      expect(service2.process2('test')).toBe('service1->service2->test');

      await bundle2.stop();

      expect(() => service1.process1('test')).not.toThrow();
      expect(service1.process1('test')).toBe('service1->test');
    });
  });
});
