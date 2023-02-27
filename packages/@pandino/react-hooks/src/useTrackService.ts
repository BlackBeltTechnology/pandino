import { useBundleContext } from './PandinoContext';
import { useEffect, useState } from 'react';
import type { ServiceReference } from '@pandino/pandino-api';

export interface SimpleTracker<T> {
  service?: T;
}

export type ServiceTrackerHook = <T>(filter: string) => SimpleTracker<T>;

export const useTrackService: ServiceTrackerHook = <T>(filter: string) => {
  const { bundleContext } = useBundleContext();
  const [tracker, setTracker] = useState<SimpleTracker<T>>({
    service: undefined,
  });

  useEffect(() => {
    const refs = bundleContext.getServiceReferences<T>(undefined, filter);

    if (refs && refs.length) {
      const svc = bundleContext.getService<T>(refs[0]);
      setTracker({
        service: svc,
      });
    }

    const serviceTracker = bundleContext.trackService(filter, {
      addingService(reference: ServiceReference<T>): T {
        const service = bundleContext.getService<T>(reference);
        setTracker({
          service,
        });

        return service;
      },
      removedService(_: ServiceReference<T>, __: T) {
        setTracker({
          service: undefined,
        });
      },
    });

    serviceTracker.open();

    return () => {
      serviceTracker.close();
    };
  }, [bundleContext]);

  return tracker;
};
