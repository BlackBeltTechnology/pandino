export interface ComponentManifest {
  name: string;
  implementation: string;
  properties?: Record<string, any>;
  references?: ReferenceManifest[];
  activate?: string;
  deactivate?: string;
  modified?: string;
  configurationPid?: string;
  configurationPolicy?: 'optional' | 'require' | 'ignore';
  factory?: string;
  immediate?: boolean;
  enabled?: boolean;
  scope?: 'singleton' | 'bundle' | 'prototype';
  service?: ServiceManifest;
}

export interface ReferenceManifest {
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

export interface ServiceManifest {
  interfaces?: string[];
  scope?: 'singleton' | 'bundle' | 'prototype';
}
