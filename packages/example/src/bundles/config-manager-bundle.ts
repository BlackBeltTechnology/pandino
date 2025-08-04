import type {
  BundleActivator,
  BundleContext,
  ConfigurationAdmin,
  ServiceReference,
  ServiceRegistration,
} from '@pandino/pandino';

export interface ConfigManagerService {
  getAllConfigurations(): Promise<Record<string, any>[]>;
  getConfiguration(pid: string): Promise<Record<string, any> | null>;
  updateConfiguration(pid: string, properties: Record<string, any>): Promise<void>;
  deleteConfiguration(pid: string): Promise<void>;
  createConfiguration(pid: string, defaultProperties: Record<string, any>): Promise<void>;
}

class ConfigManagerServiceImpl implements ConfigManagerService {
  private configAdmin: ConfigurationAdmin;
  private readonly logger: any;

  constructor(configAdmin: ConfigurationAdmin, logger: any) {
    this.configAdmin = configAdmin;
    this.logger = logger;
  }

  async getAllConfigurations(): Promise<Record<string, any>[]> {
    try {
      const configs = await this.configAdmin.listConfigurations();

      if (!configs) {
        return [];
      }

      return await Promise.all(
        configs.map(async (config) => {
          const properties = await config.getProperties();
          return {
            pid: config.getPid(),
            ...properties,
          };
        }),
      );
    } catch (err) {
      if (this.logger) {
        this.logger.error('Error getting all configurations:', err as Error);
      }
      return [];
    }
  }

  async getConfiguration(pid: string): Promise<Record<string, any> | null> {
    try {
      const config = await this.configAdmin.getConfiguration(pid);

      if (!config) {
        return null;
      }

      const properties = await config.getProperties();

      return {
        pid: config.getPid(),
        ...properties,
      };
    } catch (err) {
      if (this.logger) {
        this.logger.error(`Error getting configuration for PID ${pid}:`, err as Error);
      }
      return null;
    }
  }

  async updateConfiguration(pid: string, properties: Record<string, any>): Promise<void> {
    try {
      const config = await this.configAdmin.getConfiguration(pid);

      if (!config) {
        throw new Error(`Configuration with PID ${pid} not found`);
      }

      await config.update(properties);

      if (this.logger) {
        this.logger.info(`Configuration ${pid} updated:`, undefined, properties);
      }
    } catch (err) {
      if (this.logger) {
        this.logger.error(`Error updating configuration for PID ${pid}:`, err as Error);
      }
      throw err;
    }
  }

  async deleteConfiguration(pid: string): Promise<void> {
    try {
      const config = await this.configAdmin.getConfiguration(pid);

      if (!config) {
        throw new Error(`Configuration with PID ${pid} not found`);
      }

      await config.delete();

      if (this.logger) {
        this.logger.info(`Configuration ${pid} deleted`);
      }
    } catch (err) {
      if (this.logger) {
        this.logger.error(`Error deleting configuration for PID ${pid}:`, err as Error);
      }
      throw err;
    }
  }

  async createConfiguration(pid: string, defaultProperties: Record<string, any>): Promise<void> {
    try {
      // Get configuration by PID (creates it if it doesn't exist)
      const config = await this.configAdmin.getConfiguration(pid);

      // Check if configuration already exists
      const existingProps = config.getProperties();

      if (existingProps) {
        if (this.logger) {
          this.logger.info(`Configuration ${pid} already exists, not creating`);
        }
        return;
      }

      // Update with default properties
      await config.update(defaultProperties);

      if (this.logger) {
        this.logger.info(`Configuration ${pid} created with default properties:`, undefined, defaultProperties);
      }
    } catch (err) {
      if (this.logger) {
        this.logger.error(`Error creating configuration for PID ${pid}:`, err as Error);
      }
      throw err;
    }
  }
}

class ConfigManagerBundleActivator implements BundleActivator {
  private serviceRegistration: ServiceRegistration<ConfigManagerService> | null = null;
  private configAdminRef: ServiceReference<ConfigurationAdmin> | null = null;
  private configManagerService: ConfigManagerServiceImpl | null = null;
  private frameworkLogger: any = null;

  async start(context: BundleContext): Promise<void> {
    this.frameworkLogger = context.getLogService();

    if (this.frameworkLogger) {
      this.frameworkLogger.info('Starting Configuration Manager Bundle');
    }

    try {
      this.configAdminRef = context.getServiceReference<ConfigurationAdmin>('ConfigurationAdmin');

      if (!this.configAdminRef) {
        if (this.frameworkLogger) {
          this.frameworkLogger.warn('ConfigurationAdmin service not available, waiting...');
        }
        return; // Bundle will be in STARTING state until dependencies are available
      }

      const configAdmin = context.getService<ConfigurationAdmin>(this.configAdminRef);

      if (!configAdmin) {
        if (this.frameworkLogger) {
          this.frameworkLogger.warn('Failed to get ConfigurationAdmin service instance');
        }
        return;
      }

      this.configManagerService = new ConfigManagerServiceImpl(configAdmin, this.frameworkLogger);
      this.serviceRegistration = context.registerService<ConfigManagerService>(
        'ConfigManagerService',
        this.configManagerService,
        {
          'service.description': 'Configuration manager service',
          'service.vendor': 'Pandino Showcase',
        },
      );

      await this.createDefaultConfigurations();

      if (this.frameworkLogger) {
        this.frameworkLogger.info('Configuration Manager Bundle started');
      }
    } catch (error) {
      if (this.frameworkLogger) {
        this.frameworkLogger.error('Error starting Configuration Manager Bundle:', error as Error);
      }
    }
  }

  async stop(context: BundleContext): Promise<void> {
    if (this.frameworkLogger) {
      this.frameworkLogger.info('Stopping Configuration Manager Bundle');
    }

    if (this.serviceRegistration) {
      this.serviceRegistration.unregister();
      this.serviceRegistration = null;
    }

    if (this.configAdminRef) {
      context.ungetService(this.configAdminRef);
      this.configAdminRef = null;
    }

    if (this.frameworkLogger) {
      this.frameworkLogger.info('Configuration Manager Bundle stopped');
    }
  }

  private async createDefaultConfigurations(): Promise<void> {
    if (!this.configManagerService) return;

    try {
      await this.configManagerService.createConfiguration('ui.settings', {
        theme: 'dark',
        fontSize: 14,
        showNotifications: true,
        language: 'en',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h',
      });

      await this.configManagerService.createConfiguration('database.connection', {
        host: 'localhost',
        port: 5432,
        database: 'pandino',
        username: 'admin',
        password: '********',
        maxConnections: 10,
        timeout: 30000,
      });

      await this.configManagerService.createConfiguration('logging.settings', {
        level: 'info',
        console: true,
        file: false,
        filePath: '/var/log/pandino.log',
        maxFileSize: 10485760, // 10MB
        maxFiles: 5,
      });

      await this.configManagerService.createConfiguration('email.settings', {
        smtpHost: 'smtp.example.com',
        smtpPort: 587,
        username: 'notifications@example.com',
        password: '********',
        fromAddress: 'notifications@example.com',
        fromName: 'Pandino Notifications',
        useTLS: true,
      });
    } catch (err) {
      if (this.frameworkLogger) {
        this.frameworkLogger.error('Error creating default configurations:', err as Error);
      }
    }
  }
}

export default {
  headers: {
    bundleSymbolicName: '@example/config-manager',
    bundleVersion: '1.0.0',
    bundleName: 'Configuration Manager Bundle',
  },
  activator: new ConfigManagerBundleActivator(),
};
