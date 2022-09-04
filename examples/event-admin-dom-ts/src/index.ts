import Pandino from '@pandino/pandino';
import loaderConfiguration from '@pandino/loader-configuration-dom';
import {App} from './components/app';

window.addEventListener('DOMContentLoaded', async () => {
  const pandino = new Pandino({
    ...loaderConfiguration,
  });

  await pandino.init();
  await pandino.start();

  // install Event Admin
  await pandino.getBundleContext().installBundle('https://unpkg.com/@pandino/event-admin/dist/esm/event-admin-manifest.json');

  // initialize Application
  const divApp = document.getElementById('app');
  const app = new App(pandino.getBundleContext());
  divApp.appendChild(app);

});
