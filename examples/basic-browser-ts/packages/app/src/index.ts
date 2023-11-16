import Pandino from '@pandino/pandino';
import loaderConfiguration from '@pandino/loader-configuration-dom';

window.addEventListener('DOMContentLoaded', async () => {
  const pandino = new Pandino({
    ...loaderConfiguration,
  });

  await pandino.init();
  await pandino.start();

  await pandino.getBundleContext().installBundle('bundle-a-manifest.json');

  window.setTimeout(() => {
    pandino
      .getBundleContext()
      .installBundle('./@pandino/bundle-installer-dom-manifest.json');
  }, 2000);
});
