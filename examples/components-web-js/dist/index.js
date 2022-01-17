import Pandino from './pandino.js';
import AppWire from './app-wire.js';

const pandino = new Pandino({
  'pandino.deployment.root': location.href,
  'pandino.bundle.importer': {
    import: (deploymentRoot, activatorLocation) => import(activatorLocation),
  },
  'pandino.manifest.fetcher': {
    fetch: async (deploymentRoot, uri) => (await fetch(uri)).json(),
  },
});

await pandino.init();
await pandino.start();

pandino.getBundleContext().installBundle('./pandino-bundle-installer-dom-manifest.json');

const root = document.querySelector('#root');
root.appendChild(new AppWire(pandino.getBundleContext()));
