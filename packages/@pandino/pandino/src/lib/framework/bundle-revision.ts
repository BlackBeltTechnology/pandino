import type { BundleReference } from '@pandino/pandino-api';
import type { BundleRequirement } from './wiring/bundle-requirement';
import type { BundleCapability } from './wiring/bundle-capability';
import type { Requirement, Capability, Resource } from './resource';
import type { BundleWiring } from './bundle-wiring';

/**
 * Bundle Revision. When a bundle is installed and each time a bundle is
 * updated, a new bundle revision of the bundle is created. Since a bundle
 * update can change the entries in a bundle, different bundle wirings for the
 * same bundle can be associated with different bundle revisions.
 */
export interface BundleRevision extends BundleReference, Resource {
  getSymbolicName(): string;
  getVersion(): string;
  getDeclaredCapabilities(namespace?: string): BundleCapability[];
  getDeclaredRequirements(namespace?: string): BundleRequirement[];
  getWiring(): BundleWiring | undefined;
  getCapabilities(namespace?: string): Capability[];
  getRequirements(namespace?: string): Requirement[];
}
