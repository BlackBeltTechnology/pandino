import React from 'react';
import { createRoot } from 'react-dom/client';
import Pandino from '@pandino/pandino';
import {BUNDLE_ACTIVATOR} from '@pandino/pandino-api';
import loaderConfiguration from '@pandino/loader-configuration-dom';
import bundleInstallerDom from '@pandino/bundle-installer-dom';
import { App } from './App';

const root = createRoot(document.querySelector('body')!);

const pandino = new Pandino({
  ...loaderConfiguration,
});

await pandino.init();
await pandino.start();
await pandino.getBundleContext().installBundle({
  "Bundle-SymbolicName": "@pandino/bundle-installer-dom",
  "Bundle-Version": "0.8.20",
  "Bundle-Description": "Install Bundles defined in a browser's DOM",
  "Provide-Capability": "@pandino/bundle-installer;type=\"DOM\"",
  [BUNDLE_ACTIVATOR]: bundleInstallerDom as any,
})

root.render(<App bundleContext={pandino.getBundleContext()} />);
