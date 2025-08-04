import type { BundleActivator, BundleContext, ServiceRegistration } from '@pandino/pandino';
import type { ManagedService, ConfigurationEvent, ConfigurationListener } from '@pandino/pandino';

export type HistoryType = 'UPDATED' | 'DELETED';

export interface ConfigConsumerService {
  getUISettings(): Record<string, any>;
  getDatabaseSettings(): Record<string, any>;
  getLoggingSettings(): Record<string, any>;
  getEmailSettings(): Record<string, any>;
  getConfigurationHistory(): Array<{
    timestamp: number;
    pid: string;
    type: HistoryType;
    properties?: Record<string, any>;
  }>;
}

class UISettingsManagedService implements ManagedService {
  private properties: Record<string, any> = {};
  private readonly onUpdate: (properties: Record<string, any>) => void;
  private readonly logger: any;

  constructor(onUpdate: (properties: Record<string, any>) => void, logger: any) {
    this.onUpdate = onUpdate;
    this.logger = logger;
  }

  updated(properties: Record<string, any> | null): void {
    if (properties) {
      if (this.logger) {
        this.logger.info('UI settings updated:', undefined, properties);
      }
      this.properties = { ...properties };
      this.onUpdate(this.properties);
    } else {
      if (this.logger) {
        this.logger.info('UI settings deleted');
      }
      this.properties = {};
      this.onUpdate(this.properties);
    }
  }

  getProperties(): Record<string, any> {
    return { ...this.properties };
  }
}

class DatabaseSettingsManagedService implements ManagedService {
  private properties: Record<string, any> = {};
  private readonly onUpdate: (properties: Record<string, any>) => void;
  private readonly logger: any;

  constructor(onUpdate: (properties: Record<string, any>) => void, logger: any) {
    this.onUpdate = onUpdate;
    this.logger = logger;
  }

  updated(properties: Record<string, any> | null): void {
    if (properties) {
      if (this.logger) {
        this.logger.info('Database settings updated:', undefined, properties);
      }
      this.properties = { ...properties };
      this.onUpdate(this.properties);
    } else {
      if (this.logger) {
        this.logger.info('Database settings deleted');
      }
      this.properties = {};
      this.onUpdate(this.properties);
    }
  }

  getProperties(): Record<string, any> {
    return { ...this.properties };
  }
}

class LoggingSettingsManagedService implements ManagedService {
  private properties: Record<string, any> = {};
  private readonly onUpdate: (properties: Record<string, any>) => void;
  private readonly logger: any;

  constructor(onUpdate: (properties: Record<string, any>) => void, logger: any) {
    this.onUpdate = onUpdate;
    this.logger = logger;
  }

  updated(properties: Record<string, any> | null): void {
    if (properties) {
      if (this.logger) {
        this.logger.info('Logging settings updated:', undefined, properties);
      }
      this.properties = { ...properties };
      this.onUpdate(this.properties);
    } else {
      if (this.logger) {
        this.logger.info('Logging settings deleted');
      }
      this.properties = {};
      this.onUpdate(this.properties);
    }
  }

  getProperties(): Record<string, any> {
    return { ...this.properties };
  }
}

class EmailSettingsManagedService implements ManagedService {
  private properties: Record<string, any> = {};
  private readonly onUpdate: (properties: Record<string, any>) => void;
  private readonly logger: any;

  constructor(onUpdate: (properties: Record<string, any>) => void, logger: any) {
    this.onUpdate = onUpdate;
    this.logger = logger;
  }

  updated(properties: Record<string, any> | null): void {
    if (properties) {
      if (this.logger) {
        this.logger.info('Email settings updated:', undefined, properties);
      }
      this.properties = { ...properties };
      this.onUpdate(this.properties);
    } else {
      if (this.logger) {
        this.logger.info('Email settings deleted');
      }
      this.properties = {};
      this.onUpdate(this.properties);
    }
  }

  getProperties(): Record<string, any> {
    return { ...this.properties };
  }
}

class ConfigurationHistoryListener implements ConfigurationListener {
  private history: Array<{
    timestamp: number;
    pid: string;
    type: 'UPDATED' | 'DELETED';
    properties?: Record<string, any>;
  }> = [];
  private readonly logger: any;

  constructor(logger: any) {
    this.logger = logger;

    if (this.logger) {
      this.logger.debug('ConfigurationHistoryListener constructor called');
    }

    // Initialize with a test entry to verify the component can display history
    const testEntry = {
      timestamp: Date.now(),
      pid: 'test.config',
      type: 'UPDATED' as 'UPDATED' | 'DELETED',
    };
    this.history.push(testEntry);

    if (this.logger) {
      this.logger.debug(`Added test entry to history, current length: ${this.history.length}`);
    }
  }

