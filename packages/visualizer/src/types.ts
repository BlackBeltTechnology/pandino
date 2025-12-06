import type { Node, Edge } from '@xyflow/react';
import type { ServiceReference } from '@pandino/pandino';

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
 * Extended edge data for DS references
 */
export interface EdgeData {
  refName: string;
  cardinality: string;
  policy: string;
  satisfied: boolean;
  isMandatory?: boolean;
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
 * Graph building result
 */
export interface GraphResult {
  nodes: Node[];
  edges: Edge[];
}

/**
 * Service node map for quick lookups
 */
export type ServiceNodeMap = Map<number, Node>;

