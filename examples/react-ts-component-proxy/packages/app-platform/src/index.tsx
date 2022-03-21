import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import {AppMeta} from "@example/app-platform-api";
import Pandino from "@pandino/pandino";
import {
    Bundle,
    DEPLOYMENT_ROOT_PROP,
    LOG_LEVEL_PROP,
    LogLevel,
    PANDINO_BUNDLE_IMPORTER_PROP,
    PANDINO_MANIFEST_FETCHER_PROP,
} from "@pandino/pandino-api";
import {headers} from "./bundle";

document.addEventListener('DOMContentLoaded', async () => {
    const appMetaEl = document.getElementById('app-meta');
    const appMeta: { source: string } = JSON.parse(appMetaEl!.textContent!);
    const appMetaData: AppMeta = await ((await fetch(appMeta.source)).json());

    const pandino = new Pandino({
        [DEPLOYMENT_ROOT_PROP]: window.location.href + 'deploy',
        [PANDINO_MANIFEST_FETCHER_PROP]: {
            fetch: async (deploymentRoot: string, uri: string) => (await fetch(deploymentRoot + '/' + uri)).json(),
        },
        [PANDINO_BUNDLE_IMPORTER_PROP]: {
            import: (deploymentRoot: string, activatorLocation: string, _: string) =>
                import(/* webpackIgnore: true */ deploymentRoot + '/' + activatorLocation),
        },
        [LOG_LEVEL_PROP]: LogLevel.DEBUG,
    });

    await pandino.init();
    await pandino.start();

    const platformBundle: Bundle = await pandino.getBundleContext().installBundle(headers);
    const bundleInstallerDom = await pandino.getBundleContext().installBundle('./pandino-bundle-installer-dom-manifest.json');

    ReactDOM.render(
        <React.StrictMode>
            <App bundle={platformBundle} meta={appMetaData} />
        </React.StrictMode>,
        document.getElementById('root')
    );
});

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
