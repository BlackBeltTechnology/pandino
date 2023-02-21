import { createRoot } from 'react-dom/client';
import Pandino from '@pandino/pandino';
import loaderConfiguration from '@pandino/loader-configuration-dom';
import { App } from './App';

const root = createRoot(document.querySelector('#root')!);

const pandino = new Pandino({
  ...loaderConfiguration,
});

await pandino.init();
await pandino.start();

pandino.getBundleContext().installBundle('./@pandino/bundle-installer-dom/system/bundle-installer-dom.min-manifest.json');

// (async () => {
//   const componentOneBundle = await pandino.getBundleContext().installBundle('./component-one.system-manifest.json');
//
//   // window.setTimeout(() => {
//   //   pandino.uninstallBundle(componentOneBundle as any);
//   // }, 3000);
// })();

root.render(<App bundleContext={pandino.getBundleContext()} />);
