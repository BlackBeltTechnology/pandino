import 'reflect-metadata';
import { COMPONENT_METADATA_KEY, type ComponentDescriptor, type ReferenceDescriptor } from '@pandino/decorators';

export function getComponentMetadata<T = any>(target: any): (ComponentDescriptor & T) | null {
  if (!target) {
    return null;
  }

  // If target is an instance, get its constructor
  const constructor = typeof target === 'function' ? target : target.constructor;

  return Reflect.getMetadata(COMPONENT_METADATA_KEY, constructor) || null;
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
  let references: ReferenceDescriptor[] = metadata?.references || [];

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
  customDecorators: Record<string, any>;
  customFieldDecorators: Record<string, Record<string, any>>;
  customMethodDecorators: Record<string, Record<string, any>>;
}

function isFilteredMetaKey(key: any): boolean {
  return typeof key === 'string' && (key.startsWith('design:') || key === COMPONENT_METADATA_KEY);
}

function getCustomDecoratorMetadata(target: any): Record<string, any> {
  if (!target) return {};
  const constructor = typeof target === 'function' ? target : target.constructor;
  const all: Record<string, any> = {};
  try {
    const keys: any[] = (Reflect as any).getMetadataKeys ? (Reflect as any).getMetadataKeys(constructor) || [] : [];
    for (const key of keys) {
      // filter out TS design-time metadata and the core component metadata
      if (isFilteredMetaKey(key)) {
        continue;
      }
      try {
        all[key] = (Reflect as any).getMetadata(key, constructor);
      } catch {
        // ignore faulty metadata entries
      }
    }
  } catch {
    // ignore if getMetadataKeys is unavailable
  }
  return all;
}

function getPrototype(target: any): any {
  if (!target) return null;
  const ctor = typeof target === 'function' ? target : target.constructor;
  return ctor ? ctor.prototype : null;
}

function getCustomMethodDecoratorMetadata(target: any): Record<string, Record<string, any>> {
  const proto = getPrototype(target);
  if (!proto || !(Reflect as any).getMetadataKeys) return {};
  const out: Record<string, Record<string, any>> = {};
  const names = Object.getOwnPropertyNames(proto);
  for (const name of names) {
    if (name === 'constructor') continue;
    const desc = Object.getOwnPropertyDescriptor(proto, name);
    const isMethod = !!desc && typeof desc.value === 'function';
    if (!isMethod) continue;
    const keys: any[] = (Reflect as any).getMetadataKeys(proto, name) || [];
    const bucket: Record<string, any> = {};
    for (const key of keys) {
      if (isFilteredMetaKey(key)) continue;
      try {
        bucket[key] = (Reflect as any).getMetadata(key, proto, name);
      } catch {}
    }
    if (Object.keys(bucket).length > 0) {
      out[name] = bucket;
    }
  }
  return out;
}

function getCustomFieldDecoratorMetadata(target: any): Record<string, Record<string, any>> {
  const proto = getPrototype(target);
  if (!proto || !(Reflect as any).getMetadataKeys) return {};
  const out: Record<string, Record<string, any>> = {};

  // Prefer field names declared in DS references
  const refs = getReferenceInfo(target) || [];
  const fields = new Set<string>();
  for (const ref of refs) {
    if (ref.field) fields.add(ref.field);
    if (ref.name && !fields.has(ref.name)) {
      // Some references use name equal to field name; include as a best effort
      fields.add(ref.name);
    }
  }

  for (const fieldName of fields) {
    const keys: any[] = (Reflect as any).getMetadataKeys(proto, fieldName) || [];
    const bucket: Record<string, any> = {};
    for (const key of keys) {
      if (isFilteredMetaKey(key)) continue;
      try {
        bucket[key] = (Reflect as any).getMetadata(key, proto, fieldName);
      } catch {}
    }
    if (Object.keys(bucket).length > 0) {
      out[fieldName] = bucket;
    }
  }

  return out;
}

export function getDecoratorInfo(target: any): DecoratorInfo {
  return {
    // Keep key order stable for snapshots
    component: getComponentInfo(target),
    configuration: getConfigurationInfo(target),
    lifecycle: getLifecycleInfo(target),
    rawMetadata: getComponentMetadata(target),
    references: getReferenceInfo(target),
    service: getServiceInfo(target),
    customDecorators: getCustomDecoratorMetadata(target),
    customFieldDecorators: getCustomFieldDecoratorMetadata(target),
    customMethodDecorators: getCustomMethodDecoratorMetadata(target),
  };
}
