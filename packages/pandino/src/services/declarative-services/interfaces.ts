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
}
