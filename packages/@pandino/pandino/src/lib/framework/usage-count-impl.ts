import { ServiceReference } from '@pandino/pandino-api';
import { UsageCount } from './usage-count';

export class UsageCountImpl implements UsageCount {
  private readonly ref: ServiceReference<any>;
  private service?: any;
  private count = 0;
  private serviceObjectsCount = 0;
  private readonly isProto: boolean;

  constructor(ref: ServiceReference<any>, isPrototype = false) {
    this.ref = ref;
    this.isProto = isPrototype;
  }

  getReference(): ServiceReference<any> {
    return this.ref;
  }

  getCount(): number {
    return this.count;
  }

  getServiceObjectsCount(): number {
    return this.serviceObjectsCount;
  }

  incrementToPositiveValue(): number {
    if (this.count + 1 < 1) {
      this.count = 1;
    }
    this.count++;
    return this.count;
  }

  incrementServiceObjectsCountToPositiveValue(): number {
    if (this.serviceObjectsCount <= 0) {
      return (this.serviceObjectsCount = 1);
    }
    this.serviceObjectsCount++;
    return this.serviceObjectsCount;
  }

  incrementAndGet(): number {
    return ++this.count;
  }

  decrementAndGet(): number {
    return --this.count;
  }

  serviceObjectsDecrementAndGet(): number {
    return --this.serviceObjectsCount;
  }

  getService(): any {
    return this.service;
  }

  setService(service: any): void {
    this.service = service;
  }

  isPrototype(): boolean {
    return this.isProto;
  }
}
