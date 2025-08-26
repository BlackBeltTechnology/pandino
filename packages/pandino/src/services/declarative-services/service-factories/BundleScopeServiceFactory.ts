import type { Bundle, ServiceFactory, ServiceRegistration } from '../../../framework/interfaces';
import { ComponentContextImpl, ComponentEntry, ServiceComponentRuntime } from '../../../services/declarative-services';
import type { ComponentDescriptor } from '@pandino/decorators';

export class BundleScopeServiceFactory implements ServiceFactory<any> {
  constructor(
    private ComponentClass: any,
    private metadata: ComponentDescriptor,
    private scr: ServiceComponentRuntime,
    private componentEntry: ComponentEntry,
  ) {}

  getService(bundle: Bundle, registration: ServiceRegistration<any>): any {
    const bundleId = bundle.getBundleId();

    if (!this.componentEntry.bundleInstances) {
      this.componentEntry.bundleInstances = new Map();
    }

    let instance = this.componentEntry.bundleInstances.get(bundleId);
    if (instance) {
      return instance;
    }

    instance = new this.ComponentClass();
    this.componentEntry.bundleInstances.set(bundleId, instance);

    const context = new ComponentContextImpl(
      bundle.getContext(),
      this.metadata.properties || {},
      registration.getReference(),
      this.metadata.name,
      this.scr,
    );

    // Bind references before invoking @Activate so injected fields are available during activation.
    this.satisfyInstanceReferences(instance);

    // Invoke @Activate if present; otherwise fallback to conventional 'activate' if available.
    const activateMethodName =
      this.metadata.activate || (typeof (instance as any)['activate'] === 'function' ? 'activate' : null);
    if (activateMethodName) {
      try {
        (instance as any)[activateMethodName](context);
      } catch (error) {
        this.scr
          .getFramework()
          .getLogger()
          .error(`Failed to activate bundle-scoped instance: ${error}`, error as Error);
        throw error;
      }
    }

    return instance;
  }

  ungetService(_bundle: Bundle, _registration: ServiceRegistration<any>, _service: any): void {
    // For bundle scope, we don't immediately deactivate on unget
    // The instance stays alive until the bundle stops or component is deactivated
  }

  private satisfyInstanceReferences(instance: any): void {
    for (const ref of this.metadata.references || []) {
      try {
        this.scr.satisfyReferenceForInstance(instance, ref);
      } catch (error) {
        this.scr
          .getFramework()
          .getLogger()
          .error(`Failed to satisfy reference ${ref.interface} for bundle-scoped instance: ${error}`, error as Error);
      }
    }
  }
}
