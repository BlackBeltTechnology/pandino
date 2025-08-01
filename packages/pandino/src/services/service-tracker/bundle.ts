import type { BundleActivator, BundleContext, ServiceRegistration } from '~/framework/interfaces';
import { ServiceTracker } from './index';

export class ServiceTrackerBundleActivator implements BundleActivator {
  private serviceRegistration: ServiceRegistration<any> | null = null;

  async start(context: BundleContext): Promise<void> {
    this.serviceRegistration = context.registerService('ServiceTracker', ServiceTracker);
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
    bundleSymbolicName: '@pandino/service-tracker',
    bundleVersion: import.meta.env.VITE_PANDINO_VERSION,
    bundleName: 'Pandino Service Tracker',
    bundleDescription: 'Provides simplified service discovery and tracking',
  },
  activator: new ServiceTrackerBundleActivator(),
};
