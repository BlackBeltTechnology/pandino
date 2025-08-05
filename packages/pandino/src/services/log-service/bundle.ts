import type { BundleActivator, BundleContext, ServiceRegistration } from '~/framework/interfaces';
import { type LogService } from './interfaces';
import { DefaultLogServiceFactory } from '~/services/log-service/log-service-factory';

export class LogServiceBundleActivator implements BundleActivator {
  private serviceRegistration: ServiceRegistration<LogService> | null = null;

  async start(context: BundleContext): Promise<void> {
    const logServiceFactory = new DefaultLogServiceFactory().createLogServiceFactory();

    this.serviceRegistration = context.registerService('LogService', logServiceFactory);
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
