import type { Bundle, ServiceProperties, ServiceReference, ServiceRegistration } from '@pandino/pandino-api';
import type { UsageCount } from './usage-count';
import type { Capability } from './resource';

export interface ServiceRegistry {
  getRegisteredServices(bundle: Bundle): ServiceReference<any>[];
  registerService(bundle: Bundle, classNames: string | string[], svcObj: any, dict?: ServiceProperties): ServiceRegistration<any>;
  servicePropertiesModified(reg: ServiceRegistration<any>, oldProps: ServiceProperties): void;
  getServiceReferences(identifier?: string, filter?: string): Array<Capability>;
  getService<S>(bundle: Bundle, ref: ServiceReference<S>, isServiceObjects?: boolean): S | undefined;
  getUsingBundles(ref: ServiceReference<any>): Bundle[];
  unregisterService<S>(bundle: Bundle, reg: ServiceRegistration<S>): void;
  ungetService<S>(bundle: Bundle, ref: ServiceReference<S>, svcObj: any): boolean;
  obtainUsageCount<S>(bundle: Bundle, ref: ServiceReference<S>, svcObj: any, isPrototype?: boolean): UsageCount | undefined;
  unregisterServices(bundle: Bundle): void;
  ungetServices(bundle: Bundle): void;
}
