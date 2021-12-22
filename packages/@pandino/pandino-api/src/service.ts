import { Bundle, BundleReference } from './bundle';
import { SERVICE_ID, SERVICE_RANKING } from './pandino-constants';
import { FilterApi } from './filter';
import { Capability } from './resource';

export interface ServiceReference<S> extends BundleReference {
  getProperty(key: string): any;
  getPropertyKeys(): Array<string>;
  getBundle(): Bundle;
  getUsingBundles(): Bundle[];
  getProperties(): ServiceProperties;
  compareTo(other: ServiceReference<any>): number;
}

export interface ServiceRegistration<S> {
  getReference(): ServiceReference<S>;
  getProperty(key: string): any;
  getPropertyKeys(): Array<string>;
  getProperties(): ServiceProperties;
  setProperties(properties: ServiceProperties): void;
  unregister(): void;
}

export type ServiceEventType = 'REGISTERED' | 'MODIFIED' | 'UNREGISTERING' | 'MODIFIED_ENDMATCH';

export interface ServiceProperties {
  [SERVICE_ID]?: number;
  [SERVICE_RANKING]?: string;
  [key: string]: any;
}

export interface ServiceListener {
  serviceChanged(event: ServiceEvent): void;
}

export interface ServiceEvent {
  getServiceReference(): ServiceReference<any>;
  getType(): ServiceEventType;
}

export interface ServiceRegistryCallbacks {
  serviceChanged(event: ServiceEvent, oldProps: ServiceProperties): void;
}

export interface ServiceRegistry {
  getRegisteredServices(bundle: Bundle): ServiceReference<any>[];
  registerService(
    bundle: Bundle,
    classNames: string | string[],
    svcObj: any,
    dict?: ServiceProperties,
  ): ServiceRegistration<any>;
  servicePropertiesModified(reg: ServiceRegistration<any>, oldProps: ServiceProperties): void;
  getServiceReferences(identifier: string, filter: FilterApi): Array<Capability>;
  getService<S>(bundle: Bundle, ref: ServiceReference<S>, isServiceObjects?: boolean): S;
  getUsingBundles(ref: ServiceReference<any>): Bundle[];
  unregisterService<S>(bundle: Bundle, reg: ServiceRegistration<S>): void;
  ungetService<S>(bundle: Bundle, ref: ServiceReference<S>, svcObj: any): boolean;
  obtainUsageCount<S>(bundle: Bundle, ref: ServiceReference<S>, svcObj: any, isPrototype?: boolean): UsageCount;
}

export interface UsageCount {
  getReference(): ServiceReference<any>;
  getCount(): number;
  getService(): any;
  setService(service: any): void;
  incrementAndGet(): number;
  decrementAndGet(): number;
  incrementToPositiveValue(): number;
  incrementServiceObjectsCountToPositiveValue(): number;
}
