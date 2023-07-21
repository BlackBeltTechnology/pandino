import {
  Bundle,
  BundleContext,
  BundleListener,
  BundleManifestHeaders,
  BundleState,
  BundleTracker,
  BundleTrackerCustomizer,
  FrameworkListener,
  ServiceEventType,
  ServiceListener,
  ServiceObjects,
  ServiceProperties,
  ServiceReference,
  ServiceRegistration,
  ServiceTracker,
  ServiceTrackerCustomizer,
} from '@pandino/pandino-api';

export class MockBundleContext implements BundleContext {
  private properties: Record<any, any> = {};
  private serviceListeners: ServiceListener[] = [];
  private readonly registrations: ServiceRegistration<any>[] = [];
  private readonly refMap: Map<string[] | string, ServiceReference<any>> = new Map<
    string[] | string,
    ServiceReference<any>
  >();
  private readonly serviceMap: Map<ServiceReference<any>, any> = new Map<ServiceReference<any>, any>();
  private bundle: Bundle;

  setProperty(name: string, value: string): void {
    if (value === null || value === undefined) {
      delete this.properties[name];
    } else {
      this.properties[name] = value;
    }
  }

  setBundle(bundle: Bundle): void {
    this.bundle = bundle;
  }

  addBundleListener(listener: BundleListener): void {}

  addFrameworkListener(listener: FrameworkListener): void {}

  addServiceListener(listener: ServiceListener, filter?: string): void {
    this.serviceListeners.push(listener);
  }

  equals(other: any): boolean {
    return false;
  }

  getBundle(id?: number): Bundle;
  getBundle(): Bundle;
  getBundle(id?: number): Bundle {
    return this.bundle;
  }

  getBundles(): Bundle[] {
    return [];
  }

  getProperty(key: string): string {
    return '';
  }

  getService<S>(reference: ServiceReference<S>): S {
    return this.serviceMap.get(reference);
  }

  getServiceReference<S>(identifier: string): ServiceReference<S> {
    return this.refMap.get(identifier);
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
    properties: ServiceProperties = {},
  ): ServiceRegistration<S> {
    const ref: ServiceReference<any> = {
      getBundle: () => this.getBundle(),
      getProperties: () => properties,
      getProperty: (key: string) => properties[key],
      compareTo: () => 0,
      getPropertyKeys: () => Object.keys(properties),
      getUsingBundles: () => [],
      isAssignableTo(bundle: Bundle, className: string): boolean {
        return true;
      },
      hasObjectClass: (objectClass: string) => false,
    };
    this.refMap.set(identifiers, ref);
    const reg: ServiceRegistration<any> = {
      getReference: () => ref,
      setProperties: () => undefined,
      unregister: () => undefined,
      getProperties: () => properties,
      getProperty: (key: string) => properties[key],
      getPropertyKeys: () => Object.keys(properties),
    };
    this.serviceMap.set(ref, service);
    this.registrations.push(reg);
    this.serviceListeners.forEach((listener) => {
      listener.serviceChanged({
        getType(): ServiceEventType {
          return 'REGISTERED';
        },
        getServiceReference: () => ref,
      });
    });
    return reg;
  }

  removeBundleListener(listener: BundleListener): void {}

  removeFrameworkListener(listener: FrameworkListener): void {}

  removeServiceListener(listener: ServiceListener): void {}

  ungetService<S>(reference: ServiceReference<S>): boolean {
    return false;
  }

  getAllServiceReferences(identifier: string, filter: string): Array<ServiceReference<any>> {
    return [];
  }

  getServiceObjects<S>(reference: ServiceReference<S>): ServiceObjects<S> | undefined {
    return undefined;
  }

  trackBundle<T>(trackedStates: BundleState[], customizer: Partial<BundleTrackerCustomizer<T>>): BundleTracker<T> {
    return undefined;
  }

  trackService<S, T>(
    identifierOrFilter: string,
    customizer: Partial<ServiceTrackerCustomizer<S, T>>,
  ): ServiceTracker<S, T> {
    return undefined;
  }
}
