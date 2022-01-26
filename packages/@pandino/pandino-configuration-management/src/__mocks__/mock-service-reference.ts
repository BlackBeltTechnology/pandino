import { Bundle, SERVICE_PID, ServiceProperties, ServiceReference } from '@pandino/pandino-api';

export class MockServiceReference implements ServiceReference<any> {
  private readonly bundle: Bundle;
  private readonly pids: any;

  constructor(bundle: Bundle, pids: any) {
    this.bundle = bundle;
    this.pids = pids;
  }

  compareTo(other: ServiceReference<any>): number {
    return 0;
  }

  getBundle(): Bundle {
    return this.bundle;
  }

  getProperties(): ServiceProperties {
    return undefined;
  }

  getProperty(key: string): any {
    if (SERVICE_PID === key) {
      return this.pids;
    }
  }

  getPropertyKeys(): Array<string> {
    return undefined;
  }

  getUsingBundles(): Bundle[] {
    return [];
  }

  isAssignableTo(bundle: Bundle, className: string): boolean {
    return false;
  }
}
