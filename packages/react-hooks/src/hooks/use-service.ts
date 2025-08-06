// oxlint-disable no-unused-vars
import { useEffect, useMemo, useRef, useState } from 'react';
import { ServiceReference } from '@pandino/pandino';
import { usePandinoContext } from '~/context';

export function useService<T>(
  serviceClass: string | Function,
  filter?: string,
): {
  service: T | null;
  loading: boolean;
  error: Error | null;
} {
  const { bundleContext, isInitialized } = usePandinoContext();
  const [service, setService] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const serviceReferenceRef = useRef<ServiceReference<T> | null>(null);

  useEffect(() => {
    if (!isInitialized || !bundleContext) {
      setLoading(true);
      setService(null);
      setError(null);
      return;
    }

    try {
      const serviceReference = filter
        ? bundleContext.getServiceReferences<T>(serviceClass, filter)?.[0] || null
        : bundleContext.getServiceReference<T>(serviceClass);

      serviceReferenceRef.current = serviceReference;

      if (!serviceReference) {
        setService(null);
        setLoading(false);
        return;
      }

      const serviceInstance = bundleContext.getService<T>(serviceReference);
      setService(serviceInstance);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setLoading(false);
    }

    return () => {
      if (serviceReferenceRef.current && bundleContext) {
        try {
          bundleContext.ungetService(serviceReferenceRef.current);
          serviceReferenceRef.current = null;
        } catch (err) {
          // Ignore cleanup errors
        }
      }
    };
  }, [bundleContext, serviceClass, filter, isInitialized]);

  return useMemo(() => ({ service, loading, error }), [service, loading, error]);
}
