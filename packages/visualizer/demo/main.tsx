import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { OSGiBootstrap, type OSGiFramework, LogLevel, getDecoratorInfo } from '@pandino/pandino';
import { PandinoVisualizer, PandinoVisualizerProvider } from '../src/index';
import { Component, Service, Reference, Activate, Deactivate, Modified } from '@pandino/decorators';

// ============================================
// DECORATED DS COMPONENTS
// ============================================

// Key Concept: @Component vs @Component + @Service
//
// @Component ONLY:
//   - Creates a managed component with lifecycle, references, and configuration
//   - Component is NOT registered as a service (not visible to other components)
//   - Useful for internal/consumer-only components that don't provide services
//   - Can still inject dependencies via @Reference
//   - Must set immediate=true to activate (otherwise waits for service usage)
//
// @Component + @Service:
//   - Creates a managed component AND registers it as a service
//   - Other components can reference it via @Reference
//   - Useful for service providers
//   - Can be lazy-loaded (immediate=false) and activated on first use

// ============================================
// SCENARIO 1: COMPONENT WITHOUT @Service
// Consumer-only component that doesn't provide a service
// ============================================

// DataProcessor - Component only (no @Service)
// Consumes services but doesn't expose itself as a service
@Component({
  name: 'DataProcessor',
  immediate: true,
  configurationPolicy: 'optional'
})
class DataProcessor {
  @Reference({
    name: 'dataStore',
    interface: 'DataStore',
    cardinality: '1..1',
    policy: 'static'
  })
  private dataStore: any;

  @Reference({
    name: 'eventAdmin',
    interface: 'EventAdmin',
    cardinality: '0..1',
    policy: 'dynamic'
  })
  private eventAdmin?: any;

  @Activate
  activate() {
    console.log('[DataProcessor] Activated - consumer component without service interface');
  }

  @Deactivate
  deactivate() {
    console.log('[DataProcessor] Deactivated');
  }

  processData() {
    console.log('[DataProcessor] Processing data internally');
  }
}

// ============================================
// SCENARIO 2: COMPONENTS WITH @Service
// Service providers that other components can reference
// ============================================

// UserManager - Component + Service with multiple dependencies
@Component({
  name: 'UserManager',
  immediate: true,
  configurationPolicy: 'optional'
})
@Service({
  interfaces: ['UserManagerService'],
  scope: 'singleton'
})
class UserManager {
  @Reference({
    name: 'userService',
    interface: 'UserService',
    cardinality: '1..1',
    policy: 'static',
    bind: 'bindUserService',
    unbind: 'unbindUserService'
  })
  private userService: any;

  @Reference({
    name: 'logger',
    interface: 'LogService',
    cardinality: '0..1',
    policy: 'dynamic',
    policyOption: 'greedy',
    bind: 'bindLogger',
    unbind: 'unbindLogger'
  })
  private logger?: any;

  @Activate
  activate() {
    console.log('[UserManager] Activated - registered as UserManagerService');
  }

  @Deactivate
  deactivate() {
    console.log('[UserManager] Deactivated');
  }

  @Modified
  modified() {
    console.log('[UserManager] Configuration modified');
  }

  bindUserService(service: any) {
    console.log('[UserManager] Binding UserService');
    this.userService = service;
  }

  unbindUserService(_service: any) {
    console.log('[UserManager] Unbinding UserService');
    this.userService = undefined;
  }

  bindLogger(service: any) {
    console.log('[UserManager] Binding LogService');
    this.logger = service;
  }

  unbindLogger(_service: any) {
    console.log('[UserManager] Unbinding LogService');
    this.logger = undefined;
  }

  createUser(_name: string) {
    console.log(`Creating user: ${_name}`);
  }

  deleteUser(_id: string) {
    console.log(`Deleting user: ${_id}`);
  }
}

// ApiGateway - Complex service with multiple dependencies
@Component({
  name: 'ApiGateway',
  immediate: true,
  configurationPolicy: 'optional'
})
@Service({
  interfaces: ['ApiGateway'],
  scope: 'singleton'
})
class ApiGatewayImpl {
  @Reference({
    name: 'userManager',
    interface: 'UserManagerService',
    cardinality: '1..1',
    policy: 'static'
  })
  private userManager: any;

  @Reference({
    name: 'dataStore',
    interface: 'DataStore',
    cardinality: '0..n',
    policy: 'dynamic',
    policyOption: 'greedy',
    bind: 'bindDataStore',
    unbind: 'unbindDataStore'
  })
  private dataStores: any[] = [];

  @Reference({
    name: 'logger',
    interface: 'LogService',
    cardinality: '1..1',
    policy: 'static'
  })
  private logger: any;

