export type OSGiConstructor<T = {}> = new (...args: any[]) => T;

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
