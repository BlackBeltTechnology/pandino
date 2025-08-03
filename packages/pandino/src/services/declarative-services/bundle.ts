import type {
  BundleActivator,
  BundleContext,
  BundleListener,
  ServiceReference,
  ServiceRegistration,
} from '~/framework/interfaces';
import { BundleEvent } from '~/framework/interfaces';
import { BUNDLE_STATES } from '~/types/constants';
import type { OSGiFramework } from '~/framework/framework';
import { ServiceComponentRuntime } from './scr';
import { SCRBundleConfiguration } from './interfaces';

export class ServiceComponentRuntimeBundleActivator implements BundleActivator, BundleListener {
  private serviceRegistration: ServiceRegistration<any> | null = null;
  private frameworkReference: ServiceReference<OSGiFramework> | null = null;
  private scr: ServiceComponentRuntime | null = null;
  private context: BundleContext | null = null;

  async start(context: BundleContext): Promise<void> {
    this.context = context;
    this.frameworkReference = context.getServiceReference<OSGiFramework>('OSGiFramework')!;
    const framework = context.getService(this.frameworkReference)!;

    this.scr = new ServiceComponentRuntime(framework, context);
    this.serviceRegistration = context.registerService('ServiceComponentRuntime', this.scr);

    context.addBundleListener(this);

    const bundles = context.getBundles();
    for (const bundle of bundles) {
      this.processBundle(bundle);
    }
  }

  async stop(context: BundleContext): Promise<void> {
    if (this.context) {
      this.context.removeBundleListener(this);
      this.context = null;
    }

    if (this.serviceRegistration) {
      this.serviceRegistration.unregister();
      this.serviceRegistration = null;
    }

    if (this.frameworkReference) {
      context.ungetService(this.frameworkReference);
    }

    this.scr = null;
  }

  bundleChanged(event: BundleEvent): void {
    const bundle = event.getBundle();
    const bundleState = event.getType();
    const bundleId = bundle.getBundleId();

    switch (bundleState) {
      case BUNDLE_STATES.RESOLVED:
      case BUNDLE_STATES.ACTIVE:
        this.processBundle(bundle);
        break;

      case BUNDLE_STATES.STOPPING:
        this.deactivateBundleComponents(bundleId);
        break;

      case BUNDLE_STATES.UNINSTALLED:
        this.removeBundleComponents(bundleId);
        break;

      default:
        // For other states (INSTALLED, STARTING), we don't need to take action
        break;
    }
  }

  private processBundle(bundle: any): void {
    if (!this.scr) return;

    try {
      // First, check if the bundle has a configuration that extends SCRBundleConfiguration
      // This allows us to access the components property without modifying the core framework
      const bundleModule = (bundle as any).getBundleModule?.();
      const bundleId = bundle.getBundleId();
      let components: any[] | undefined;

      if (bundleModule && bundleModule.components && Array.isArray(bundleModule.components)) {
        components = bundleModule.components;
      }

      if (bundleModule && bundleModule.default) {
        const config = bundleModule.default as SCRBundleConfiguration;
        if (config.components && Array.isArray(config.components)) {
          components = components ? [...components, ...config.components] : config.components;
        }
      }

      if (components && components.length > 0) {
        for (const component of components) {
          try {
            this.scr.registerComponent(component, bundleId);
          } catch (error) {
            console.error(`Failed to register component from bundle ${bundleId}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('Error processing bundle for components:', error);
    }
  }

  // Deactivate all components for a bundle when it's stopping
  private async deactivateBundleComponents(bundleId: number): Promise<void> {
    if (!this.scr) return;

    try {
      await this.scr.deactivateBundleComponents(bundleId);
    } catch (error) {
      console.error(`Error deactivating components for bundle ${bundleId}:`, error);
    }
  }

  // Remove all components for a bundle when it's uninstalled
  private async removeBundleComponents(bundleId: number): Promise<void> {
    if (!this.scr) return;

    try {
      await this.scr.removeBundleComponents(bundleId);
      console.debug(`Removed all components for bundle ${bundleId}`);
    } catch (error) {
      console.error(`Error removing components for bundle ${bundleId}:`, error);
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
