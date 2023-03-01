import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import Pandino from '@pandino/pandino';
import loaderConfiguration from '@pandino/loader-configuration-dom';
import { PandinoProvider } from '@pandino/react-hooks';
import { CUSTOM_COMPONENT_INTERFACE_KEY, CustomComponent } from '@react-systemjs/component-api';
import { App } from './App';
import { SOME_SERVICE_INTERFACE_KEY, SomeServiceImpl } from './service';

const root = createRoot(document.querySelector('#root')!);

const pandino = new Pandino({
  ...loaderConfiguration,
});

await pandino.init();
await pandino.start();

const bundleContext = pandino.getBundleContext();

export const ComponentOne: CustomComponent = (props) => {
    const [data, setData] = useState<{ firstName: string; lastName?: string }>({ ...props });

    return (
        <div className="component-one" style={{ border: '1px solid black', padding: '1rem' }}>
            <h3>Component One</h3>
            <p>FirstName: {data.firstName}</p>
            <p>LastName: {data.lastName}</p>
        </div>
    );
};

const reg = bundleContext.registerService<CustomComponent>(CUSTOM_COMPONENT_INTERFACE_KEY, ComponentOne);
window.setTimeout(() => {
    reg.unregister();
    window.setTimeout(() => {
        bundleContext.registerService<CustomComponent>(CUSTOM_COMPONENT_INTERFACE_KEY, ComponentOne);
    }, 2000);
}, 2000);

// (async () => {
//   const componentOneBundle = await bundleContext.installBundle('./component-one.system-manifest.json');
//   window.setTimeout(() => {
//     pandino.uninstallBundle(componentOneBundle as any);
//     window.setTimeout(() => {
//       bundleContext.installBundle('./component-one.system-manifest.json');
//     }, 2000);
//   }, 2000);
// })();

// (async () => {
//   let someReg = await bundleContext.registerService(SOME_SERVICE_INTERFACE_KEY, new SomeServiceImpl());
//   window.setTimeout(async () => {
//     someReg.unregister();
//     window.setTimeout(async () => {
//       someReg = await bundleContext.registerService(SOME_SERVICE_INTERFACE_KEY, new SomeServiceImpl());
//     }, 2000);
//   }, 2000);
// })();

root.render(
  <PandinoProvider ctx={bundleContext}>
    <App />
  </PandinoProvider>,
);
