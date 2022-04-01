import { SERVICE_RANKING, ServiceEvent, ServiceListener, ServiceReference } from '@pandino/pandino-api';
import { ComponentProvider, ComponentProxyProps } from '@pandino/pandino-react-dom-api';
import { useContext, useEffect, useState } from 'react';
import { ReactBundleContext } from './react-bundle-context';

export function ComponentProxy({ identifier, defaultComponent: DefaultComponent, ...props }: ComponentProxyProps) {
  const { bundleContext } = useContext(ReactBundleContext);
  const refs: Array<ServiceReference<ComponentProvider>> =
    bundleContext.getServiceReferences<ComponentProvider>(identifier);
  let ref: ServiceReference<ComponentProvider> | undefined =
    refs.length > 0
      ? refs.sort((a, b) => b.getProperty(SERVICE_RANKING) - a.getProperty(SERVICE_RANKING))[0]
      : undefined;
  const [componentProvider, setComponentProvider] = useState<ComponentProvider | undefined>(
    ref ? bundleContext.getService<ComponentProvider>(ref) : undefined,
  );

  useEffect(() => {
    const listener: ServiceListener = {
      serviceChanged(event: ServiceEvent) {
        if (['REGISTERED', 'MODIFIED'].includes(event.getType())) {
          if (
            !ref ||
            (ref.getProperty(SERVICE_RANKING) || 0) < (event.getServiceReference().getProperty(SERVICE_RANKING) || 0)
          ) {
            ref = event.getServiceReference();
            setComponentProvider(bundleContext.getService<ComponentProvider>(ref));
          }
        } else {
          ref = undefined;
          setComponentProvider(undefined);
        }
      },
    };
    bundleContext.addServiceListener(listener, `(objectClass=${identifier})`);

    return () => {
      bundleContext.removeServiceListener(listener);
    };
  }, []);

  if (componentProvider) {
    const Comp = componentProvider.getComponent();
    return <Comp {...props} />;
  }

  return <DefaultComponent {...props} />;
}
