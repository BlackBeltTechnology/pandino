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

// export const ComponentOne: CustomComponent = (props) => {
//     const [data, setData] = useState<{ firstName: string; lastName?: string }>({ ...props });
//
//     return (
//         <div className="component-one" style={{ border: '1px solid black', padding: '1rem' }}>
//             <h3>Component One</h3>
//             <p>FirstName: {data.firstName}</p>
//             <p>LastName: {data.lastName}</p>
//         </div>
//     );
// };
//
// const reg = pandino.getBundleContext().registerService<CustomComponent>(CUSTOM_COMPONENT_INTERFACE_KEY, ComponentOne);
// window.setTimeout(() => {
//     reg.unregister();
// }, 2000);

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
