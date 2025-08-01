import type { BundleActivator, BundleContext, ServiceReference, ServiceRegistration } from '~/framework/interfaces';
import type { OSGiFramework } from '~/framework/framework';
import { ServiceComponentRuntime } from './scr';

export class ServiceComponentRuntimeBundleActivator implements BundleActivator {
  private serviceRegistration: ServiceRegistration<any> | null = null;
  private frameworkReference: ServiceReference<OSGiFramework> | null = null;

  async start(context: BundleContext): Promise<void> {
    this.frameworkReference = context.getServiceReference<OSGiFramework>('OSGiFramework')!;
    const framework = context.getService(this.frameworkReference)!;

    const scr = new ServiceComponentRuntime(framework, context);
    this.serviceRegistration = context.registerService('ServiceComponentRuntime', scr);
  }

  async stop(context: BundleContext): Promise<void> {
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
    bundleSymbolicName: '@pandino/declarative-services',
    bundleVersion: import.meta.env.VITE_PANDINO_VERSION,
    bundleName: 'Pandino Service Component Runtime',
    bundleDescription: 'Provides declarative services management',
  },
  activator: new ServiceComponentRuntimeBundleActivator(),
};
