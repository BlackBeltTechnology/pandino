import {FC, useEffect, useState} from 'react';
import {BundleContext, ServiceReference} from "@pandino/pandino-api";
import {CustomComponent} from "@react-esm/component-api";
import {CUSTOM_COMPONENT_INTERFACE_KEY} from "@react-esm/component-api";

export interface AppProps {
    bundleContext: BundleContext;
}

export const App: FC<AppProps> = ({ bundleContext }) => {
  const [hello, setHello] = useState<string>('Greetings!');
  const [firstName, setFirstName] = useState<string>('John');
  const [ExternalComponent, setExternalComponent] = useState<CustomComponent | undefined>(undefined);

  useEffect(() => {
      const tracker = bundleContext.trackService(CUSTOM_COMPONENT_INTERFACE_KEY, {
          addingService(reference: ServiceReference<CustomComponent>): CustomComponent {
              const component = bundleContext.getService<CustomComponent>(reference);
              setExternalComponent(component);

              console.log(component);

              return  component;
          },
      });

      tracker.open();

      return () => {
          tracker.close();
      };
  }, []);

  return (
    <>
      <h1>React + Pandino</h1>
      <p>{hello}</p>
        {ExternalComponent && <ExternalComponent firstName={firstName} />}
    </>
  );
};
