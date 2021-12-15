import { SemVer } from 'semver';
import { ActivationPolicy, BundleCapability, BundleRequirement } from './bundle';

export interface ManifestParser {
  getSymbolicName(): string;
  getBundleVersion(): SemVer;
  getCapabilities(): BundleCapability[];
  getRequirements(): BundleRequirement[];
  getName(path: string): string;
  getActivationPolicy(): ActivationPolicy;
  getManifestVersion(): string;
  getActivationIncludeDirective(): string;
  getActivationExcludeDirective(): string;
}
