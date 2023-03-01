import { ServiceReference } from './service-reference';

export interface ServiceUtils {
  getBestServiceReference(refs: ServiceReference<any>[]): ServiceReference<any> | undefined;
}
