import Pandino from '@pandino/pandino';
import {
  LOG_LEVEL_PROP,
  LOG_LOGGER_PROP,
  LogLevel,
  PANDINO_FETCHER_PROP,
  PANDINO_IMPORTER_PROP,
} from '@pandino/pandino-api';
import { DomLogger } from './dom-logger';

window.addEventListener('DOMContentLoaded', async () => {
  const pandino = new Pandino({
    [LOG_LOGGER_PROP]: new DomLogger(document.querySelector('#app')),
    [LOG_LEVEL_PROP]: LogLevel.DEBUG,
    [PANDINO_IMPORTER_PROP]: {
      import: (activator: string) => import(/* webpackIgnore: true */ activator),
    },
    [PANDINO_FETCHER_PROP]: {
      fetch: async (uri: string) => (await fetch(uri)).json(),
    },
  });

  await pandino.init();
  await pandino.start();

  await pandino.getBundleContext().installBundle('./assets/external-bundles/bundle-a-manifest.json');

  window.setTimeout(() => {
    pandino.getBundleContext().installBundle('./assets/external-bundles/pandino-bundle-installer-dom-manifest.json');
  }, 2000);
});
