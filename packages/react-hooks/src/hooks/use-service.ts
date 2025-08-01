// oxlint-disable no-unused-vars
import { useEffect, useState } from 'react';
import { usePandinoContext } from '~/context';

/**
 * Hook to get a service from the Pandino service registry
 *
 * @param serviceClass The class or interface name of the service to get
 * @param filter Optional LDAP filter to further refine the service lookup
 * @returns The service instance, loading state, and any error
 */
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

  useEffect(() => {
    // Use setTimeout to ensure the effect runs after the initial render
    const timeoutId = setTimeout(() => {
      if (!isInitialized || !bundleContext) {
        setLoading(true);
        setService(null);
        setError(null);
        return;
      }

      try {
        // Get service reference
        const serviceReference = filter
          ? bundleContext.getServiceReferences<T>(serviceClass, filter)?.[0] || null
          : bundleContext.getServiceReference<T>(serviceClass);

        if (!serviceReference) {
          setService(null);
          setLoading(false);
          return;
        }

        // Get the service
        const serviceInstance = bundleContext.getService<T>(serviceReference);
        setService(serviceInstance);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      }
    }, 0);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [bundleContext, serviceClass, filter, isInitialized]);

  useEffect(() => {
    // Cleanup effect to unget service when dependencies change or component unmounts
    return () => {
      if (service && bundleContext) {
        try {
          const serviceReference = filter
            ? bundleContext.getServiceReferences<T>(serviceClass, filter)?.[0] || null
            : bundleContext.getServiceReference<T>(serviceClass);

          if (serviceReference) {
            bundleContext.ungetService(serviceReference);
          }
        } catch (err) {
          // Ignore cleanup errors
        }
      }
    };
  }, [bundleContext, serviceClass, filter, service]);

  return { service, loading, error };
}
