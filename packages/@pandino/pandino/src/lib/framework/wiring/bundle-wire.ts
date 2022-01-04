import { BundleCapability } from './bundle-capability';
import { BundleRequirement } from './bundle-requirement';
import { BundleRevision } from '../bundle-revision';

/**
 * A wire connecting a {@link BundleCapability} to a {@link BundleRequirement}.
 */
export interface BundleWire {
  getCapability(): BundleCapability;
  getRequirement(): BundleRequirement;
  getProvider(): BundleRevision;
  getRequirer(): BundleRevision;
}
