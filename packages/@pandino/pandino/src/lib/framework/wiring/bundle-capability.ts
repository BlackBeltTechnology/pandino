import type { Capability } from '../resource';
import type { BundleRevision } from '../bundle-revision';

/**
 * A capability that has been declared from a {@link BundleRevision bundle
 * revision}.
 */
export interface BundleCapability extends Capability {
  getNamespace(): string | undefined;
  getDirectives(): Record<string, string>;
  getAttributes(): Record<string, any>;
  getRevision(): BundleRevision | undefined;
  getResource(): BundleRevision | undefined;
}
