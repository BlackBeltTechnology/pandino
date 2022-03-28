import React, { useState } from 'react';
import { Bundle } from '@pandino/pandino-api';
import { AppMeta } from '@example/app-platform-api';
import './App.css';
import { PlatformBundleContext } from './PlatformBundleContext';
import { ComponentProxy } from './component-proxy/ComponentProxy';
import { PageComponent } from './components/PageComponent';

interface AppProps {
  bundle: Bundle,
  meta: AppMeta,
}

function App({ bundle, meta: appMeta }: AppProps) {
  const [bundleContext, setBundleContext] = useState(bundle.getBundleContext());
  const [meta, setMeta] = useState(appMeta);

  return (
    <div className="App">
      <PlatformBundleContext.Provider value={{
          bundleContext,
          meta,
          update: () => setMeta({
              ...meta,
              appName: 'Update App Name!',
          }),
      }}>
        <h1>{meta.appName}</h1>
        <ComponentProxy identifier={meta.pages[0].type} defaultComponent={PageComponent} {...meta.pages[0].props} meta={meta.pages[0]}>
            <p>Child1</p>
            <p>Child2</p>
        </ComponentProxy>
      </PlatformBundleContext.Provider>
    </div>
  );
}

export default App;
