import type { ServiceReference, ServiceUtils } from '@pandino/pandino-api';

export const serviceUtilsImpl: ServiceUtils = {
  getBestServiceReference: (refs: ServiceReference<any>[]): ServiceReference<any> | undefined => {
    if (!Array.isArray(refs)) {
      return undefined;
    }

    if (refs.length === 1) {
      return refs[0];
    }

    let bestRef: ServiceReference<any> = refs[0];
    for (let i = 1; i < refs.length; i++) {
      if (bestRef.compareTo(refs[i]) < 0) {
        bestRef = refs[i];
      }
    }

    return bestRef;
  },
};
