import { useEffect, useMemo, useRef } from 'react';
import { ServiceReference } from '@pandino/pandino';
import { usePandinoContext } from '../context';

export function useService<T>(
  serviceClass: string | Function,
  filter?: string,
): {
  service: T | null;
  loading: boolean;
  error: Error | null;
} {
  const { bundleContext, isInitialized } = usePandinoContext();
  const cleanupRef = useRef<ServiceReference<T> | null>(null);

  const result = useMemo(() => {
    if (!isInitialized || !bundleContext) {
      return {
        service: null as T | null,
        loading: true,
        error: null as Error | null,
        ref: null as ServiceReference<T> | null,
      };
    }

    try {
      const serviceReference: ServiceReference<T> | null = filter
        ? bundleContext.getServiceReferences<T>(serviceClass, filter)?.[0] || null
        : bundleContext.getServiceReference<T>(serviceClass);

      if (!serviceReference) {
        return { service: null as T | null, loading: false, error: null as Error | null, ref: null };
      }

      const serviceInstance = bundleContext.getService<T>(serviceReference);
      return { service: serviceInstance, loading: false, error: null as Error | null, ref: serviceReference };
    } catch (err) {
      return {
        service: null as T | null,
        loading: false,
        error: (err instanceof Error ? err : new Error(String(err))) as Error,
        ref: null,
      };
    }
  }, [bundleContext, isInitialized, serviceClass, filter]);

  useEffect(() => {
    // Track the current reference for cleanup on change/unmount
    cleanupRef.current = result.ref;
    return () => {
      if (cleanupRef.current && bundleContext) {
        try {
          bundleContext.ungetService(cleanupRef.current);
          // oxlint-disable-next-line no-unused-vars
        } catch (_err) {
          // ignore cleanup errors
        } finally {
          cleanupRef.current = null;
        }
      }
    };
  }, [bundleContext, result.ref]);

  return useMemo(
    () => ({ service: result.service, loading: result.loading, error: result.error }),
    [result.service, result.loading, result.error],
  );
}
