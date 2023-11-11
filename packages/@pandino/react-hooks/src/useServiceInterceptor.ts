import { useEffect, useRef } from 'react';
import { FRAMEWORK_SERVICE_UTILS, ServiceReference, ServiceUtils } from '@pandino/pandino-api';
import { useBundleContext } from './PandinoContext';

export type InterceptorHook = () => <T>(filter: string, target: T) => T;

export const useServiceInterceptor: InterceptorHook = <T>() => {
  const { bundleContext } = useBundleContext();
  const serviceUtilsRef = bundleContext.getServiceReference<ServiceUtils>(FRAMEWORK_SERVICE_UTILS);
  const serviceUtils = bundleContext.getService(serviceUtilsRef);
  const refsUsed = useRef<Set<ServiceReference<any>>>(new Set<ServiceReference<any>>());

  useEffect(() => {
    // cleanup refs, regs
    return () => {
      try {
        if (serviceUtilsRef) {
          bundleContext.ungetService(serviceUtilsRef);
        }
        for (const ref of refsUsed.current) {
          bundleContext.ungetService(ref);
        }
      } catch (e) {
        console.error(e);
      }
    };
  }, []);

  return (filter: string, target: T) => {
    const refs = bundleContext.getServiceReferences(undefined, filter);
    const ref = serviceUtils.getBestServiceReference(refs);
    for (const refI of refs) {
      refsUsed.current.add(refI);
    }
    if (ref) {
      refsUsed.current.add(ref);
      return bundleContext.getService(ref);
    }
    return target;
  };
};
