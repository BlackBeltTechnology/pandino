import type {
  BundleConfiguration,
  BundleContext,
  ServiceReference,
  ServiceRegistration,
} from '../../framework/interfaces';
import type { ComponentDescriptor, ReferenceDescriptor } from '@pandino/decorators';

export interface SCRBundleConfiguration extends BundleConfiguration {
  components?: any[];
}

/**
 * Context passed to a component's @Activate callback. Provides access to the
 * bundle context, component properties, and bound services.
 */
export interface ComponentContext {
  /** Returns the BundleContext for the bundle that owns this component. */
  getBundleContext(): BundleContext;
  /** Returns the component's merged properties (from @Property decorators and configuration). */
  getProperties(): Record<string, any>;
  /** Returns the ServiceReference for this component's registered service. */
  getServiceReference(): ServiceReference<any>;
  /** Returns the component name (from @Component name option). */
  getComponentName(): string;
  /** Locates a bound service by its reference name. Returns null if not available. */
  locateService<S>(name: string): S | null;
  /** Locates all bound services matching the given reference name. */
  locateServices<S>(name: string): S[];
  /** Disables a component by name, deactivating it if currently active. */
  disableComponent(name: string): void;
  /** Enables a previously disabled component by name. */
  enableComponent(name: string): void;
}

export interface ConfigurationInfo {
  pid: string | null;
  policy: 'optional' | 'require' | 'ignore';
  properties: Record<string, any>;
}

export interface ServiceInfo {
  interfaces: string[];
  scope: 'singleton' | 'bundle' | 'prototype' | null;
}

export interface ComponentInfo {
  isComponent: boolean;
  name: string | null;
  enabled: boolean;
  immediate: boolean;
  factory: {
    isFactory: boolean;
    id: string | null;
  };
}

export interface LifecycleInfo {
  activate: string | null;
  deactivate: string | null;
  modified: string | null;
}

export interface ReferenceFilterOptions {
  name?: string;
  interface?: string;
}

export interface DecoratorInfo {
  component: ComponentInfo;
  service: ServiceInfo;
  configuration: ConfigurationInfo;
  lifecycle: LifecycleInfo;
  references: ReferenceDescriptor[];
  rawMetadata: ComponentDescriptor | null;
  customDecorators: Record<string, any>;
  customFieldDecorators: Record<string, Record<string, any>>;
  customMethodDecorators: Record<string, Record<string, any>>;
}

export interface ComponentEntry {
  instance: any;
  metadata: ComponentDescriptor;
  serviceRegistration?: ServiceRegistration<any>;
  factoryInstances?: Map<string, any>;
  context?: ComponentContext;
  bundleInstances?: Map<number, any>; // For bundle-scoped services
  boundServiceRefs?: Map<string, any>; // Currently bound service reference per reference key (for greedy rebind)
  boundMultiServices?: Map<string, Set<any>>; // Services already bound per multi-cardinality reference (idempotent bind)
}
