import React, { Suspense } from 'react';
import {Bundle} from "@pandino/pandino-api";
import './App.css';
import {AppMeta} from "app-platform-api";
import { PlatformBundleContext } from './PlatformBundleContext';
import {ComponentProxy} from "./component-proxy/ComponentProxy";
import PageComponent from "./components/PageComponent";

interface AppProps {
  bundle: Bundle,
  meta: AppMeta,
}

function App({ bundle, meta }: AppProps) {
  return (
    <div className="App">
      <PlatformBundleContext.Provider value={{ bundleContext: bundle.getBundleContext(), meta: meta }}>
        <h1>{meta.appName}</h1>
        <ComponentProxy identifier={meta.pages[0].type} defaultComponent={PageComponent} page={meta.pages[0]} />
      </PlatformBundleContext.Provider>
    </div>
  );
}

export default App;
