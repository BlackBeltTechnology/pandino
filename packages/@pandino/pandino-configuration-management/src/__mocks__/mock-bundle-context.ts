import {
  Bundle,
  BundleContext,
  BundleListener,
  BundleManifestHeaders,
  FilterApi,
  FrameworkListener,
  ServiceListener,
  ServiceProperties,
  ServiceReference,
  ServiceRegistration,
} from '@pandino/pandino-api';

export class MockBundleContext implements BundleContext {
  private properties: Record<any, any> = {};

  setProperty(name: string, value: string): void {
    if (value === null || value === undefined) {
      delete this.properties[name];
    } else {
      this.properties[name] = value;
    }
  }

  addBundleListener(listener: BundleListener): void {}

  addFrameworkListener(listener: FrameworkListener): void {}

  addServiceListener(listener: ServiceListener, filter?: string): void {}

  createFilter(filter: string): FilterApi {
    return undefined;
  }

  equals(other: any): boolean {
    return false;
  }

  getBundle(id?: number): Bundle;
  getBundle(): Bundle;
  getBundle(id?: number): Bundle {
    return undefined;
  }

  getBundles(): Bundle[] {
    return [];
  }

  getProperty(key: string): string {
    return '';
  }

  getService<S>(reference: ServiceReference<S>): S {
    return undefined;
  }

  getServiceReference<S>(identifier: string): ServiceReference<S> {
    return undefined;
  }

  getServiceReferences<S>(identifier: string, filter?: string): ServiceReference<S>[] {
    return [];
  }

  installBundle(locationOrHeaders: string | BundleManifestHeaders): Promise<Bundle> {
    return Promise.resolve(undefined);
  }

  registerService<S>(
    identifiers: string[] | string,
    service: S,
    properties?: ServiceProperties,
  ): ServiceRegistration<S> {
    return undefined;
  }

  removeBundleListener(listener: BundleListener): void {}

  removeFrameworkListener(listener: FrameworkListener): void {}

  removeServiceListener(listener: ServiceListener): void {}

  ungetService<S>(reference: ServiceReference<S>): boolean {
    return false;
  }
}
