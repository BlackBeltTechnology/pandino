import type { ComponentConfiguration, ComponentContext, ComponentInstance } from '@pandino/scr-api';
import type { Bundle, BundleContext, ServiceProperties, ServiceReference } from '@pandino/pandino-api';
import { ComponentConfigurationImpl } from './ComponentConfigurationImpl';

export class ComponentContextImpl<S> implements ComponentContext<S> {
  private readonly config: ComponentConfigurationImpl<S>;
  private readonly target: any;

  constructor(config: ComponentConfigurationImpl<S>, target: any) {
    this.config = config;
    this.target = target;
  }

  disableComponent(name: string): void {
    // TODO consider
  }

  enableComponent(name: string): void {
    // TODO consider
  }

  getBundleContext(): BundleContext {
    return undefined;
  }

  getComponentInstance(): ComponentInstance<S> {
    return undefined;
  }

  getProperties(): ServiceProperties {
    return this.config.getProperties();
  }

  getServiceReference(): ServiceReference<S> {
    return undefined;
  }

  getUsingBundle(): Bundle | undefined {
    return undefined;
  }

  locateService(name: string, reference?: ServiceReference<S>): S | undefined {
    return undefined;
  }
}
