import Pandino from './pandino.mjs';
import AppWire from './app-wire.js';

const pandino = new Pandino({
  'pandino.bundle.importer': {
    import: (activatorLocation) => import(activatorLocation),
  },
  'pandino.manifest.fetcher': {
    fetch: async (uri) => (await fetch(uri)).json(),
  },
});

await pandino.init();
await pandino.start();

pandino.getBundleContext().installBundle('./bundle-installer-dom-manifest.json');

const root = document.querySelector('#root');
root.appendChild(new AppWire(pandino.getBundleContext()));
