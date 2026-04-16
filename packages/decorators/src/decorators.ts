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

/**
 * Declares a class as a Pandino service component. SCR will manage its
 * lifecycle and dependency injection automatically.
 *
 * Applied to: class
 *
 * @param options - Component options (name, immediate, configurationPid, configurationPolicy, scope, etc.)
 */
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

/**
 * Injects a service dependency into a class property. SCR will resolve and
 * bind the referenced service automatically based on the specified interface.
 *
 * Applied to: property
 *
 * @param options - Reference options (interface, cardinality, policy, target filter, etc.)
 */
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

/**
 * Publishes the component as a service in the service registry under the
 * given interfaces. Other components can discover and reference this service
 * by those interface names.
 *
 * Applied to: class
 *
 * @param options - Service options (interfaces to register under, scope)
 */
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

/**
 * Attaches a static property to the component metadata. These properties become
 * both component properties and service registration properties, making them
 * available for LDAP-style filtering during service lookups.
 *
 * Applied to: class
 *
 * @param key - The property key
 * @param value - The property value
 */
export function Property(key: string, value: any) {
  return <T extends OSGiConstructor>(cstr: T) => {
    const metadata = getOrCreateMetadata(cstr);

    metadata.properties = metadata.properties || {};
    metadata.properties[key] = value;

    saveMetadata(cstr, metadata);
    return cstr;
  };
}

/**
 * Marks a method as the component's activation callback. SCR calls this method
 * when the component is activated and all mandatory references are satisfied.
 * The method receives a {@link ComponentContext} as its argument.
 *
 * Applied to: method
 */
export function Activate(target: any, propertyKey: string, _?: PropertyDescriptor) {
  const cstr = target.constructor;
  const metadata = getOrCreateMetadata(cstr);

  metadata.activate = propertyKey;

  saveMetadata(cstr, metadata);
}

/**
 * Marks a method as the component's deactivation callback. SCR calls this
 * method before the component is deactivated, allowing cleanup of resources.
 *
 * Applied to: method
 */
export function Deactivate(target: any, propertyKey: string, _?: PropertyDescriptor) {
  const cstr = target.constructor;
  const metadata = getOrCreateMetadata(cstr);

  metadata.deactivate = propertyKey;

  saveMetadata(cstr, metadata);
}

/**
 * Marks a method as the component's configuration-modified callback. SCR calls
 * this method when the component's configuration properties change at runtime.
 *
 * Applied to: method
 */
export function Modified(target: any, propertyKey: string, _?: PropertyDescriptor) {
  const cstr = target.constructor;
  const metadata = getOrCreateMetadata(cstr);

  metadata.modified = propertyKey;

  saveMetadata(cstr, metadata);
}

/**
 * Sets the configuration policy for the component, controlling whether
 * configuration from Configuration Admin is required, optional, or ignored.
 *
 * Applied to: class
 *
 * @param policy - `'optional'` (activate with or without config), `'require'` (config must exist), or `'ignore'` (config is disregarded)
 */
export function ConfigurationPolicy(policy: 'optional' | 'require' | 'ignore') {
  return <T extends OSGiConstructor>(cstr: T) => {
    const metadata = getOrCreateMetadata(cstr);

    metadata.configurationPolicy = policy;

    saveMetadata(cstr, metadata);
    return cstr;
  };
}

/**
 * Marks the component as a factory component. Each configuration targeting
 * this factory ID will cause SCR to create a separate component instance.
 *
 * Applied to: class
 *
 * @param factoryId - A unique identifier for this factory
 */
export function Factory(factoryId: string) {
  return <T extends OSGiConstructor>(cstr: T) => {
    const metadata = getOrCreateMetadata(cstr);

    metadata.factory = factoryId;

    saveMetadata(cstr, metadata);
    return cstr;
  };
}

/**
 * Activates the component immediately once all mandatory dependencies are
 * satisfied, rather than waiting for a consumer to request the service.
 *
 * Applied to: class
 */
export function Immediate(target: any) {
  const cstr = typeof target === 'function' ? target : target.constructor;
  const metadata = getOrCreateMetadata(cstr);

  metadata.immediate = true;

  saveMetadata(cstr, metadata);
  return cstr;
}

/**
 * Sets the service scope for the component, controlling how service instances
 * are shared among consumers.
 *
 * Applied to: class
 *
 * @param scope - `'singleton'` (one shared instance), `'bundle'` (one per consuming bundle), or `'prototype'` (new instance per request)
 */
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
