import { useState, useEffect } from 'react';
import { ServiceRegistration } from '@pandino/pandino';
import { usePandinoContext } from '../context/pandino-context';

/**
 * Hook to register a service with the Pandino service registry
 *
 * @param serviceClass The class or interface name of the service to register
 * @param serviceImpl The service implementation
 * @param properties Optional properties for the service
 * @returns The service registration, registration state, and any error
 */
export function useRegisterService<T>(
  serviceClass: string | string[] | Function,
  serviceImpl: T,
  properties?: Record<string, any>,
): {
  registration: ServiceRegistration<T> | null;
  isRegistered: boolean;
  error: Error | null;
  updateProperties: (newProperties: Record<string, any>) => void;
} {
  const { bundleContext, isInitialized } = usePandinoContext();
  const [registration, setRegistration] = useState<ServiceRegistration<T> | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Function to update service properties
  const updateProperties = (newProperties: Record<string, any>) => {
    if (registration) {
      try {
        registration.setProperties(newProperties);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    }
  };

  useEffect(() => {
    if (!isInitialized || !bundleContext) {
      return;
    }

    try {
      // Register the service
      const reg = bundleContext.registerService<T>(serviceClass, serviceImpl, properties || {});

      setRegistration(reg);
      setIsRegistered(true);

      // Return a cleanup function to unregister the service
      return () => {
        try {
          reg.unregister();
          setIsRegistered(false);
          setRegistration(null);
        } catch (err) {
          console.error('Error unregistering service:', err);
        }
      };
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, [bundleContext, serviceClass, serviceImpl, properties, isInitialized]);

  return { registration, isRegistered, error, updateProperties };
}
