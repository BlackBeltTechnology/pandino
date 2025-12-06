import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { OSGiBootstrap, type OSGiFramework, LogLevel, getDecoratorInfo } from '@pandino/pandino';
import { PandinoVisualizer, PandinoVisualizerProvider } from '../src/index';
import { Component, Service, Reference } from '@pandino/decorators';

// ============================================
// DECORATED DS COMPONENTS
// ============================================

// 1. UserManager - DS Component with required config and mixed references
@Component({
  name: 'UserManager',
  immediate: true,
  configurationPolicy: 'require',
  configurationPid: 'com.example.usermanager'
})
@Service({
  interfaces: ['UserManagerService']
})
class UserManager {
  @Reference({
    name: 'userService',
    interface: 'UserService',
    cardinality: '1..1',
    policy: 'static'
  })
  private userService: any;

  @Reference({
    name: 'logger',
    interface: 'LogService',
    cardinality: '0..1',
    policy: 'dynamic'
  })
  private logger?: any;

  createUser(_name: string) {
    console.log(`Creating user: ${_name}`);
  }

  deleteUser(_id: string) {
    console.log(`Deleting user: ${_id}`);
  }

  authenticate(_username: string, _password: string) {
    return true;
  }
}

// 2. DataAccessLayer - DS Component with optional config and multiple references
@Component({
  name: 'DataAccessLayer',
  immediate: false,
  configurationPolicy: 'optional',
  configurationPid: 'com.example.dal'
})
@Service({
  interfaces: ['DataAccessLayer']
})
class DataAccessLayerImpl {
  @Reference({
    name: 'dataStore',
    interface: 'DataStore',
    cardinality: '1..1',
    policy: 'static'
  })
  private dataStore: any;

  @Reference({
    name: 'logger',
    interface: 'LogService',
    cardinality: '1..1',
    policy: 'static'
  })
  private logger: any;

  @Reference({
    name: 'eventAdmin',
    interface: 'EventAdmin',
    cardinality: '0..1',
    policy: 'dynamic'
  })
  private eventAdmin?: any;

  query(_sql: string) {
    return Promise.resolve([]);
  }

  execute(_sql: string) {
    return Promise.resolve({ rowsAffected: 0 });
  }
}

// 3. NotificationService - Factory Component
@Component({
  name: 'NotificationService',
  factory: 'notification.factory',
  immediate: false,
  configurationPolicy: 'ignore'
})
@Service({
  interfaces: ['NotificationService']
})
class NotificationServiceImpl {
  @Reference({
    name: 'eventAdmin',
    interface: 'EventAdmin',
    cardinality: '1..1',
    policy: 'dynamic'
  })
  private eventAdmin: any;

  @Reference({
    name: 'logger',
    interface: 'LogService',
    cardinality: '0..1',
    policy: 'dynamic'
  })
  private logger?: any;

  send(to: string, message: string) {
    console.log(`Notification to ${to}: ${message}`);
  }

  subscribe(topic: string, _callback: Function) {
    console.log(`Subscribed to: ${topic}`);
  }
}

// 4. AuthenticationService - DS Component with target filter
@Component({
  name: 'AuthenticationService',
  immediate: true,
  configurationPolicy: 'require',
  configurationPid: 'com.example.auth'
})
@Service({
  interfaces: ['AuthenticationService']
})
class AuthenticationServiceImpl {
  @Reference({
    name: 'userManager',
    interface: 'UserManagerService',
    cardinality: '1..1',
    policy: 'static',
    target: '(service.vendor=Pandino Demo)'
  })
  private userManager: any;

  @Reference({
    name: 'dataAccess',
    interface: 'DataAccessLayer',
    cardinality: '0..1',
    policy: 'dynamic'
  })
  private dataAccess?: any;

  @Reference({
    name: 'logger',
    interface: 'LogService',
    cardinality: '1..1',
    policy: 'static'
  })
  private logger: any;

  login(_username: string, _password: string) {
    return true;
  }

  logout(_token: string) {
    console.log('Logged out');
  }

  validateToken(_token: string) {
    return true;
  }
}

// 5. CacheService - DS Component with multiple optional references
@Component({
  name: 'CacheService',
  immediate: false,
  configurationPolicy: 'optional',
  configurationPid: 'com.example.cache'
})
@Service({
  interfaces: ['CacheService']
})
class CacheServiceImpl {
  @Reference({
    name: 'dataStore',
    interface: 'DataStore',
    cardinality: '0..n',
    policy: 'dynamic'
  })
  private dataStores: any[] = [];

  @Reference({
    name: 'eventAdmin',
    interface: 'EventAdmin',
    cardinality: '0..1',
    policy: 'dynamic'
  })
  private eventAdmin?: any;

  get(_key: string) {
    return null;
  }

  set(_key: string, _value: any, _ttl: number) {
    // Cache implementation
  }

  invalidate(_key: string) {
    // Invalidation logic
  }
}

// 6. ApiGateway - DS Component with multiple dependencies
@Component({
  name: 'ApiGateway',
  immediate: true,
  configurationPolicy: 'require',
  configurationPid: 'com.example.gateway'
})
@Service({
  interfaces: ['ApiGateway']
})
class ApiGatewayImpl {
  @Reference({
    name: 'auth',
    interface: 'AuthenticationService',
    cardinality: '1..1',
    policy: 'static'
  })
  private auth: any;

  @Reference({
    name: 'userManager',
    interface: 'UserManagerService',
    cardinality: '1..1',
    policy: 'static'
  })
  private userManager: any;

  @Reference({
    name: 'cache',
    interface: 'CacheService',
    cardinality: '0..1',
    policy: 'dynamic'
  })
  private cache?: any;

