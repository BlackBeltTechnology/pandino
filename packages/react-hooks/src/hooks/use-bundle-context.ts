import { BundleContext } from '@pandino/pandino';
import { usePandinoContext } from '~/context';

export function useBundleContext(): BundleContext | null {
  const { bundleContext } = usePandinoContext();
  return bundleContext;
}
