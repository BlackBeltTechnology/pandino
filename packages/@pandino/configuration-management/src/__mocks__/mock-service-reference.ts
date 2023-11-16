import type { Bundle, ServiceProperties, ServiceReference } from '@pandino/pandino-api';
import { SERVICE_PID } from '@pandino/pandino-api';

export class MockServiceReference implements ServiceReference<any> {
  private readonly bundle: Bundle;
  private readonly pids: any;

  constructor(bundle: Bundle, pids: any) {
    this.bundle = bundle;
    this.pids = pids;
  }

  hasObjectClass(objectClass: string): boolean {
    return false;
  }

  compareTo(other: ServiceReference<any>): number {
    return 0;
  }

  getBundle(): Bundle {
    return this.bundle;
  }

  getProperties(): ServiceProperties {
    return undefined as any;
  }

  getProperty(key: string): any {
    if (SERVICE_PID === key) {
      return this.pids;
    }
  }

  getPropertyKeys(): Array<string> {
    return [];
  }

  getUsingBundles(): Bundle[] {
    return [];
  }

  isAssignableTo(bundle: Bundle, className: string): boolean {
    return false;
  }
}
