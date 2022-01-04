import { ServiceReference } from '@pandino/pandino-api';
import { UsageCount } from './usage-count';

export class UsageCountImpl implements UsageCount {
  private readonly ref: ServiceReference<any>;
  private service?: any;
  private count = 0;
  private serviceObjectsCount = 0;

  constructor(ref: ServiceReference<any>) {
    this.ref = ref;
  }

  getReference(): ServiceReference<any> {
    return this.ref;
  }

  getCount(): number {
    return this.count;
  }

  incrementToPositiveValue(): number {
    if (this.count + 1 < 1) {
      this.count = 1;
    }
    this.count++;
    return this.count;
  }

  incrementServiceObjectsCountToPositiveValue(): number {
    if (this.serviceObjectsCount + 1 < 1) {
      this.serviceObjectsCount = 1;
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

  getService(): any {
    return this.service;
  }

  setService(service: any): void {
    this.service = service;
  }
}
