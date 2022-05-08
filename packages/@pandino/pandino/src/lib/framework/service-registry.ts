import { Bundle, FilterApi, ServiceProperties, ServiceReference, ServiceRegistration } from '@pandino/pandino-api';
import { UsageCount } from './usage-count';
import { Capability } from './resource/capability';

export interface ServiceRegistry {
  getRegisteredServices(bundle: Bundle): ServiceReference<any>[];
  registerService(
    bundle: Bundle,
    classNames: string | string[],
    svcObj: any,
    dict?: ServiceProperties,
  ): ServiceRegistration<any>;
  servicePropertiesModified(reg: ServiceRegistration<any>, oldProps: ServiceProperties): void;
  getServiceReferences(identifier?: string, filter?: FilterApi): Array<Capability>;
  getService<S>(bundle: Bundle, ref: ServiceReference<S>, isServiceObjects?: boolean): S;
  getUsingBundles(ref: ServiceReference<any>): Bundle[];
  unregisterService<S>(bundle: Bundle, reg: ServiceRegistration<S>): void;
  ungetService<S>(bundle: Bundle, ref: ServiceReference<S>, svcObj: any): boolean;
  obtainUsageCount<S>(bundle: Bundle, ref: ServiceReference<S>, svcObj: any, isPrototype?: boolean): UsageCount;
  unregisterServices(bundle: Bundle): void;
  ungetServices(bundle: Bundle): void;
}
