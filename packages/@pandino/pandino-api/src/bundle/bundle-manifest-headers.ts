import {
  BUNDLE_ACTIVATIONPOLICY,
  BUNDLE_ACTIVATOR,
  BUNDLE_DESCRIPTION,
  BUNDLE_MANIFESTVERSION,
  BUNDLE_NAME,
  BUNDLE_SYMBOLICNAME,
  BUNDLE_VENDOR,
  BUNDLE_VERSION,
  REQUIRE_CAPABILITY,
  PROVIDE_CAPABILITY,
  BUNDLE_TYPE,
  BUNDLE_UMD_NAME,
} from '../pandino-constants';
import type { BundleActivator } from './bundle-activator';
import type { ActivationPolicy } from './activation-policy';
import type { BundleType } from './bundle-type';

export interface BundleManifestHeaders {
  [BUNDLE_MANIFESTVERSION]?: string;
  [BUNDLE_SYMBOLICNAME]: string;
  [BUNDLE_VERSION]?: string;
  [BUNDLE_TYPE]?: BundleType;
  [BUNDLE_UMD_NAME]?: string;
  [BUNDLE_ACTIVATOR]?: string | BundleActivator;
  [BUNDLE_ACTIVATIONPOLICY]?: ActivationPolicy;
  [BUNDLE_NAME]?: string;
  [BUNDLE_DESCRIPTION]?: string;
  [BUNDLE_VENDOR]?: string;
  [REQUIRE_CAPABILITY]?: string | string[];
  [PROVIDE_CAPABILITY]?: string | string[];
  [key: string]: any;
}
