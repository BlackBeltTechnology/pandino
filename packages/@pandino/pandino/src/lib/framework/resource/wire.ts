import type { Capability } from './capability';
import type { Requirement } from './requirement';
import type { Resource } from './resource';

/**
 * A wire connecting a {@link Capability} to a {@link Requirement}.
 */
export interface Wire {
  getCapability(): Capability;
  getRequirement(): Requirement;
  getProvider(): Resource;
  getRequirer(): Resource;
  equals(other: any): boolean;
}
