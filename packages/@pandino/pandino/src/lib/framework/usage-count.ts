import { ServiceReference } from '@pandino/pandino-api';

export interface UsageCount {
  getReference(): ServiceReference<any>;
  getCount(): number;
  getService(): any;
  setService(service: any): void;
  incrementAndGet(): number;
  decrementAndGet(): number;
  incrementToPositiveValue(): number;
  incrementServiceObjectsCountToPositiveValue(): number;
  isPrototype(): boolean;
}
