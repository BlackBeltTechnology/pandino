import type { Node } from '@xyflow/react';

/**
 * DS Component metadata extracted from decorator information
 */
export interface DSMetadata {
  isComponent: boolean;
  componentName?: string;
  componentId?: number;
  factory?: string;
  immediate?: boolean;
  configurationPolicy?: string;
  configurationPid?: string;
  references?: DSReference[];
}

/**
 * DS Reference information
 */
export interface DSReference {
  name: string;
  interface?: string;
  cardinality?: string;
  policy?: string;
  target?: string;
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

