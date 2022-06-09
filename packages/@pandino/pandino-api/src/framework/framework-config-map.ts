import {
  DEPLOYMENT_ROOT_PROP,
  LOG_LEVEL_PROP,
  LOG_LOGGER_PROP,
  PANDINO_BUNDLE_IMPORTER_PROP,
  PANDINO_MANIFEST_FETCHER_PROP,
} from '../pandino-constants';
import { Logger, LogLevel } from '../logger';
import { ManifestFetcher } from '../manifest-fetcher';
import { BundleImporter } from '../bundle-importer';

export interface FrameworkConfigMap extends Record<string, any> {
  [PANDINO_MANIFEST_FETCHER_PROP]: ManifestFetcher;
  [PANDINO_BUNDLE_IMPORTER_PROP]: BundleImporter;
  [DEPLOYMENT_ROOT_PROP]?: string;
  [LOG_LOGGER_PROP]?: Logger;
  [LOG_LEVEL_PROP]?: LogLevel;
}
