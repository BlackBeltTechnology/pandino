import type { ServiceReference } from '@pandino/pandino-api';

export interface UsageCount {
  getReference(): ServiceReference<any>;
  getCount(): number;
  getServiceObjectsCount(): number;
  getService(): any;
  setService(service: any): void;
  incrementAndGet(): number;
  decrementAndGet(): number;
  serviceObjectsDecrementAndGet(): number;
  incrementToPositiveValue(): number;
  incrementServiceObjectsCountToPositiveValue(): number;
  isPrototype(): boolean;
}
