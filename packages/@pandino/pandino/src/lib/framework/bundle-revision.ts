import { BundleReference } from '@pandino/pandino-api';
import { SemVer } from 'semver';
import { BundleRequirement } from './wiring/bundle-requirement';
import { BundleCapability } from './wiring/bundle-capability';
import { Requirement } from './resource/requirement';
import { Capability } from './resource/capability';
import { BundleWiring } from './bundle-wiring';
import { Resource } from './resource/resource';

/**
 * Bundle Revision. When a bundle is installed and each time a bundle is
 * updated, a new bundle revision of the bundle is created. Since a bundle
 * update can change the entries in a bundle, different bundle wirings for the
 * same bundle can be associated with different bundle revisions.
 */
export interface BundleRevision extends BundleReference, Resource {
  getSymbolicName(): string;
  getVersion(): SemVer;
  getDeclaredCapabilities(namespace: string): BundleCapability[];
  getDeclaredRequirements(namespace: string): BundleRequirement[];
  getWiring(): BundleWiring | undefined;
  getCapabilities(namespace: string): Capability[];
  getRequirements(namespace: string): Requirement[];
}
