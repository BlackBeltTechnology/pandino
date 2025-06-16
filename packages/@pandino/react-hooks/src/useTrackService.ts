import { useBundleContext } from './PandinoContext';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FRAMEWORK_SERVICE_UTILS, type ServiceProperties, type ServiceReference, type ServiceTracker, type ServiceUtils } from '@pandino/pandino-api';

export interface SimpleTracker<T> {
  service?: T;
  properties?: ServiceProperties;
}

export type ServiceTrackerHook = <T>(filter: string) => SimpleTracker<T>;

export const useTrackService: ServiceTrackerHook = <T>(filter: string) => {
  const { bundleContext } = useBundleContext();
  const tracker = useRef<ServiceTracker<any, any> | undefined>(undefined);
  const activeServiceRef = useRef<ServiceReference<T> | undefined>(undefined);
  const serviceUtilsRef = useRef<ServiceReference<ServiceUtils> | undefined>(undefined);
  const serviceUtils = useMemo<ServiceUtils | undefined>(() => {
    if (serviceUtilsRef.current) {
      bundleContext.ungetService(serviceUtilsRef.current);
      serviceUtilsRef.current = undefined;
    }
    serviceUtilsRef.current = bundleContext.getServiceReference<ServiceUtils>(FRAMEWORK_SERVICE_UTILS);
    if (!serviceUtilsRef.current) return undefined;
    const serviceUtils = bundleContext.getService(serviceUtilsRef.current);
    if (!serviceUtils) {
      bundleContext.ungetService(serviceUtilsRef.current);
      return undefined;
    }
    return serviceUtils;
  }, [bundleContext]);
  const [service, setService] = useState<T | undefined>(() => {
    const refs = bundleContext.getServiceReferences(undefined, filter);
    if (refs.length > 0 && serviceUtils) {
      activeServiceRef.current = serviceUtils.getBestServiceReference(refs);
      for (const ref of refs) {
        bundleContext.ungetService(ref);
      }
      if (activeServiceRef.current) {
        return bundleContext.getService(activeServiceRef.current);
      }
    }
    return undefined;
  });
  const [properties, setProperties] = useState<ServiceProperties | undefined>(() => {
    // if available, should be set in the previous state
    return activeServiceRef.current?.getProperties();
  });

  useEffect(() => {
    if (tracker?.current) {
      tracker.current.close();
      tracker.current = undefined;
    }

    tracker.current = bundleContext.trackService(filter, {
      addingService(reference: ServiceReference<T>): T {
        const svc = bundleContext.getService(reference);
        activeServiceRef.current = reference;
        setService((prev) => {
          return prev === svc ? prev : svc;
        });
        setProperties((prev) => {
          return JSON.stringify(prev) !== JSON.stringify(reference.getProperties()) ? reference.getProperties() : prev;
        });
        return svc as T;
      },
      modifiedService(reference: ServiceReference<T>, svc: T) {
        setService((prev) => {
          return prev === svc ? prev : svc;
        });
        setProperties((prev) => {
          return JSON.stringify(prev) !== JSON.stringify(reference.getProperties()) ? reference.getProperties() : prev;
        });
      },
      removedService(_: ServiceReference<T>, __: T) {
        bundleContext.ungetService(_);
        activeServiceRef.current = undefined;
        setService(undefined);
        setProperties(undefined);
      },
    });

    tracker.current.open();

    return () => {
      tracker.current?.close();
      tracker.current = undefined;
      activeServiceRef.current = undefined;
    };
  }, [bundleContext, filter]);

  // Memoize the tracker so that its identity only changes when the service or its properties change.
  return useMemo(() => ({ service, properties }), [service, properties]);
};
