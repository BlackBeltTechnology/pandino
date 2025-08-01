import { ConfigurationAdminImpl } from '~/services/config-admin/configuration-admin';
import { ServiceComponentRuntime } from '~/services/declarative-services/scr';
import { EventAdminImpl } from '~/services/event-admin/event-admin';
import { ConsoleLogService } from '~/services/log-service/console-log-service';
import { LogLevel } from '~/services/log-service/interfaces';
import type { BundleModule } from '~/types/bundle-metadata';
import { BootstrapConfig, DEFAULT_BOOTSTRAP_CONFIG } from './bootstrap-config';
import { OSGiFramework } from './framework';

export class OSGiBootstrap {
  private readonly framework: OSGiFramework;
  private readonly config: BootstrapConfig;

  constructor(config?: BootstrapConfig) {
    this.config = { ...DEFAULT_BOOTSTRAP_CONFIG, ...config };
    this.framework = new OSGiFramework(this.config.frameworkLogLevel);
  }

  async start(): Promise<OSGiFramework> {
    await this.framework.start();

    const systemBundle = await this.installSystemBundle();
    await systemBundle.start();

    return this.framework;
  }

  private async installSystemBundle() {
    // Create a system bundle module
    const systemBundleModule: Promise<BundleModule> = Promise.resolve({
      default: {
        headers: {
          bundleSymbolicName: 'system.core-services',
          bundleVersion: '1.0.0',
          bundleName: 'System Core Services',
          bundleDescription: 'Provides core system services',
        },
        activator: {
          start: async (context) => {
            const configAdmin = new ConfigurationAdminImpl(this.framework);
            context.registerService('ConfigurationAdmin', configAdmin);

            const eventAdmin = new EventAdminImpl(this.framework);
            context.registerService('EventAdmin', eventAdmin);

            const logService = new ConsoleLogService();
            // Apply the configured log level to the log service
            logService.setLogLevel(this.config.frameworkLogLevel || LogLevel.INFO);
            context.registerService('LogService', logService);

            const scr = new ServiceComponentRuntime(this.framework, context);
            context.registerService('ServiceComponentRuntime', scr);
          },
          stop: async () => {
            // Cleanup will be handled automatically when services are unregistered
          },
        },
      },
    });

    const systemBundle = await this.framework.installBundle(systemBundleModule);
    await systemBundle.start();

    return systemBundle;
  }

  async stop(): Promise<void> {
    await this.framework.stop();
  }

  getFramework(): OSGiFramework {
    return this.framework;
  }
}