  configurationEvent(event: ConfigurationEvent): void {
    if (this.logger) {
      this.logger.debug('ConfigurationHistoryListener.configurationEvent called with event:', undefined, { event });
      this.logger.debug(
        `Event type: ${typeof event}, has getPid: ${typeof event.getPid === 'function'}, has getType: ${typeof event.getType === 'function'}`,
      );
    }

    try {
      const pid = event.getPid();
      if (this.logger) {
        this.logger.debug(`Got PID: ${pid}`);
      }

      const eventType = event.getType();
      if (this.logger) {
        this.logger.debug(`Got event type: ${eventType}`);
      }

      const type: HistoryType = eventType === 1 ? 'UPDATED' : 'DELETED';
      if (this.logger) {
        this.logger.debug(`Converted event type to: ${type}`);
      }

      const factoryPid = event.getFactoryPid();
      if (this.logger) {
        this.logger.debug(`Got factory PID: ${factoryPid}`);
      }

      if (this.logger) {
        this.logger.info(`Configuration event: ${type} for PID ${pid}${factoryPid ? ` (factory: ${factoryPid})` : ''}`);
        this.logger.debug(`ConfigurationHistoryListener received event: ${type} for PID ${pid}`);
      }

      const historyEntry = {
        timestamp: Date.now(),
        pid,
        type,
        // We don't have access to the properties here, but in a real application
        // you might want to fetch them from the ConfigurationAdmin service
      };

      if (this.logger) {
        this.logger.debug(`Adding to history:`, undefined, { historyEntry });
      }

      this.history.push(historyEntry);

      if (this.logger) {
        this.logger.debug(`Current history length: ${this.history.length}`);
      }

      // Keep history limited to last 100 events
      if (this.history.length > 100) {
        this.history = this.history.slice(-100);
      }
    } catch (error) {
      if (this.logger) {
        this.logger.error(`Error processing configuration event:`, error as Error);
      }
    }
  }

  getHistory(): Array<{
    timestamp: number;
    pid: string;
    type: 'UPDATED' | 'DELETED';
    properties?: Record<string, any>;
  }> {
    if (this.logger) {
      this.logger.debug(`ConfigurationHistoryListener.getHistory() called, returning ${this.history.length} items`);
      this.logger.debug('History items:', undefined, { history: [...this.history] });
    }
    return [...this.history];
  }
}

class ConfigConsumerServiceImpl implements ConfigConsumerService {
  private uiSettings: Record<string, any> = {};
  private databaseSettings: Record<string, any> = {};
  private loggingSettings: Record<string, any> = {};
  private emailSettings: Record<string, any> = {};
  private configListener: ConfigurationHistoryListener;
  private readonly logger: any;

  constructor(configListener: ConfigurationHistoryListener, logger: any) {
    this.configListener = configListener;
    this.logger = logger;
  }

  setUISettings(properties: Record<string, any>): void {
    this.uiSettings = { ...properties };
  }

  setDatabaseSettings(properties: Record<string, any>): void {
    this.databaseSettings = { ...properties };
  }

  setLoggingSettings(properties: Record<string, any>): void {
    this.loggingSettings = { ...properties };
  }

  setEmailSettings(properties: Record<string, any>): void {
    this.emailSettings = { ...properties };
  }

  getUISettings(): Record<string, any> {
    return { ...this.uiSettings };
  }

  getDatabaseSettings(): Record<string, any> {
    return { ...this.databaseSettings };
  }

  getLoggingSettings(): Record<string, any> {
    return { ...this.loggingSettings };
  }

  getEmailSettings(): Record<string, any> {
    return { ...this.emailSettings };
  }

  getConfigurationHistory(): Array<{
    timestamp: number;
    pid: string;
    type: 'UPDATED' | 'DELETED';
    properties?: Record<string, any>;
  }> {
    const history = this.configListener.getHistory();
    if (this.logger) {
      this.logger.debug(
        `ConfigConsumerServiceImpl.getConfigurationHistory() returning ${history.length} items:`,
        undefined,
        { history },
      );
    }
    return history;
  }
}

class ConfigConsumerBundleActivator implements BundleActivator {
  private serviceRegistration: ServiceRegistration<ConfigConsumerService> | null = null;
  private uiServiceRegistration: ServiceRegistration<ManagedService> | null = null;
  private dbServiceRegistration: ServiceRegistration<ManagedService> | null = null;
  private logServiceRegistration: ServiceRegistration<ManagedService> | null = null;
  private emailServiceRegistration: ServiceRegistration<ManagedService> | null = null;
  private configListenerRegistration: ServiceRegistration<ConfigurationListener> | null = null;