  @Activate
  activate() {
    console.log('[ApiGateway] Component activated');
  }

  @Deactivate
  deactivate() {
    console.log('[ApiGateway] Component deactivated');
  }

  bindDataStore(service: any) {
    console.log('[ApiGateway] Binding DataStore');
    this.dataStores.push(service);
  }

  unbindDataStore(service: any) {
    console.log('[ApiGateway] Unbinding DataStore');
    const idx = this.dataStores.indexOf(service);
    if (idx !== -1) {
      this.dataStores.splice(idx, 1);
    }
  }

  handleRequest(_req: any) {
    console.log('Handling request');
  }
}

// ============================================
// SCENARIO 3: COMPONENTS WITH MISSING DEPENDENCIES
// These demonstrate unsatisfied requirements
// ============================================

// PaymentProcessor - Missing required single dependency (1..1)
@Component({
  name: 'PaymentProcessor',
  immediate: true,
  configurationPolicy: 'optional'
})
@Service({
  interfaces: ['PaymentProcessorService'],
  scope: 'singleton'
})
class PaymentProcessor {
  @Reference({
    name: 'gateway',
    interface: 'PaymentGateway',  // THIS SERVICE DOESN'T EXIST!
    cardinality: '1..1',
    policy: 'static'
  })
  private gateway: any;

  @Reference({
    name: 'logger',
    interface: 'LogService',
    cardinality: '1..1',
    policy: 'static'
  })
  private logger: any;

  @Activate
  activate() {
    console.log('[PaymentProcessor] Activated (should not happen - missing required ref)');
  }

  @Deactivate
  deactivate() {
    console.log('[PaymentProcessor] Deactivated');
  }

  processPayment(amount: number) {
    console.log(`Processing payment: ${amount}`);
  }
}

// ReportGenerator - Missing required multiple dependencies (1..n)
@Component({
  name: 'ReportGenerator',
  immediate: false,
  configurationPolicy: 'optional'
})
@Service({
  interfaces: ['ReportGeneratorService'],
  scope: 'singleton'
})
class ReportGenerator {
  @Reference({
    name: 'dataProviders',
    interface: 'DataProvider',  // THIS SERVICE DOESN'T EXIST!
    cardinality: '1..n',
    policy: 'dynamic',
    bind: 'bindDataProvider',
    unbind: 'unbindDataProvider'
  })
  private dataProviders: any[] = [];

  @Reference({
    name: 'logger',
    interface: 'LogService',
    cardinality: '0..1',
    policy: 'dynamic'
  })
  private logger?: any;

  @Activate
  activate() {
    console.log('[ReportGenerator] Activated (should not happen - missing required refs)');
  }

  @Deactivate
  deactivate() {
    console.log('[ReportGenerator] Deactivated');
  }

  bindDataProvider(service: any) {
    console.log('[ReportGenerator] Binding DataProvider');
    this.dataProviders.push(service);
  }

  unbindDataProvider(service: any) {
    console.log('[ReportGenerator] Unbinding DataProvider');
    const idx = this.dataProviders.indexOf(service);
    if (idx !== -1) {
      this.dataProviders.splice(idx, 1);
    }
  }

  generateReport(reportType: string) {
    console.log(`Generating report: ${reportType}`);
  }
}


