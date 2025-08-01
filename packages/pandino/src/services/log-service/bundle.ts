import { ConsoleLogService } from './console-log-service';
import type { BundleActivator, BundleContext, ServiceRegistration } from '~/framework/interfaces';
import type { LogService } from './interfaces';
import { LogLevel } from './interfaces';

export class LogServiceBundleActivator implements BundleActivator {
  private serviceRegistration: ServiceRegistration<LogService> | null = null;

  async start(context: BundleContext): Promise<void> {
    const logService = new ConsoleLogService();
    // Default to INFO level, can be configured later
    logService.setLogLevel(LogLevel.INFO);
    this.serviceRegistration = context.registerService('LogService', logService);
  }

  async stop(): Promise<void> {
    if (this.serviceRegistration) {
      this.serviceRegistration.unregister();
      this.serviceRegistration = null;
    }
  }
}

export default {
  headers: {
    bundleSymbolicName: '@pandino/log-service',
    bundleVersion: import.meta.env.VITE_PANDINO_VERSION,
    bundleName: 'Pandino Log Service',
    bundleDescription: 'Provides centralized logging with bundle context',
  },
  activator: new LogServiceBundleActivator(),
};
