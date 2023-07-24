import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  BundleImporter,
  ManifestFetcher,
  PANDINO_BUNDLE_IMPORTER_PROP,
  PANDINO_MANIFEST_FETCHER_PROP,
} from '@pandino/pandino-api';

export interface LoaderConfig {
  [PANDINO_MANIFEST_FETCHER_PROP]: ManifestFetcher;
  [PANDINO_BUNDLE_IMPORTER_PROP]: BundleImporter;
}

const loaderConfig: LoaderConfig = {
  [PANDINO_MANIFEST_FETCHER_PROP]: {
    fetch: async (uri: string, deploymentRoot?: string) => {
      const data = fs.readFileSync(path.normalize(path.join(deploymentRoot, uri)), { encoding: 'utf8' });
      return JSON.parse(data);
    },
  },
  [PANDINO_BUNDLE_IMPORTER_PROP]: {
    import: (activatorLocation: string, manifestLocation: string, deploymentRoot?: string) => {
      return import(pathToFileURL(path.normalize(path.join(deploymentRoot, activatorLocation))).toString());
      // const normalManifest = path.normalize(manifestLocation);
      // console.log(normalManifest);
      // const root = normalManifest.includes(path.sep)
      //   ? normalManifest.substring(0, normalManifest.lastIndexOf(path.sep))
      //   : normalManifest;
      // console.log(root);
      // const normalActivator = path.normalize(activatorLocation);
      //
      // return import(path.normalize(path.join(root, normalActivator)));
    },
  },
};

export default loaderConfig;
