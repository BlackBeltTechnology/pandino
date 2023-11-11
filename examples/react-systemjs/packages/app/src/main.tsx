import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import Pandino from '@pandino/pandino';
import { OBJECTCLASS } from '@pandino/pandino-api';
import loaderConfiguration from '@pandino/loader-configuration-dom';
import { PandinoProvider, useServiceInterceptor } from '@pandino/react-hooks';
import { CUSTOM_COMPONENT_INTERFACE_KEY, CustomComponent } from '@react-systemjs/component-api';
import { App } from './App';
import { SOME_SERVICE_INTERFACE_KEY, SomeServiceImpl } from './service';

const root = createRoot(document.querySelector('#root')!);

(async () => {
    const pandino = new Pandino({
      ...loaderConfiguration,
    });

    await pandino.init();
    await pandino.start();

    const bundleContext = pandino.getBundleContext();

    type Formatter = (input: string) => string;

    const ComponentOne: CustomComponent = (props) => {
        const [data, setData] = useState<{ firstName: string; lastName?: string }>({ ...props });
        const intercept = useServiceInterceptor();
        const formatter = intercept<Formatter>(`(${OBJECTCLASS}=x-formatter)`, (input: string) => input.split('').reverse().join(''));

        return (
            <div className="component-one" style={{ border: '1px solid black', padding: '1rem' }}>
                <h3>Component One</h3>
                <p>FirstName: {data.firstName}</p>
                <p>LastName: {data.lastName}</p>
                <p>Decorator test: {formatter('abcd')}</p>
            </div>
        );
    };

    const reg = bundleContext.registerService<CustomComponent>(CUSTOM_COMPONENT_INTERFACE_KEY, ComponentOne);
    window.setTimeout(() => {
        reg.unregister();
        bundleContext.registerService<Formatter>('x-formatter', (input) => input.toUpperCase());
        window.setTimeout(() => {
            bundleContext.registerService<CustomComponent>(CUSTOM_COMPONENT_INTERFACE_KEY, ComponentOne);
        }, 2000);
    }, 2000);

    // const componentOneBundle = await bundleContext.installBundle('./component-one.system-manifest.json');
    // window.setTimeout(() => {
    //     pandino.uninstallBundle(componentOneBundle as any);
    //     window.setTimeout(() => {
    //         bundleContext.installBundle('./component-one.system-manifest.json');
    //     }, 2000);
    // }, 2000);

    // let someReg = bundleContext.registerService(SOME_SERVICE_INTERFACE_KEY, new SomeServiceImpl());
    // window.setTimeout(() => {
    //     someReg.unregister();
    //     window.setTimeout(() => {
    //         bundleContext.registerService(SOME_SERVICE_INTERFACE_KEY, new SomeServiceImpl());
    //     }, 2000);
    // }, 2000);

    root.render(
      <PandinoProvider ctx={bundleContext}>
        <App />
      </PandinoProvider>,
    );
})();
