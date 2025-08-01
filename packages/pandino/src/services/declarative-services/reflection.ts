import 'reflect-metadata';
import type { ComponentDescriptor, ReferenceDescriptor } from './interfaces';

export function getComponentMetadata(target: any): ComponentDescriptor | null {
  if (!target) {
    return null;
  }

  // If target is an instance, get its constructor
  const constructor = typeof target === 'function' ? target : target.constructor;

  // Return the component metadata if it exists
  return constructor.__osgi_component__ || null;
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

export function getComponentInfo(target: any): ComponentInfo {
  const metadata = getComponentMetadata(target);

  return {
    isComponent: metadata !== null,
    name: metadata?.name || null,
    enabled: metadata ? metadata.enabled !== false : false,
    immediate: metadata ? !!metadata.immediate : false,
    factory: {
      isFactory: metadata?.factory !== undefined,
      id: metadata?.factory || null,
    },
  };
}

export interface ServiceInfo {
  interfaces: string[];
  scope: 'singleton' | 'bundle' | 'prototype' | null;
}

export function getServiceInfo(target: any): ServiceInfo {
  const metadata = getComponentMetadata(target);
  const serviceMetadata = metadata?.service;

  return {
    interfaces: serviceMetadata?.interfaces || [],
    scope: serviceMetadata?.scope || (serviceMetadata ? 'singleton' : null),
  };
}

export interface ConfigurationInfo {
  pid: string | null;
  policy: 'optional' | 'require' | 'ignore';
  properties: Record<string, any>;
}

export function getConfigurationInfo(target: any): ConfigurationInfo {
  const metadata = getComponentMetadata(target);

  return {
    pid: metadata?.configurationPid || null,
    policy: metadata?.configurationPolicy || 'optional',
    properties: metadata?.properties || {},
  };
}

export interface LifecycleInfo {
  activate: string | null;
  deactivate: string | null;
  modified: string | null;
}

export function getLifecycleInfo(target: any): LifecycleInfo {
  const metadata = getComponentMetadata(target);

  return {
    activate: metadata?.activate || null,
    deactivate: metadata?.deactivate || null,
    modified: metadata?.modified || null,
  };
}

export interface ReferenceFilterOptions {
  name?: string;
  interface?: string;
}

export function getReferenceInfo(target: any, filter?: ReferenceFilterOptions): ReferenceDescriptor[] {
  const metadata = getComponentMetadata(target);
  let references = metadata?.references || [];

  if (filter) {
    if (filter.name) {
      references = references.filter((ref) => ref.name === filter.name);
    }

    if (filter.interface) {
      references = references.filter((ref) => ref.interface === filter.interface);
    }
  }

  return references;
}

export interface DecoratorInfo {
  component: ComponentInfo;
  service: ServiceInfo;
  configuration: ConfigurationInfo;
  lifecycle: LifecycleInfo;
  references: ReferenceDescriptor[];
  rawMetadata: ComponentDescriptor | null;
}

export function getDecoratorInfo(target: any): DecoratorInfo {
  return {
    component: getComponentInfo(target),
    service: getServiceInfo(target),
    configuration: getConfigurationInfo(target),
    lifecycle: getLifecycleInfo(target),
    references: getReferenceInfo(target),
    rawMetadata: getComponentMetadata(target),
  };
}
