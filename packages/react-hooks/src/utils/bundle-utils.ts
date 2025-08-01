import type { Bundle, OSGiFramework } from '@pandino/pandino';

export function findBundleBySymbolicName(framework: OSGiFramework, symbolicName: string): Bundle | null {
  const bundles = framework.getBundles();
  return bundles.find((bundle) => bundle.getSymbolicName() === symbolicName) || null;
}
