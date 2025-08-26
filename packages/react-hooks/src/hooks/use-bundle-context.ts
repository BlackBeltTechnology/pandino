import type { BundleContext } from '@pandino/pandino';
import { useMemo } from 'react';
import { usePandinoContext } from '../context';

export function useBundleContext(): BundleContext | null {
  const { bundleContext } = usePandinoContext();

  return useMemo(() => bundleContext, [bundleContext]);
}
