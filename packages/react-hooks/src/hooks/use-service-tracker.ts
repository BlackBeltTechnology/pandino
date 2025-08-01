import type { ServiceReference, ServiceTrackerCustomizer } from '@pandino/pandino';
import { ServiceTracker } from '@pandino/pandino';
import { useCallback, useEffect, useRef, useState } from 'react';
import { usePandinoContext } from '~/context';

export interface UseServiceTrackerResult<T = any> {
  services: T[];
  loading: boolean;
  error: Error | null;
}

/**
 * Hook to track services using Pandino's ServiceTracker
 * @param serviceClass - The service class name or interface to track
 * @param filter - Optional LDAP filter string to further filter services
 * @returns Object containing tracked services, loading state, and error state
 */
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
    // Update the existing service in the map with the new service object
    serviceMapRef.current.set(reference, service);
    setServices(Array.from(serviceMapRef.current.values()));
  }, []);

  const removedService = useCallback(
    (reference: ServiceReference<T>, _service: T, _tracked: T): void => {
      serviceMapRef.current.delete(reference);
      setServices(Array.from(serviceMapRef.current.values()));

      // Unget the service reference
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
      // Clear previous services
      serviceMapRef.current.clear();
      setServices([]);

      // Create the customizer object with the callbacks
      const customizer: ServiceTrackerCustomizer<T, T> = {
        addingService,
        modifiedService,
        removedService,
      };

      // Determine what to use as the filter parameter
      let filterParam: string | any;
      if (filter) {
        // Create a combined filter that includes both the service class and the custom filter
        const combinedFilter = `(&(objectClass=${serviceClass})${filter})`;
        filterParam = bundleContext.createFilter(combinedFilter);
      } else {
        // Use the service class directly
        filterParam = serviceClass;
      }

      // Create and start the tracker
      const tracker = new ServiceTracker<T, T>(bundleContext, filterParam, customizer);
      trackerRef.current = tracker;

      tracker.open();
      setLoading(false);
    } catch (err) {
      setError(err as Error);
      setLoading(false);
    }

    // Cleanup function
    return () => {
      if (trackerRef.current && typeof trackerRef.current.close === 'function') {
        trackerRef.current.close();
        trackerRef.current = null;
      }
      serviceMapRef.current.clear();
      setServices([]);
    };
  }, [isInitialized, bundleContext, serviceClass, filter, addingService, modifiedService, removedService]);

  return { services, loading, error };
}
