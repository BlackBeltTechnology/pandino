import { useBundleContext } from './PandinoContext';
import { useCallback, useEffect, useState } from 'react';
import type { ServiceEvent, ServiceListener, ServiceUtils } from '@pandino/pandino-api';
import { FRAMEWORK_SERVICE_UTILS } from '@pandino/pandino-api';

export interface SimpleTracker<T> {
  service?: T;
}

export type ServiceTrackerHook = <T>(filter: string) => SimpleTracker<T>;

export const useTrackService: ServiceTrackerHook = <T>(filter: string) => {
  const { bundleContext } = useBundleContext();
  const serviceUtilsRef = bundleContext.getServiceReference<ServiceUtils>(FRAMEWORK_SERVICE_UTILS);
  const serviceUtils = bundleContext.getService(serviceUtilsRef);
  const getService = useCallback<(filter: string) => T | undefined>(
    (filter: string) => {
      const refs = bundleContext.getServiceReferences(undefined, filter);
      const ref = serviceUtils.getBestServiceReference(refs);
      if (ref) {
        return bundleContext.getService(ref);
      }
    },
    [filter],
  );
  const [tracker, setTracker] = useState<SimpleTracker<T>>({
    service: getService(filter),
  });
  const createListener = useCallback(() => {
    return {
      serviceChanged: (event: ServiceEvent) => {
        if (event.getType() === 'REGISTERED') {
          setTracker({
            service: bundleContext.getService(event.getServiceReference()),
          });
        } else if (event.getType() === 'UNREGISTERING') {
          setTracker({
            service: undefined,
          });
        }
      },
    };
  }, [filter]);
  const [listener, setListener] = useState<ServiceListener | undefined>();

  useEffect(() => {
    if (listener) {
      bundleContext.removeServiceListener(listener);
    }

    const newListener = createListener();

    setListener(newListener);

    bundleContext.addServiceListener(newListener, filter);

    setTracker({
      service: getService(filter),
    });
  }, [filter]);

  return tracker;
};
