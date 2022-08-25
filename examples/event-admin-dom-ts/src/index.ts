import Pandino from '@pandino/pandino';
import {
  PANDINO_MANIFEST_FETCHER_PROP,
  PANDINO_BUNDLE_IMPORTER_PROP,
  DEPLOYMENT_ROOT_PROP,
} from '@pandino/pandino-api';
import {App} from './components/app';

window.addEventListener('DOMContentLoaded', async () => {
  const pandino = new Pandino({
    [DEPLOYMENT_ROOT_PROP]: location.href + 'assets',
    [PANDINO_MANIFEST_FETCHER_PROP]: {
      fetch: async (uri: string, deploymentRoot?: string) => (await fetch(deploymentRoot + '/' + uri)).json(),
    },
    [PANDINO_BUNDLE_IMPORTER_PROP]: {
      import: (activatorLocation: string, manifestLocation: string, deploymentRoot?: string) =>
        import(/* webpackIgnore: true */ deploymentRoot + '/' + activatorLocation),
    },
  });

  await pandino.init();
  await pandino.start();

  // install Event Admin
  await pandino.getBundleContext().installBundle('event-admin-manifest.json');

  // initialize Application
  const divApp = document.getElementById('app');
  const app = new App(pandino.getBundleContext());
  divApp.appendChild(app);

});
