import type { BundleConfiguration, BundleContext, ServiceReference } from '~/framework/interfaces';

export interface SCRBundleConfiguration extends BundleConfiguration {
  components?: any[];
}

export interface ComponentContext {
  getBundleContext(): BundleContext;
  getProperties(): Record<string, any>;
  getServiceReference(): ServiceReference<any>;
  getComponentName(): string;
  locateService<S>(name: string): S | null;
  locateServices<S>(name: string): S[];
  disableComponent(name: string): void;
  enableComponent(name: string): void;
}