  private uiService: UISettingsManagedService | null = null;
  private dbService: DatabaseSettingsManagedService | null = null;
  private logService: LoggingSettingsManagedService | null = null;
  private emailService: EmailSettingsManagedService | null = null;
  private configListener: ConfigurationHistoryListener | null = null;

  private configConsumerService: ConfigConsumerServiceImpl | null = null;
  private frameworkLogger: any = null;

  async start(context: BundleContext): Promise<void> {
    this.frameworkLogger = context.getLogService();

    if (this.frameworkLogger) {
      this.frameworkLogger.info('Starting Configuration Consumer Bundle');
    }

    try {
      this.configListener = new ConfigurationHistoryListener(this.frameworkLogger);

      if (this.frameworkLogger) {
        this.frameworkLogger.debug('Registering ConfigurationHistoryListener as a ConfigurationListener service');
      }

      this.configListenerRegistration = context.registerService<ConfigurationListener>(
        ['ConfigurationListener'],
        this.configListener,
        {
          'service.description': 'Configuration history listener',
          'service.vendor': 'Pandino Showcase',
        },
      );

      if (this.frameworkLogger) {
        this.frameworkLogger.debug('ConfigurationHistoryListener registered with service registration:', undefined, {
          registration: this.configListenerRegistration,
        });
      }

      const serviceRef = this.configListenerRegistration.getReference();
      if (this.frameworkLogger) {
        this.frameworkLogger.debug('ConfigurationHistoryListener service reference properties:', undefined, {
          objectClass: serviceRef.getProperty('objectClass'),
          serviceId: serviceRef.getProperty('service.id'),
          serviceDescription: serviceRef.getProperty('service.description'),
        });
      }

      this.configConsumerService = new ConfigConsumerServiceImpl(this.configListener, this.frameworkLogger);

      this.uiService = new UISettingsManagedService(
        (props) => this.configConsumerService?.setUISettings(props),
        this.frameworkLogger,
      );

      this.uiServiceRegistration = context.registerService<ManagedService>('ManagedService', this.uiService, {
        'service.pid': 'ui.settings',
      });

      this.dbService = new DatabaseSettingsManagedService(
        (props) => this.configConsumerService?.setDatabaseSettings(props),
        this.frameworkLogger,
      );

      this.dbServiceRegistration = context.registerService<ManagedService>('ManagedService', this.dbService, {
        'service.pid': 'database.connection',
      });

      this.logService = new LoggingSettingsManagedService(
        (props) => this.configConsumerService?.setLoggingSettings(props),
        this.frameworkLogger,
      );

      this.logServiceRegistration = context.registerService<ManagedService>('ManagedService', this.logService, {
        'service.pid': 'logging.settings',
      });

      this.emailService = new EmailSettingsManagedService(
        (props) => this.configConsumerService?.setEmailSettings(props),
        this.frameworkLogger,
      );

      this.emailServiceRegistration = context.registerService<ManagedService>('ManagedService', this.emailService, {
        'service.pid': 'email.settings',
      });

      this.serviceRegistration = context.registerService<ConfigConsumerService>(
        'ConfigConsumerService',
        this.configConsumerService,
        {
          'service.description': 'Configuration consumer service',
          'service.vendor': 'Pandino Showcase',
        },
      );

      if (this.frameworkLogger) {
        this.frameworkLogger.info('Configuration Consumer Bundle started');
      }
    } catch (error) {
      if (this.frameworkLogger) {
        this.frameworkLogger.error('Error starting Configuration Consumer Bundle:', error as Error);
      }
    }
  }

  async stop(): Promise<void> {
    if (this.frameworkLogger) {
      this.frameworkLogger.info('Stopping Configuration Consumer Bundle');
    }

    if (this.serviceRegistration) {
      this.serviceRegistration.unregister();
      this.serviceRegistration = null;
    }

    if (this.uiServiceRegistration) {
      this.uiServiceRegistration.unregister();
      this.uiServiceRegistration = null;
    }

    if (this.dbServiceRegistration) {
      this.dbServiceRegistration.unregister();
      this.dbServiceRegistration = null;
    }

    if (this.logServiceRegistration) {
      this.logServiceRegistration.unregister();
      this.logServiceRegistration = null;
    }

    if (this.emailServiceRegistration) {
      this.emailServiceRegistration.unregister();
      this.emailServiceRegistration = null;
    }

    if (this.configListenerRegistration) {
      this.configListenerRegistration.unregister();
      this.configListenerRegistration = null;
    }

    if (this.frameworkLogger) {
      this.frameworkLogger.info('Configuration Consumer Bundle stopped');
    }
  }
}

export default {
  headers: {
    bundleSymbolicName: '@example/config-consumer',
    bundleVersion: '1.0.0',
    bundleName: 'Configuration Consumer Bundle',
  },
  activator: new ConfigConsumerBundleActivator(),
};