function Demo() {
  const [framework, setFramework] = useState<OSGiFramework | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const log = (message: string) => console.log(`[Demo] ${message}`);

    async function initFramework() {
      try {
        const bootstrap = new OSGiBootstrap({
          frameworkLogLevel: LogLevel.INFO,
        });

        const fw = await bootstrap.start();
        const context = fw.getBundleContext();

        // Register some basic services
        context.registerService('LogService', {
          log: (level: number, message: string) => console.log(`[${level}] ${message}`),
          setLogLevel: (level: number) => console.log(`Log level set to: ${level}`),
        }, {
          'service.vendor': 'Pandino Demo',
          'service.description': 'Logging service for the framework',
        });

        // Register ConfigurationAdmin service
        context.registerService('ConfigurationAdmin', {
          getConfiguration: (pid: string) => ({
            pid,
            properties: {
              'db.host': 'localhost',
              'db.port': 5432,
              'db.name': 'pandino_demo'
            }
          }),
          listConfigurations: () => Promise.resolve([]),
        }, {
          'service.vendor': 'Pandino Demo',
          'service.description': 'Configuration management service',
        });

        // Register EventAdmin service
        context.registerService('EventAdmin', {
          postEvent: (event: any) => console.log('Event posted:', event),
          sendEvent: (event: any) => console.log('Event sent:', event),
        }, {
          'service.vendor': 'Pandino Demo',
          'service.description': 'Event distribution service',
          'service.ranking': 100,
        });

        // ============================================
        // REGISTER BASE SERVICES (non-DS components)
        // ============================================

        // 1. UserService - Simple service (referenced by others)
        context.registerService('UserService', {
          getUser: (id: string) => ({ id, name: 'Demo User' }),
          listUsers: () => Promise.resolve([]),
        }, {
          'service.vendor': 'Pandino Demo',
          'service.description': 'User management service',
        });

        // 2. DataStore - Simple service (referenced by others)
        context.registerService('DataStore', {
          get: (_key: string) => Promise.resolve(null),
          set: (_key: string, _value: any) => Promise.resolve(),
        }, {
          'service.vendor': 'Pandino Demo',
          'service.description': 'Data persistence service',
        });

        // ============================================
        // REGISTER DECORATED DS COMPONENTS
        // ============================================

        log('Registering decorated DS components...');

        // SCENARIO 1: Consumer-only component (@Component without @Service)
        // These components don't provide a service interface, only consume services
        const consumerComponent = new DataProcessor();
        const consumerInfo = getDecoratorInfo(consumerComponent);

        log(`Registering consumer-only component: ${consumerInfo.component.name}`);

        // Register the component instance so the visualizer can discover it
        // Use the component name as the service interface
        context.registerService(consumerInfo.component.name || 'DSComponent', consumerComponent, {
          'service.vendor': 'Pandino Demo',
          'service.description': `Consumer-only DS Component: ${consumerInfo.component.name}`,
          'component.name': consumerInfo.component.name,
        });

        // SCENARIO 2: Service-providing components (@Component + @Service)
        // These get registered as services in the service registry
        const serviceProviderComponents = [
          new UserManager(),
          new ApiGatewayImpl(),
        ];

        serviceProviderComponents.forEach((instance: any) => {
          try {
            const decoratorInfo = getDecoratorInfo(instance);

            if (decoratorInfo.component.isComponent && decoratorInfo.service.interfaces.length > 0) {
              const interfaces = decoratorInfo.service.interfaces;
              const serviceName = interfaces[0] || decoratorInfo.component.name || 'UnknownService';

              log(`Registering service-providing component: ${serviceName} (${decoratorInfo.component.name})`);

              context.registerService(serviceName, instance, {
                'service.vendor': 'Pandino Demo',
                'service.description': `DS Component: ${decoratorInfo.component.name}`,
                'component.name': decoratorInfo.component.name,
              });
            }
          } catch (error) {
            console.error('Failed to register service-providing component:', error);
          }
        });

        // SCENARIO 3: Components with missing dependencies
        // These demonstrate unsatisfied requirements
        const brokenComponents = [
          new PaymentProcessor(),
          new ReportGenerator(),
        ];

        log('Registering components with missing dependencies (will show as unsatisfied)...');
        brokenComponents.forEach((instance: any) => {
          try {
            const decoratorInfo = getDecoratorInfo(instance);

            if (decoratorInfo.component.isComponent && decoratorInfo.service.interfaces.length > 0) {
              const interfaces = decoratorInfo.service.interfaces;
              const serviceName = interfaces[0] || decoratorInfo.component.name || 'UnknownService';

              log(`Registering component with missing deps: ${serviceName}`);

              context.registerService(serviceName, instance, {
                'service.vendor': 'Pandino Demo',
                'service.description': `Broken Component: ${decoratorInfo.component.name}`,
                'component.name': decoratorInfo.component.name,
              });
            }
          } catch (error) {
            console.error('Failed to register broken component:', error);
          }
        });

        if (mounted) {
          setFramework(fw);
          setLoading(false);
        }
      } catch (error) {
        console.error('Failed to initialize framework:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    }

    initFramework();

    return () => {
      mounted = false;
    };
  }, []);


  if (loading) {
    return (
      <div style={styles.loading}>
        <h1>Loading Pandino Framework...</h1>
      </div>
    );
  }

  if (!framework) {
    return (
      <div style={styles.error}>
        <h1>Failed to load framework</h1>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <PandinoVisualizerProvider>
        <PandinoVisualizer framework={framework} defaultOpen={true} position="fullscreen" />
      </PandinoVisualizerProvider>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100vw',
    height: '100vh',
    position: 'relative',
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    background: '#1e1e1e',
    color: 'white',
  },
  error: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    background: '#1e1e1e',
    color: '#f44336',
  },
};

const root = createRoot(document.getElementById('root')!);
root.render(<Demo />);

