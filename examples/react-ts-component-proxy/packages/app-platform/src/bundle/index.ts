import {
  BUNDLE_ACTIVATOR,
  BUNDLE_SYMBOLICNAME,
  BUNDLE_VERSION,
  BundleManifestHeaders,
  PROVIDE_CAPABILITY
} from "@pandino/pandino-api";
import packageJson from '../../package.json';
import {Activator} from "./activator";

export const headers: BundleManifestHeaders = {
  [BUNDLE_SYMBOLICNAME]: packageJson.name,
  [BUNDLE_VERSION]: packageJson.version,
  [BUNDLE_ACTIVATOR]: new Activator(),
  [PROVIDE_CAPABILITY]: 'app.platform;type="DOM"'
};
