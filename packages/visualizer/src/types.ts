import type { Node } from '@xyflow/react';

/**
 * DS Component metadata extracted from decorator information
 * Based on ComponentDescriptor from @pandino/decorators
 */
export interface DSMetadata {
  isComponent: boolean;
  componentName?: string;
  componentId?: number;

  // Component properties
  properties?: Record<string, any>;

  // Service registration
  service?: {
    interfaces?: string[];
    scope?: 'singleton' | 'bundle' | 'prototype';
  };

  // Component lifecycle
  activate?: string;
  deactivate?: string;
  modified?: string;

  // Configuration
  configurationPid?: string;
  configurationPolicy?: 'optional' | 'require' | 'ignore';

  // Factory support
  factory?: string;

  // Component behavior
  immediate?: boolean;
  enabled?: boolean;
  scope?: 'singleton' | 'bundle' | 'prototype';

  // References
  references?: DSReference[];
}

/**
 * DS Reference information
 * Based on ReferenceDescriptor from @pandino/decorators
 */
export interface DSReference {
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

/**
 * Framework event wrapper
 */
export interface FrameworkEvent {
  type: 'service' | 'bundle';
  event: any;
  timestamp: number;
}

/**
 * Service node map for quick lookups
 */
export type ServiceNodeMap = Map<number, Node>;

