import { LogLevel, type LogService } from '../services/log-service';
import type { BundleModule } from '../types/bundle-metadata';
import { BootstrapConfig, DEFAULT_BOOTSTRAP_CONFIG } from './bootstrap-config';
import { OSGiFramework } from './framework';

import ConfigAdminBundle from '../services/config-admin/bundle';
import EventAdminBundle from '../services/event-admin/bundle';
import LogServiceBundle from '../services/log-service/bundle';
import ServiceComponentRuntimeBundle from '../services/declarative-services/bundle';
import ServiceTrackerBundle from '../services/service-tracker/bundle';

export class OSGiBootstrap {
  private readonly framework: OSGiFramework;
  private readonly config: BootstrapConfig;

  constructor(config?: BootstrapConfig) {
    this.config = { ...DEFAULT_BOOTSTRAP_CONFIG, ...config };
    this.framework = new OSGiFramework(this.config.frameworkLogLevel);
  }

  async start(): Promise<OSGiFramework> {
    await this.framework.start();

    await this.installSystemBundle();
    // No need to start the system bundle as each service bundle is started individually

    return this.framework;
  }

  private async installSystemBundle() {
    // Install Log Service first as other services might need logging
    const logServiceBundleModule: Promise<BundleModule> = Promise.resolve({
      default: LogServiceBundle,
    });
    const logServiceBundle = await this.framework.installBundle(logServiceBundleModule);
    await logServiceBundle.start();

    const logServiceRef = this.framework.getBundleContext().getServiceReference<LogService>('LogService');
    if (logServiceRef) {
      const logService = this.framework.getBundleContext().getService(logServiceRef);
      if (logService) {
        logService.setLogLevel(this.config.frameworkLogLevel || LogLevel.INFO);
      }
    }

    const configAdminBundleModule: Promise<BundleModule> = Promise.resolve({
      default: ConfigAdminBundle,
    });
    const configAdminBundle = await this.framework.installBundle(configAdminBundleModule);
    await configAdminBundle.start();

    const eventAdminBundleModule: Promise<BundleModule> = Promise.resolve({
      default: EventAdminBundle,
    });
    const eventAdminBundle = await this.framework.installBundle(eventAdminBundleModule);
    await eventAdminBundle.start();

    const scrBundleModule: Promise<BundleModule> = Promise.resolve({
      default: ServiceComponentRuntimeBundle,
    });
    const scrBundle = await this.framework.installBundle(scrBundleModule);
    await scrBundle.start();

    const serviceTrackerBundleModule: Promise<BundleModule> = Promise.resolve({
      default: ServiceTrackerBundle,
    });
    const serviceTrackerBundle = await this.framework.installBundle(serviceTrackerBundleModule);
    await serviceTrackerBundle.start();
  }

  async stop(): Promise<void> {
    await this.framework.stop();
  }

  getFramework(): OSGiFramework {
    return this.framework;
  }
}
