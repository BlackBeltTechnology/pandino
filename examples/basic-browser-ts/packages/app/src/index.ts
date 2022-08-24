import Pandino from '@pandino/pandino';
import {
  PANDINO_MANIFEST_FETCHER_PROP,
  PANDINO_BUNDLE_IMPORTER_PROP,
} from '@pandino/pandino-api';

window.addEventListener('DOMContentLoaded', async () => {
  const pandino = new Pandino({
    [PANDINO_MANIFEST_FETCHER_PROP]: {
      fetch: async (uri: string) => (await fetch(uri)).json(),
    },
    [PANDINO_BUNDLE_IMPORTER_PROP]: {
      import: (activatorLocation: string) =>
        import(/* webpackIgnore: true */ activatorLocation),
    },
  });

  await pandino.init();
  await pandino.start();

  await pandino.getBundleContext().installBundle('bundle-a-manifest.json');

  window.setTimeout(() => {
    pandino.getBundleContext().installBundle('bundle-installer-dom-manifest.json');
  }, 2000);
});
