import { Capability } from './capability';
import { Requirement } from './requirement';

export interface Resource {
  getCapabilities(namespace: string): Capability[];
  getRequirements(namespace: string): Requirement[];
  equals(other: any): boolean;
}
