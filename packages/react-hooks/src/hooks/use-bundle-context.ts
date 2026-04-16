import type { BundleContext } from '@pandino/pandino';
import { useMemo } from 'react';
import { usePandinoContext } from '../context';

/**
 * Returns the framework's root `BundleContext`, or `null` if Pandino has not
 * finished initializing. Must be used inside a `<PandinoProvider>`.
 */
export function useBundleContext(): BundleContext | null {
  const { bundleContext } = usePandinoContext();

  return useMemo(() => bundleContext, [bundleContext]);
}
