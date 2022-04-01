import React, { useState } from 'react';
import { BundleContext } from '@pandino/pandino-api';
import { ReactBundleContext } from './react-bundle-context';
import { DefaultApp } from './DefaultApp';
import { ComponentProxy } from './component-proxy';

interface ReactWrapperProps {
  context: BundleContext;
  applicationObjectClass: string;
}

export function ReactWrapper({ context, applicationObjectClass }: ReactWrapperProps) {
  const [bundleContext, setBundleContext] = useState(context);

  return (
    <div className="react-wrapper">
      <ReactBundleContext.Provider
        value={{
          bundleContext,
        }}
      >
        <ComponentProxy identifier={applicationObjectClass} defaultComponent={DefaultApp} />
      </ReactBundleContext.Provider>
    </div>
  );
}
