import { createRoot } from 'react-dom/client';
import Pandino from '@pandino/pandino';
import loaderConfiguration from '@pandino/loader-configuration-dom';
import { PandinoProvider } from '@pandino/react-hooks';
import { App } from './App';

const root = createRoot(document.querySelector('#root')!);

const pandino = new Pandino({
  ...loaderConfiguration,
});

await pandino.init();
await pandino.start();

(async () => {
  const componentOneBundle = await pandino.getBundleContext().installBundle('./component-one.system-manifest.json');
  window.setTimeout(() => {
    pandino.uninstallBundle(componentOneBundle as any);
    window.setTimeout(() => {
      pandino.getBundleContext().installBundle('./component-one.system-manifest.json');
    }, 2000);
  }, 2000);
})();

root.render(
  <PandinoProvider ctx={pandino.getBundleContext()}>
    <App />
  </PandinoProvider>,
);
