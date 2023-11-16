import type { ActivationPolicy } from '@pandino/pandino-api';
import type { BundleCapability } from '../../wiring/bundle-capability';
import type { BundleRequirement } from '../../wiring/bundle-requirement';

export interface ManifestParser {
  getSymbolicName(): string;
  getBundleVersion(): string;
  getCapabilities(): BundleCapability[];
  getRequirements(): BundleRequirement[];
  getName(path: string): string;
  getActivationPolicy(): ActivationPolicy;
  getManifestVersion(): string;
  getActivationIncludeDirective(): string | undefined;
  getActivationExcludeDirective(): string | undefined;
}
