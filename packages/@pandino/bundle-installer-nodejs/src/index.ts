import {
  BUNDLE_ACTIVATOR,
  BUNDLE_DESCRIPTION,
  BUNDLE_MANIFESTVERSION,
  BUNDLE_NAME,
  BUNDLE_SYMBOLICNAME,
  BUNDLE_VERSION,
  PROVIDE_CAPABILITY,
} from '@pandino/pandino-api';
import { Activator } from './activator';

export default {
  [BUNDLE_MANIFESTVERSION]: '1',
  [BUNDLE_SYMBOLICNAME]: '@pandino/bundle-installer-nodejs',
  [BUNDLE_NAME]: 'Pandino Bundle Installer for NodeJS',
  [BUNDLE_VERSION]: '0.1.0',
  [BUNDLE_DESCRIPTION]: 'Install Bundles defined in the filesystem',
  [BUNDLE_ACTIVATOR]: new Activator(),
  [PROVIDE_CAPABILITY]: '@pandino/bundle-installer;type="nodejs"',
};
