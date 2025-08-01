import type { BundleContext, ServiceReference } from '~/framework/interfaces';
import type { ComponentContext } from './interfaces';

export class ComponentContextImpl implements ComponentContext {
  constructor(
    private readonly bundleContext: BundleContext,
    private readonly properties: Record<string, any>,
    private readonly serviceReference: ServiceReference<any> | null,
    private readonly componentName: string,
    private readonly scr: any,
  ) {}

  getBundleContext(): BundleContext {
    return this.bundleContext;
  }

  getProperties(): Record<string, any> {
    return { ...this.properties }; // Return a copy to prevent modification
  }

  getServiceReference(): ServiceReference<any> {
    if (!this.serviceReference) {
      throw new Error('No service reference available for this component');
    }
    return this.serviceReference;
  }

  getComponentName(): string {
    return this.componentName;
  }

  locateService<S>(name: string): S | null {
    const references = this.bundleContext.getServiceReferences(name);
    if (!references || references.length === 0) {
      return null;
    }
    return this.bundleContext.getService<S>(references[0]);
  }

  locateServices<S>(name: string): S[] {
    const references = this.bundleContext.getServiceReferences(name);
    if (!references || references.length === 0) {
      return [];
    }
    return references.map((ref) => this.bundleContext.getService(ref)).filter(Boolean) as S[];
  }

  disableComponent(name: string): void {
    this.scr.deactivateComponent(name);
  }

  enableComponent(name: string): void {
    this.scr.activateComponent(name);
  }
}
