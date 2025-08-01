import type { BundleActivator, BundleContext, ServiceReference, ServiceRegistration } from '~/framework/interfaces';
import type { OSGiFramework } from '~/framework/framework';
import type { ConfigurationAdmin } from './interfaces';
import { ConfigurationAdminImpl } from './configuration-admin';

export class ConfigurationAdminBundleActivator implements BundleActivator {
  private serviceRegistration: ServiceRegistration<ConfigurationAdmin> | null = null;
  private configAdmin: ConfigurationAdminImpl | null = null;
  private frameworkReference: ServiceReference<OSGiFramework> | null = null;

  async start(context: BundleContext): Promise<void> {
    this.frameworkReference = context.getServiceReference<OSGiFramework>('OSGiFramework')!;
    const framework = context.getService(this.frameworkReference)!;

    this.configAdmin = new ConfigurationAdminImpl(framework);
    this.serviceRegistration = context.registerService('ConfigurationAdmin', this.configAdmin);
  }

  async stop(context: BundleContext): Promise<void> {
    if (this.serviceRegistration) {
      this.serviceRegistration.unregister();
      this.serviceRegistration = null;
    }
    if (this.frameworkReference) {
      context.ungetService(this.frameworkReference);
    }
    this.configAdmin = null;
  }
}

export default {
  headers: {
    bundleSymbolicName: '@pandino/config-admin',
    bundleVersion: import.meta.env.VITE_PANDINO_VERSION,
    bundleName: 'Pandino Configuration Admin Service',
    bundleDescription: 'Provides dynamic configuration management capabilities',
  },
  activator: new ConfigurationAdminBundleActivator(),
};
