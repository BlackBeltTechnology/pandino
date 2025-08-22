import type { Bundle, ServiceFactory, ServiceRegistration } from '~/framework/interfaces';
import { ComponentContextImpl, ServiceComponentRuntime } from '~/services/declarative-services';
import type { ComponentDescriptor } from '@pandino/decorators';

export class PrototypeServiceFactory implements ServiceFactory<any> {
  constructor(
    private ComponentClass: any,
    private metadata: ComponentDescriptor,
    private scr: ServiceComponentRuntime,
  ) {}

  getService(bundle: Bundle, registration: ServiceRegistration<any>): any {
    const instance = new this.ComponentClass();

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
          .error(`Failed to activate prototype instance: ${error}`, error as Error);
        throw error;
      }
    }

    // Return a proxy that forces the framework to not cache this instance
    // by making each call return a different object reference
    return new Proxy(instance, {
      get(target, prop, receiver) {
        // Add a unique identifier to prevent caching
        if (prop === Symbol.toPrimitive || prop === 'valueOf' || prop === 'toString') {
          return () => `PrototypeInstance_${Date.now()}_${Math.random()}`;
        }
        return Reflect.get(target, prop, receiver);
      },
    });
  }

  ungetService(_bundle: Bundle, _registration: ServiceRegistration<any>, service: any): void {
    // For prototype scope, immediately deactivate the instance
    if (this.metadata.deactivate && typeof service[this.metadata.deactivate] === 'function') {
      try {
        service[this.metadata.deactivate]();
      } catch (error) {
        this.scr
          .getFramework()
          .getLogger()
          .error(`Failed to deactivate prototype instance: ${error}`, error as Error);
      }
    }
  }

  private satisfyInstanceReferences(instance: any): void {
    for (const ref of this.metadata.references || []) {
      try {
        this.scr.satisfyReferenceForInstance(instance, ref);
      } catch (error) {
        this.scr
          .getFramework()
          .getLogger()
          .error(`Failed to satisfy reference ${ref.interface} for prototype instance: ${error}`, error as Error);
      }
    }
  }
}
