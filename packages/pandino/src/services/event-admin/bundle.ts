import type { BundleActivator, BundleContext, ServiceReference, ServiceRegistration } from '../../framework/interfaces';
import type { OSGiFramework } from '../../framework/framework';
import type { EventAdmin } from './interfaces';
import { EventAdminImpl } from './event-admin';

export class EventAdminBundleActivator implements BundleActivator {
  private serviceRegistration: ServiceRegistration<EventAdmin> | null = null;
  private eventAdmin: EventAdminImpl | null = null;
  private frameworkReference: ServiceReference<OSGiFramework> | null = null;

  async start(context: BundleContext): Promise<void> {
    this.frameworkReference = context.getServiceReference<OSGiFramework>('OSGiFramework')!;
    const framework = context.getService(this.frameworkReference)!;

    this.eventAdmin = new EventAdminImpl(framework);
    this.serviceRegistration = context.registerService('EventAdmin', this.eventAdmin);
  }

  async stop(context: BundleContext): Promise<void> {
    if (this.eventAdmin) {
      this.eventAdmin = null;
    }

    if (this.serviceRegistration) {
      this.serviceRegistration.unregister();
      this.serviceRegistration = null;
    }

    if (this.frameworkReference) {
      context.ungetService(this.frameworkReference);
    }
  }
}

export default {
  headers: {
    bundleSymbolicName: '@pandino/event-admin',
    bundleVersion: import.meta.env.VITE_PANDINO_VERSION,
    bundleName: 'Pandino Event Admin Service',
    bundleDescription: 'Provides event publishing and subscription capabilities',
  },
  activator: new EventAdminBundleActivator(),
};
