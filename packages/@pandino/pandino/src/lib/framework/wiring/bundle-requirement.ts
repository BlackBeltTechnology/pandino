import type { BundleCapability } from './bundle-capability';
import type { Requirement } from '../resource';
import type { BundleRevision } from '../bundle-revision';

/**
 * A requirement that has been declared from a {@link BundleRevision bundle
 * revision}.
 */
export interface BundleRequirement extends Requirement {
  matches(capability: BundleCapability): boolean;
  getNamespace(): string;
  getDirectives(): Record<string, string>;
  getAttributes(): Record<string, any>;
  getRevision(): BundleRevision;
  getResource(): BundleRevision;
}
