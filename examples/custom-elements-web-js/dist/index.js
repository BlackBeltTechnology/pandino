import loaderConfiguration from 'https://unpkg.com/@pandino/loader-configuration-dom@latest/dist/loader-configuration-dom.mjs';
import Pandino from 'https://unpkg.com/@pandino/pandino@latest/dist/esm/pandino.mjs';
import AppWire from './app-wire.js';

const pandino = new Pandino({
  ...loaderConfiguration,
});

await pandino.init();
await pandino.start();

pandino.getBundleContext().installBundle('https://unpkg.com/@pandino/bundle-installer-dom@latest/dist/bundle-installer-dom-manifest.json');

const root = document.querySelector('#root');
root.appendChild(new AppWire(pandino.getBundleContext()));
