import type { ComponentContext, ComponentInstance } from '@pandino/scr-api';
import type { BundleContext, ServiceProperties, ServiceReference } from '@pandino/pandino-api';
import { ComponentConfigurationImpl } from './ComponentConfigurationImpl';

export class ComponentContextImpl<S> implements ComponentContext<S> {
  private readonly config: ComponentConfigurationImpl<S>;
  private readonly context: BundleContext;
  private readonly instance: ComponentInstance<S>;

  constructor(config: ComponentConfigurationImpl<S>, context: BundleContext, instance: ComponentInstance<S>) {
    this.config = config;
    this.context = context;
    this.instance = instance;
  }

  disableComponent(name: string): void {
    // TODO consider
  }

  enableComponent(name: string): void {
    // TODO consider
  }

  getBundleContext(): BundleContext {
    return this.context;
  }

  getComponentInstance(): ComponentInstance<S> {
    return this.instance;
  }

  getProperties(): ServiceProperties {
    return this.config.getProperties();
  }

  getServiceReference(): ServiceReference<S> | undefined {
    return this.config.getService();
  }
}
