import { useState, useEffect } from 'react';
import { Bundle } from '@pandino/pandino';
import { usePandinoContext } from '../context/pandino-context';
import { findBundleBySymbolicName } from '../utils/bundle-utils';

/**
 * Hook to get a bundle by ID or symbolic name
 *
 * @param bundleIdOrName The bundle ID or symbolic name
 * @returns The bundle, loading state, and any error
 */
export function useBundle(bundleIdOrName: number | string): {
  bundle: Bundle | null;
  loading: boolean;
  error: Error | null;
} {
  const { framework, isInitialized } = usePandinoContext();
  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!isInitialized || !framework) {
      return;
    }

    try {
      let foundBundle: Bundle | null = null;

      if (typeof bundleIdOrName === 'number') {
        // Get bundle by ID
        foundBundle = framework.getBundle(bundleIdOrName);
      } else {
        // Get bundle by symbolic name
        foundBundle = findBundleBySymbolicName(framework, bundleIdOrName);
      }

      setBundle(foundBundle);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setLoading(false);
    }
  }, [framework, bundleIdOrName, isInitialized]);

  return { bundle, loading, error };
}

/**
 * Hook to get all bundles in the framework
 *
 * @returns An array of bundles, loading state, and any error
 */
export function useAllBundles(): {
  bundles: Bundle[];
  loading: boolean;
  error: Error | null;
} {
  const { framework, isInitialized } = usePandinoContext();
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!isInitialized || !framework) {
      return;
    }

    try {
      const allBundles = framework.getBundles();
      setBundles(allBundles);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setLoading(false);
    }
  }, [framework, isInitialized]);

  return { bundles, loading, error };
}
