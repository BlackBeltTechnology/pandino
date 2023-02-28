import { ServiceReference } from '../../dist/esm/dist';

export interface ServiceUtils {
  getBestServiceReference(refs: ServiceReference<any>[]): ServiceReference<any> | undefined;
}
