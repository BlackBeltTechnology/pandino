import Pandino from '@pandino/pandino';
import loaderConfiguration from '@pandino/loader-configuration-dom';
import type { Page } from '@custom-elements-web-ts/contract';
import { PAGE_INTERFACE_KEY } from '@custom-elements-web-ts/contract';
import { AppWire } from './AppWire';
import { DashboardService } from './DashboardPage';

const pandino = new Pandino({
  ...loaderConfiguration,
});

await pandino.init();
await pandino.start();

await pandino
  .getBundleContext()
  .installBundle('https://unpkg.com/@pandino/bundle-installer-dom/dist/bundle-installer-dom-manifest.json');

pandino.getBundleContext().registerService<Page>(PAGE_INTERFACE_KEY, new DashboardService());

const root = document.querySelector('#root');
root.appendChild(new AppWire(pandino.getBundleContext()));
