import type { Bundle } from '@pandino/pandino';
import { useEffect, useMemo, useState } from 'react';
import { usePandinoContext } from '../context';
import { findBundleBySymbolicName } from '../utils/bundle-utils';

/**
 * Looks up a single bundle by its numeric ID or symbolic name.
 *
 * @param bundleIdOrName - Bundle ID (number) or symbolic name (string).
 * @returns `{ bundle, loading, error }` - the resolved `Bundle` or `null` if not found.
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
        foundBundle = framework.getBundle(bundleIdOrName);
      } else {
        foundBundle = findBundleBySymbolicName(framework, bundleIdOrName);
      }

      setBundle(foundBundle);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setLoading(false);
    }
  }, [framework, bundleIdOrName, isInitialized]);

  return useMemo(() => ({ bundle, loading, error }), [bundle, loading, error]);
}

/**
 * Returns every bundle currently known to the framework.
 *
 * @returns `{ bundles, loading, error }` - an array of all `Bundle` instances.
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

  return useMemo(() => ({ bundles, loading, error }), [bundles, loading, error]);
}
