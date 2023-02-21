import { FC, useEffect, useState } from 'react';
import type { BundleContext, ServiceReference } from '@pandino/pandino-api';
import { OBJECTCLASS } from '@pandino/pandino-api';
import type { CustomComponent } from '@react-systemjs/component-api';
import { CUSTOM_COMPONENT_INTERFACE_KEY } from '@react-systemjs/component-api';

export interface AppProps {
  bundleContext: BundleContext;
}

// React crashes when we are trying to load components, unless the component is wrapped in a function call
export interface ComponentProvider<T> {
  getComponent: () => T | undefined;
}

export const App: FC<AppProps> = ({ bundleContext }) => {
  const [firstName, setFirstName] = useState<string>('John');
  const [externalComponentProvider, setExternalComponentProvider] = useState<ComponentProvider<CustomComponent>>({
    getComponent: () => undefined,
  });

  useEffect(() => {
    const tracker = bundleContext.trackService(`(${OBJECTCLASS}=${CUSTOM_COMPONENT_INTERFACE_KEY})`, {
      addingService(reference: ServiceReference<CustomComponent>): CustomComponent {
        const CustomComponentFunction = bundleContext.getService<CustomComponent>(reference);
        setExternalComponentProvider({ getComponent: () => CustomComponentFunction });

        return CustomComponentFunction;
      },
      removedService(_: ServiceReference<CustomComponent>, __: CustomComponent) {
        setExternalComponentProvider({ getComponent: () => undefined });
      },
    });

    tracker.open();

    return () => {
      tracker.close();
    };
  }, []);

  const ExternalComponent = externalComponentProvider.getComponent();

  return (
    <>
      <h1>React + Pandino</h1>
      {ExternalComponent && <ExternalComponent firstName={firstName} />}
    </>
  );
};
