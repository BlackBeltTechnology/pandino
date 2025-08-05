import type { BundleActivator, BundleContext, ServiceReference } from '~/framework/interfaces';
import type { OSGiFramework } from '~/framework/framework';
import { ResourceMapProcessor } from './resource-map-processor';

export class ResourceManagementBundleActivator implements BundleActivator {
  private frameworkReference: ServiceReference<OSGiFramework> | null = null;

  async start(context: BundleContext): Promise<void> {
    this.frameworkReference = context.getServiceReference<OSGiFramework>('OSGiFramework')!;
    const framework = context.getService(this.frameworkReference)!;

    context.registerService('FragmentResourceProcessor', new ResourceMapProcessor());

    framework.getLogger().info('Resource Management service started');
  }

  async stop(context: BundleContext): Promise<void> {
    let logger = context.getLogService();

    if (this.frameworkReference) {
      const framework = context.getService(this.frameworkReference);
      if (framework) {
        logger = framework.getLogger();
      }

      context.ungetService(this.frameworkReference);
      this.frameworkReference = null;
    }

    if (logger) {
      logger.info('Resource Management service stopped');
    } else {
      console.info('Resource Management service stopped');
    }
  }
}

export default {
  headers: {
    bundleSymbolicName: '@pandino/resource-management',
    bundleVersion: import.meta.env.VITE_PANDINO_VERSION,
    bundleName: 'Pandino Resource Management',
    bundleDescription: 'Provides resource management for fragments',
  },
  activator: new ResourceManagementBundleActivator(),
};
