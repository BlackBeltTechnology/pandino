import type { BundleContext, ServiceReference } from '~/framework/interfaces';

interface OSGiComponentConstructor {
  __osgi_component__?: ComponentDescriptor;
}

type OSGiConstructor<T = {}> = (new (...args: any[]) => T) & OSGiComponentConstructor;

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

export interface ComponentDescriptor {
  name: string;
  implementation: string | Function;
  class?: any;
  properties?: Record<string, any>;
  references?: ReferenceDescriptor[];
  activate?: string;
  deactivate?: string;
  modified?: string;
  configurationPid?: string;
  configurationPolicy?: 'optional' | 'require' | 'ignore';
  factory?: string;
  immediate?: boolean;
  enabled?: boolean;
  scope?: 'singleton' | 'bundle' | 'prototype';
  service?: ServiceDescriptor;
}

export interface ReferenceDescriptor {
  name: string;
  interface: string;
  cardinality: '1..1' | '0..1' | '1..n' | '0..n';
  policy: 'static' | 'dynamic';
  policyOption?: 'reluctant' | 'greedy';
  target?: string;
  bind?: string;
  unbind?: string;
  updated?: string;
  field?: string;
  fieldOption?: 'replace' | 'update';
  scope?: 'bundle' | 'prototype' | 'prototype_required';
}

export interface ServiceDescriptor {
  interfaces?: string[];
  scope?: 'singleton' | 'bundle' | 'prototype';
}

export function Component(options: Partial<ComponentDescriptor> = {}) {
  return <T extends OSGiConstructor>(cstr: T) => {
    const existing = (cstr as any).__osgi_component__ || {};

    (cstr as any).__osgi_component__ = {
      name: options.name || cstr.name,
      implementation: cstr,
      properties: { ...existing.properties, ...options.properties }, // Merge existing properties
      references: existing.references || [],
      activate: options.activate || existing.activate,
      deactivate: options.deactivate || existing.deactivate,
      modified: options.modified || existing.modified,
      configurationPid: options.configurationPid || existing.configurationPid,
      configurationPolicy: options.configurationPolicy || existing.configurationPolicy || 'optional',
      factory: options.factory || existing.factory,
      immediate: options.immediate || existing.immediate || false,
      enabled: options.enabled !== false,
      scope: options.scope || existing.scope || 'singleton',
      service: options.service || existing.service,
    };

    return cstr;
  };
}

export function Reference(options: Partial<ReferenceDescriptor> = {}) {
  return (target: any, propertyKey: string) => {
    const cstr = target.constructor;

    if (!cstr.__osgi_component__) {
      cstr.__osgi_component__ = {
        name: cstr.name,
        implementation: cstr,
        references: [],
      };
    }

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

    cstr.__osgi_component__.references.push(reference);
  };
}

export function Service(options: Partial<ServiceDescriptor> = {}) {
  return <T extends OSGiConstructor>(cstr: T) => {
    const existing = (cstr as any).__osgi_component__ || {};

    if (!existing.name) {
      (cstr as any).__osgi_component__ = {
        name: cstr.name,
        implementation: cstr,
        references: [],
      };
    }

    const existingService = (cstr as any).__osgi_component__.service || {};
    (cstr as any).__osgi_component__.service = {
      interfaces: options.interfaces || existingService.interfaces || [cstr.name],
      scope: existingService.scope || options.scope || 'singleton',
    };

    return cstr;
  };
}

export function Property(key: string, value: any) {
  return <T extends OSGiConstructor>(cstr: T) => {
    if (!(cstr as any).__osgi_component__) {
      (cstr as any).__osgi_component__ = {
        name: cstr.name,
        implementation: cstr,
        references: [],
        properties: {},
      };
    }

    const existing = (cstr as any).__osgi_component__;

    if (!existing.properties) {
      existing.properties = {};
    }

    existing.properties[key] = value;
    return cstr;
  };
}

export function Activate(target: any, propertyKey: string, _?: PropertyDescriptor) {
  const cstr = target.constructor;
  if (!cstr.__osgi_component__) {
    cstr.__osgi_component__ = {
      name: cstr.name,
      implementation: cstr,
      references: [],
    };
  }
  cstr.__osgi_component__.activate = propertyKey;
}

export function Deactivate(target: any, propertyKey: string, _?: PropertyDescriptor) {
  const cstr = target.constructor;
  if (!cstr.__osgi_component__) {
    cstr.__osgi_component__ = {
      name: cstr.name,
      implementation: cstr,
      references: [],
    };
  }
  cstr.__osgi_component__.deactivate = propertyKey;
}

export function Modified(target: any, propertyKey: string, _?: PropertyDescriptor) {
  const cstr = target.constructor;
  if (!cstr.__osgi_component__) {
    cstr.__osgi_component__ = {
      name: cstr.name,
      implementation: cstr,
      references: [],
    };
  }
  cstr.__osgi_component__.modified = propertyKey;
}

export function ConfigurationPolicy(policy: 'optional' | 'require' | 'ignore') {
  return <T extends OSGiConstructor>(cstr: T) => {
    if (!cstr.__osgi_component__) {
      cstr.__osgi_component__ = {
        name: cstr.name,
        implementation: cstr,
        references: [],
        configurationPolicy: policy,
      };
    } else {
      cstr.__osgi_component__.configurationPolicy = policy;
    }
    return cstr;
  };
}

export function Factory(factoryId: string) {
  return <T extends OSGiConstructor>(cstr: T) => {
    if (!cstr.__osgi_component__) {
      cstr.__osgi_component__ = {
        name: cstr.name,
        implementation: cstr,
        references: [],
        factory: factoryId,
      };
    } else {
      cstr.__osgi_component__.factory = factoryId;
    }
    return cstr;
  };
}

export function Immediate(target: any) {
  const cstr = typeof target === 'function' ? target : target.constructor;
  if (!cstr.__osgi_component__) {
    cstr.__osgi_component__ = {
      name: cstr.name,
      implementation: cstr,
      references: [],
      immediate: true,
    };
  } else {
    cstr.__osgi_component__.immediate = true;
  }
  return cstr;
}

export function Scope(scope: 'singleton' | 'bundle' | 'prototype') {
  return <T extends OSGiConstructor>(cstr: T) => {
    if (!cstr.__osgi_component__) {
      cstr.__osgi_component__ = {
        name: cstr.name,
        implementation: cstr,
        references: [],
        service: {
          interfaces: [cstr.name],
          scope: scope,
        },
      };
    } else if (!cstr.__osgi_component__.service) {
      cstr.__osgi_component__.service = {
        interfaces: [cstr.name],
        scope: scope,
      };
    } else {
      cstr.__osgi_component__.service.scope = scope;
    }

    return cstr;
  };
}
