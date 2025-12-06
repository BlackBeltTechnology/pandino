import { useMemo } from 'react';
import type { OSGiFramework } from '@pandino/pandino';
import type { Node } from '@xyflow/react';
import { BUNDLE_STATES } from '@pandino/pandino';

export interface Statistics {
  totalBundles: number;
  activeBundles: number;
  totalServices: number;
}

/**
 * Custom hook to calculate framework statistics
 */
export function useFrameworkStatistics(
  framework: OSGiFramework | null,
  nodes: Node[]
): Statistics {
  return useMemo(() => {
    if (!framework) {
      return { totalBundles: 0, activeBundles: 0, totalServices: 0 };
    }

    const context = framework.getBundleContext();
    const bundles = context.getBundles();
    const activeBundles = bundles.filter(
      (b) => b.getState() === BUNDLE_STATES.ACTIVE
    ).length;

    let totalServices = 0;
    bundles.forEach((bundle) => {
      totalServices += bundle.getRegisteredServices().length;
    });

    return {
      totalBundles: bundles.length,
      activeBundles,
      totalServices,
    };
  }, [framework, nodes]);
}

