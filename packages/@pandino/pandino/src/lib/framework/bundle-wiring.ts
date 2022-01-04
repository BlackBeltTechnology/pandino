import { BundleCapability } from './wiring/bundle-capability';
import { BundleRequirement } from './wiring/bundle-requirement';
import { BundleWire } from './wiring/bundle-wire';
import { BundleRevision } from './bundle-revision';

/**
 * A wiring for a bundle. Each time a bundle is resolved, a new bundle wiring for the bundle is created. A bundle wiring
 * is associated with a bundle revision and represents the dependencies with other bundle wirings.
 *
 * <p>
 * The bundle wiring for a bundle is the {@link #isCurrent() current} bundle wiring if it is the most recent bundle
 * wiring for the current bundle revision. A bundle wiring is {@link #isInUse() in use} if it is the current bundle
 * wiring or if some other in use bundle wiring is dependent upon it. For example, another bundle wiring is wired to a
 * capability provided by the bundle wiring. An in use bundle wiring for a non-fragment bundle has a class loader. All
 * bundles with non-current, in use bundle wirings are considered removal pending. Once a bundle wiring is no longer in
 * use, it is considered stale and is discarded by the framework.
 */
export interface BundleWiring {
  isInUse(): boolean;
  getCapabilities(namespace: string): BundleCapability[];
  getRequirements(namespace: string): BundleRequirement[];
  getProvidedWires(namespace: string): BundleWire[];
  getRequiredWires(namespace: string): BundleWire[];
  getRevision(): BundleRevision;
}
