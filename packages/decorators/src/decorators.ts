import 'reflect-metadata';
import type { ComponentDescriptor, OSGiConstructor, ReferenceDescriptor, ServiceDescriptor } from './interfaces';

export const COMPONENT_METADATA_KEY = 'osgi:component';

function getOrCreateMetadata(cstr: any): ComponentDescriptor {
  let metadata = Reflect.getMetadata(COMPONENT_METADATA_KEY, cstr);

  if (!metadata) {
    metadata = {
      name: cstr.name,
      implementation: cstr,
      references: [],
    };
  }

  return metadata;
}

function saveMetadata(cstr: any, metadata: ComponentDescriptor): void {
  Reflect.defineMetadata(COMPONENT_METADATA_KEY, metadata, cstr);
}

export function Component(options: Partial<ComponentDescriptor> = {}) {
  return <T extends OSGiConstructor>(cstr: T) => {
    const metadata = getOrCreateMetadata(cstr);

    const updatedMetadata = {
      ...metadata,
      name: options.name || metadata.name || cstr.name,
      implementation: cstr,
      properties: { ...metadata.properties, ...options.properties },
      references: metadata.references || [],
      activate: options.activate || metadata.activate,
      deactivate: options.deactivate || metadata.deactivate,
      modified: options.modified || metadata.modified,
      configurationPid: options.configurationPid || metadata.configurationPid,
      configurationPolicy: options.configurationPolicy || metadata.configurationPolicy || 'optional',
      factory: options.factory || metadata.factory,
      immediate: options.immediate || metadata.immediate || false,
      enabled: options.enabled !== false,
      scope: options.scope || metadata.scope || 'singleton',
      service: options.service || metadata.service,
    };

    saveMetadata(cstr, updatedMetadata);
    return cstr;
  };
}

export function Reference(options: Partial<ReferenceDescriptor> = {}) {
  return (target: any, propertyKey: string) => {
    const cstr = target.constructor;
    const metadata = getOrCreateMetadata(cstr);

    const reference: ReferenceDescriptor = {
      name: options.name || propertyKey,
      interface: options.interface || 'any',
      cardinality: options.cardinality || '1..1',
      policy: options.policy || 'static',
      policyOption: options.policyOption || 'reluctant',
      target: options.target,
      bind: options.bind,
      unbind: options.unbind,
      updated: options.updated,
      field: options.field || propertyKey,
      fieldOption: options.fieldOption || 'replace',
      scope: options.scope || 'bundle',
    };

    metadata.references = metadata.references || [];
    metadata.references.push(reference);

    saveMetadata(cstr, metadata);
  };
}

export function Service(options: Partial<ServiceDescriptor> = {}) {
  return <T extends OSGiConstructor>(cstr: T) => {
    const metadata = getOrCreateMetadata(cstr);
    const existingService = metadata.service || {};

    metadata.service = {
      interfaces: options.interfaces || existingService.interfaces || [cstr.name],
      scope: existingService.scope || options.scope || 'singleton',
    };

    saveMetadata(cstr, metadata);
    return cstr;
  };
}

export function Property(key: string, value: any) {
  return <T extends OSGiConstructor>(cstr: T) => {
    const metadata = getOrCreateMetadata(cstr);

    metadata.properties = metadata.properties || {};
    metadata.properties[key] = value;

    saveMetadata(cstr, metadata);
    return cstr;
  };
}

export function Activate(target: any, propertyKey: string, _?: PropertyDescriptor) {
  const cstr = target.constructor;
  const metadata = getOrCreateMetadata(cstr);

  metadata.activate = propertyKey;

  saveMetadata(cstr, metadata);
}

export function Deactivate(target: any, propertyKey: string, _?: PropertyDescriptor) {
  const cstr = target.constructor;
  const metadata = getOrCreateMetadata(cstr);

  metadata.deactivate = propertyKey;

  saveMetadata(cstr, metadata);
}

export function Modified(target: any, propertyKey: string, _?: PropertyDescriptor) {
  const cstr = target.constructor;
  const metadata = getOrCreateMetadata(cstr);

  metadata.modified = propertyKey;

  saveMetadata(cstr, metadata);
}

export function ConfigurationPolicy(policy: 'optional' | 'require' | 'ignore') {
  return <T extends OSGiConstructor>(cstr: T) => {
    const metadata = getOrCreateMetadata(cstr);

    metadata.configurationPolicy = policy;

    saveMetadata(cstr, metadata);
    return cstr;
  };
}

export function Factory(factoryId: string) {
  return <T extends OSGiConstructor>(cstr: T) => {
    const metadata = getOrCreateMetadata(cstr);

    metadata.factory = factoryId;

    saveMetadata(cstr, metadata);
    return cstr;
  };
}

export function Immediate(target: any) {
  const cstr = typeof target === 'function' ? target : target.constructor;
  const metadata = getOrCreateMetadata(cstr);

  metadata.immediate = true;

  saveMetadata(cstr, metadata);
  return cstr;
}

export function Scope(scope: 'singleton' | 'bundle' | 'prototype') {
  return <T extends OSGiConstructor>(cstr: T) => {
    const metadata = getOrCreateMetadata(cstr);

    if (!metadata.service) {
      metadata.service = {
        interfaces: [cstr.name],
        scope: scope,
      };
    } else {
      metadata.service.scope = scope;
    }

    saveMetadata(cstr, metadata);
    return cstr;
  };
}
