import type { Capability } from './capability';
import type { Requirement } from './requirement';

export interface Resource {
  getCapabilities(namespace: string): Capability[];
  getRequirements(namespace: string): Requirement[];
  equals(other: any): boolean;
}