  @Reference({
    name: 'notifications',
    interface: 'NotificationService',
    cardinality: '0..n',
    policy: 'dynamic'
  })
  private notifications: any[] = [];

  @Reference({
    name: 'logger',
    interface: 'LogService',
    cardinality: '1..1',
    policy: 'static'
  })
  private logger: any;

  handleRequest(_req: any) {
    console.log('Handling request');
  }

  registerRoute(_path: string, _handler: Function) {
    // Route registration
  }
}

// 7. PaymentProcessor - Component with MISSING required dependency
@Component({
  name: 'PaymentProcessor',
  immediate: true,
  configurationPolicy: 'require',
  configurationPid: 'com.example.payment'
})
@Service({
  interfaces: ['PaymentProcessorService']
})
class PaymentProcessor {
  @Reference({
    name: 'gateway',
    interface: 'PaymentGateway',
    cardinality: '1..1',  // MANDATORY - will be missing!
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

  processPayment(amount: number) {
    console.log(`Processing payment: ${amount}`);
  }

  refundPayment(transactionId: string) {
    console.log(`Refunding: ${transactionId}`);
  }
}

// 8. EmailService - Component with MISSING optional dependency
@Component({
  name: 'EmailService',
  immediate: false,
  configurationPolicy: 'optional',
  configurationPid: 'com.example.email'
})
@Service({
  interfaces: ['EmailService']
})
class EmailServiceImpl {
  @Reference({
    name: 'mailServer',
    interface: 'MailServer',
    cardinality: '0..1',  // OPTIONAL - will be missing (warning only)
    policy: 'dynamic'
  })
  private mailServer?: any;

  @Reference({
    name: 'eventAdmin',
    interface: 'EventAdmin',
    cardinality: '0..1',
    policy: 'dynamic'
  })
  private eventAdmin?: any;

  sendEmail(to: string, subject: string, _body: string) {
    console.log(`Email to ${to}: ${subject}`);
  }
}

// 9. ReportGenerator - Component with MISSING required multiple dependencies
@Component({
  name: 'ReportGenerator',
  immediate: false,
  configurationPolicy: 'optional'
})
@Service({
  interfaces: ['ReportGeneratorService']
})
class ReportGenerator {
  @Reference({
    name: 'dataProviders',
    interface: 'DataProvider',
    cardinality: '1..n',  // MANDATORY MULTIPLE - will be missing!
    policy: 'dynamic'
  })
  private dataProviders: any[] = [];

  @Reference({
    name: 'logger',
    interface: 'LogService',
    cardinality: '0..1',
    policy: 'dynamic'
  })
  private logger?: any;

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

        // Register component instances using the decorator metadata
        // The decorators store metadata using reflect-metadata
        // NOTE: Factory components are NOT included here - they're registered separately below
        const componentInstances = [
          new UserManager(),
          new DataAccessLayerImpl(),
          // NotificationServiceImpl is a FACTORY - registered separately below
          new AuthenticationServiceImpl(),
          new CacheServiceImpl(),
          new ApiGatewayImpl(),
          new PaymentProcessor(),
          new EmailServiceImpl(),
          new ReportGenerator(),
        ];

        // Register each component instance as a service
        // The framework's getDecoratorInfo() will extract the metadata from reflect-metadata
        componentInstances.forEach((instance: any) => {
          // Try to get the decorator info to determine the service name
          try {
            const decoratorInfo = getDecoratorInfo(instance);

            if (decoratorInfo.component.isComponent) {
              const interfaces = decoratorInfo.service.interfaces || [];
              const serviceName = interfaces[0] || decoratorInfo.component.name || 'UnknownService';

              log(`Registering DS component: ${serviceName} (${decoratorInfo.component.name})`);

              // Register the service instance
              context.registerService(serviceName, instance, {
                'service.vendor': 'Pandino Demo',
                'service.description': `DS Component: ${decoratorInfo.component.name}`,
              });
            }
          } catch (error) {
            console.error('Failed to register component:', error);
          }
        });

        // ============================================
        // DEMONSTRATE FACTORY COMPONENTS
        // ============================================

        log('Demonstrating factory component pattern...');

        // Factory components create instances via Configuration Admin.
        // For demo purposes, we'll manually create instances to show what they look like.

        // Register the factory component metadata (shows the Factory badge)
        const factoryMetadata = getDecoratorInfo(NotificationServiceImpl.prototype);
        context.registerService('NotificationFactory', {
          // Factory service that would create instances
          createNotification: (config: any) => new NotificationServiceImpl(),
        }, {
          'service.vendor': 'Pandino Demo',
          'service.description': 'Factory for creating notification service instances',
          'component.name': factoryMetadata.component.name,
          'component.factory': 'notification.factory',
        });

        // Create 2 instances to demonstrate what factory-created services look like
        // In real usage, Configuration Admin would do this automatically
        const notificationInstance1 = new NotificationServiceImpl();
        const notificationInstance2 = new NotificationServiceImpl();

        log('Creating factory instances (simulating Configuration Admin behavior)...');

        // Register first instance with service.factoryPid to show factory relationship
        context.registerService('NotificationService', notificationInstance1, {
          'service.vendor': 'Pandino Demo',
          'service.description': 'Notification service instance #1',
          'service.pid': 'notification.factory.1',
          'service.factoryPid': 'notification.factory',  // Links to factory
          'notification.type': 'email',
        });

        // Register second instance
        context.registerService('NotificationService', notificationInstance2, {
          'service.vendor': 'Pandino Demo',
          'service.description': 'Notification service instance #2',
          'service.pid': 'notification.factory.2',
          'service.factoryPid': 'notification.factory',  // Links to factory
          'notification.type': 'sms',
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

