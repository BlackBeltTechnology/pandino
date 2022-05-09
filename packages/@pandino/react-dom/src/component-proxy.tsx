import { ServiceEvent, ServiceListener } from '@pandino/pandino-api';
import { ComponentProvider, ComponentProxyProps } from '@pandino/react-dom-api';
import { Component, FC, useEffect, useState } from 'react';

export function ComponentProxy({
  identifier,
  bundleContext,
  defaultComponent: DefaultComponent,
  ...props
}: ComponentProxyProps) {
  const refs: Array<ComponentProvider> = bundleContext.getServiceReferences<any>(identifier).map((ref) => ({
    getIdentifier: () => identifier,
    getComponent: () => bundleContext.getService<FC<any> | typeof Component>(ref),
    getFilter: () => undefined,
  }));
  let ref: ComponentProvider | undefined = refs && refs.length ? refs[0] : undefined;
  const [componentProvider, setComponentProvider] = useState<ComponentProvider | undefined>(ref);

  useEffect(() => {
    const listener: ServiceListener = {
      serviceChanged(event: ServiceEvent) {
        if (['REGISTERED', 'MODIFIED'].includes(event.getType())) {
          if (!ref) {
            ref = {
              getIdentifier: () => identifier,
              getComponent: () => bundleContext.getService<FC<any> | typeof Component>(event.getServiceReference()),
              getFilter: () => undefined,
            };
            setComponentProvider(ref);
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
