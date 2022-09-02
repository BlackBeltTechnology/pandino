import {
  BundleImporter,
  ManifestFetcher,
  PANDINO_BUNDLE_IMPORTER_PROP,
  PANDINO_MANIFEST_FETCHER_PROP
} from '@pandino/pandino-api';

export interface LoaderConfig {
  [PANDINO_MANIFEST_FETCHER_PROP]: ManifestFetcher;
  [PANDINO_BUNDLE_IMPORTER_PROP]: BundleImporter;
}

const loaderConfig: LoaderConfig = {
  [PANDINO_MANIFEST_FETCHER_PROP]: {
    fetch: async (uri: string) => (await fetch(uri)).json(),
  },
  [PANDINO_BUNDLE_IMPORTER_PROP]: {
    import: (activatorLocation: string, manifestLocation: string) => {
      const root = manifestLocation.includes('/')
        ? manifestLocation.substring(0, manifestLocation.lastIndexOf('/'))
        : manifestLocation;
      const activatorEnd = activatorLocation.includes('/') ? activatorLocation.split('/').pop() : activatorLocation;

      return import(root + '/' + activatorEnd);
    },
  },
};

export default loaderConfig;
