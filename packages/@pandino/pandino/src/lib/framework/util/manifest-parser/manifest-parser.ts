import { ActivationPolicy } from '@pandino/pandino-api';
import { BundleCapability } from '../../wiring/bundle-capability';
import { BundleRequirement } from '../../wiring/bundle-requirement';

export interface ManifestParser {
  getSymbolicName(): string;
  getBundleVersion(): string;
  getCapabilities(): BundleCapability[];
  getRequirements(): BundleRequirement[];
  getName(path: string): string;
  getActivationPolicy(): ActivationPolicy;
  getManifestVersion(): string;
  getActivationIncludeDirective(): string;
  getActivationExcludeDirective(): string;
}
