import { Bundle } from './bundle';
import { SERVICE_ID, SERVICE_RANKING } from './pandino-constants';
import { FilterApi } from './filter';

export interface ServiceReference<S> {
  getProperty(key: string): any;
  getBundle(): Bundle;
  getUsingBundles(): Bundle[];
  getProperties(): ServiceProperties;
  compareTo(other: ServiceReference<any>): number;
}

export interface ServiceRegistration<S> {
  getReference(): ServiceReference<S>;
  getProperty(key: string): any;
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
  getServiceReferences(filter: FilterApi): ServiceReference<any>[];
  getService<S>(bundle: Bundle, ref: ServiceReference<S>, isServiceObjects: boolean): S;
  getUsingBundles(ref: ServiceReference<any>): Bundle[];
}
