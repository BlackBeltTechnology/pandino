import {Component, FC, useContext, useEffect, useState} from "react";
import {SERVICE_RANKING, ServiceEvent, ServiceListener, ServiceReference} from "@pandino/pandino-api";
import {ComponentProvider} from "app-platform-api";
import {PlatformBundleContext} from "../PlatformBundleContext";

export interface ComponentProxyProps extends Record<any, any> {
    identifier: string,
    defaultComponent: FC<any> | typeof Component
    filter?: string,
}

export function ComponentProxy({identifier, filter, defaultComponent: DefaultComponent, ...props}: ComponentProxyProps) {
    const { bundleContext } = useContext(PlatformBundleContext);
    const refs: Array<ServiceReference<ComponentProvider>> = bundleContext.getServiceReferences<ComponentProvider>(identifier, filter);
    let ref: ServiceReference<ComponentProvider> | undefined = refs.length > 0
        ? refs.sort((a, b) => b.getProperty(SERVICE_RANKING) - a.getProperty(SERVICE_RANKING))[0]
        : undefined;
    const [componentProvider, setComponentProvider] = useState<ComponentProvider>(ref ? bundleContext.getService<ComponentProvider>(ref) : undefined as any);

    useEffect(() => {
        const listener: ServiceListener = {
            serviceChanged(event: ServiceEvent) {
                if (['REGISTERED', 'MODIFIED'].includes(event.getType())) {
                    if (!ref || (ref.getProperty(SERVICE_RANKING) || 0) < (event.getServiceReference().getProperty(SERVICE_RANKING) || 0)) {
                        ref = event.getServiceReference();
                        setComponentProvider(bundleContext.getService<ComponentProvider>(ref));
                    }
                } else {
                    ref = undefined;
                    setComponentProvider(undefined as any);
                }
            }
        };
        bundleContext.addServiceListener(listener, filter);

        return () => {
            bundleContext.removeServiceListener(listener);
        };
    }, []);

    if (componentProvider) {
        const Comp = componentProvider.getComponent();
        return <Comp {...props} />
    }

    return (
        <DefaultComponent {...props} />
    );
}
