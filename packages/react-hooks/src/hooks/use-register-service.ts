import type { ServiceRegistration } from '@pandino/pandino';
import { useEffect, useState } from 'react';
import { usePandinoContext } from '../context';

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
      const reg = bundleContext.registerService<T>(serviceClass, serviceImpl, properties || {});

      setRegistration(reg);
      setIsRegistered(true);

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
