import { Capability } from '../resource/capability';
import { BundleRevision } from '../bundle-revision';

/**
 * A capability that has been declared from a {@link BundleRevision bundle
 * revision}.
 */
export interface BundleCapability extends Capability {
  getNamespace(): string;
  getDirectives(): Record<string, string>;
  getAttributes(): Record<string, any>;
  getRevision(): BundleRevision;
  getResource(): BundleRevision;
}
