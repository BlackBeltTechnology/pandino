import Pandino from '@pandino/pandino';
import {
  LOG_LEVEL_PROP,
  LOG_LOGGER_PROP,
  LogLevel,
  PANDINO_MANIFEST_FETCHER_PROP,
  PANDINO_BUNDLE_IMPORTER_PROP,
  DEPLOYMENT_ROOT_PROP,
} from '@pandino/pandino-api';
import { DomLogger } from './dom-logger';

window.addEventListener('DOMContentLoaded', async () => {
  const pandino = new Pandino({
    [DEPLOYMENT_ROOT_PROP]: location.href + 'assets/deploy',
    [PANDINO_MANIFEST_FETCHER_PROP]: {
      fetch: async (deploymentRoot: string, uri: string) => (await fetch(deploymentRoot + '/' + uri)).json(),
    },
    [PANDINO_BUNDLE_IMPORTER_PROP]: {
      import: (deploymentRoot: string, activatorLocation: string, manifestLocation: string) =>
        import(/* webpackIgnore: true */ deploymentRoot + '/' + activatorLocation),
    },
    [LOG_LOGGER_PROP]: new DomLogger(document.querySelector('#app')),
    [LOG_LEVEL_PROP]: LogLevel.DEBUG,
  });

  await pandino.init();
  await pandino.start();

  await pandino.getBundleContext().installBundle('bundle-a-manifest.json');

  window.setTimeout(() => {
    pandino.getBundleContext().installBundle('bundle-installer-dom-manifest.json');
  }, 2000);
});
