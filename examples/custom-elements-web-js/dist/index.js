import loaderConfiguration from './@pandino/loader-configuration-dom.mjs';
import Pandino from './@pandino/pandino.mjs';
import AppWire from './app-wire.js';

const pandino = new Pandino({
  ...loaderConfiguration,
});

await pandino.init();
await pandino.start();

pandino.getBundleContext().installBundle('./@pandino/bundle-installer-dom-manifest.json');

const root = document.querySelector('#root');
root.appendChild(new AppWire(pandino.getBundleContext()));
