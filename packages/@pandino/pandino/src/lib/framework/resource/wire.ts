import { Capability } from './capability';
import { Requirement } from './requirement';
import { Resource } from './resource';

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
