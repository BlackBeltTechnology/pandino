import type { ServiceReference, ServiceTrackerCustomizer } from '@pandino/pandino';
import { ServiceTracker } from '@pandino/pandino';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePandinoContext } from '~/context';

export interface UseServiceTrackerResult<T = any> {
  services: T[];
  loading: boolean;
  error: Error | null;
}

export function useServiceTracker<T = any>(serviceClass: string, filter?: string): UseServiceTrackerResult<T> {
  const { bundleContext, isInitialized } = usePandinoContext();
  const [services, setServices] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const trackerRef = useRef<ServiceTracker<T, T> | null>(null);
  const serviceMapRef = useRef<Map<ServiceReference<T>, T>>(new Map());

  // Create customizer callbacks
  const addingService = useCallback((reference: ServiceReference<T>, service: T): T | null => {
    serviceMapRef.current.set(reference, service);
    setServices(Array.from(serviceMapRef.current.values()));
    return service;
  }, []);

  const modifiedService = useCallback((reference: ServiceReference<T>, service: T, _tracked: T): void => {
    serviceMapRef.current.set(reference, service);
    setServices(Array.from(serviceMapRef.current.values()));
  }, []);

  const removedService = useCallback(
    (reference: ServiceReference<T>, _service: T, _tracked: T): void => {
      serviceMapRef.current.delete(reference);
      setServices(Array.from(serviceMapRef.current.values()));

      if (bundleContext) {
        bundleContext.ungetService(reference);
      }
    },
    [bundleContext],
  );

  useEffect(() => {
    if (!isInitialized || !bundleContext) {
      setLoading(true);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      serviceMapRef.current.clear();
      setServices([]);

      const customizer: ServiceTrackerCustomizer<T, T> = {
        addingService,
        modifiedService,
        removedService,
      };

      let filterParam: string | any;
      if (filter) {
        const combinedFilter = `(&(objectClass=${serviceClass})${filter})`;
        filterParam = bundleContext.createFilter(combinedFilter);
      } else {
        filterParam = serviceClass;
      }

      const tracker = new ServiceTracker<T, T>(bundleContext, filterParam, customizer);
      trackerRef.current = tracker;

      tracker.open();
      setLoading(false);
    } catch (err) {
      setError(err as Error);
      setLoading(false);
    }

    return () => {
      if (trackerRef.current && typeof trackerRef.current.close === 'function') {
        try {
          trackerRef.current.close();
        } catch (err) {
          // Ignore errors when closing the tracker, which can happen if the BundleContext is no longer valid
          console.error('Error closing service tracker:', err);
        } finally {
          trackerRef.current = null;
        }
      }
      serviceMapRef.current.clear();
      setServices([]);
    };
  }, [isInitialized, bundleContext, serviceClass, filter, addingService, modifiedService, removedService]);

  return useMemo(() => ({ services, loading, error }), [services, loading, error]);
}
