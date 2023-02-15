import {
  Bundle,
  BundleContext,
  BundleListener,
  BundleManifestHeaders,
  FrameworkListener,
  FilterApi,
  Logger,
  BUNDLE_SYMBOLICNAME,
  BUNDLE_VERSION,
  ServiceListener,
  ServiceReference,
  ServiceProperties,
  ServiceRegistration,
  ServiceFactory,
  ServiceObjects,
  BundleState,
  BundleTrackerCustomizer,
  BundleTracker,
  BundleEvent,
  ServiceTrackerCustomizer,
  ServiceTracker,
} from '@pandino/pandino-api';
import { Pandino } from '../../pandino';
import { BundleImpl } from './bundle-impl';
import { isAllPresent, isAnyMissing } from '../utils/helpers';
import { ServiceReferenceImpl } from './service-reference-impl';
import { ServiceObjectsImpl } from './service-objects-impl';
import { BundleTrackerImpl } from './bundle-tracker-impl';
import { ServiceTrackerImpl } from './service-tracker-impl';
import { parse } from '../filter';

export class BundleContextImpl implements BundleContext {
  private valid = true;
  private bundleTrackers: BundleTracker<any>[] = [];
  private serviceTrackers: ServiceTracker<any, any>[] = [];

  constructor(
    private readonly logger: Logger,
    private readonly bundle: BundleImpl,
    private readonly pandino: Pandino,
  ) {}

  addBundleListener(listener: BundleListener): void {
    this.checkValidity();

    this.pandino.addBundleListener(this.bundle, listener);
  }

  removeBundleListener(listener: BundleListener): void {
    this.checkValidity();

    this.pandino.removeBundleListener(this.bundle, listener);
  }

  addFrameworkListener(listener: FrameworkListener): void {
    this.checkValidity();

    this.pandino.addFrameworkListener(this.bundle, listener);
  }

  removeFrameworkListener(listener: FrameworkListener): void {
    this.checkValidity();

    this.pandino.removeFrameworkListener(this.bundle, listener);
  }

  createFilter(filter: string): FilterApi {
    this.checkValidity();

    return parse(filter);
  }

  getBundle(id?: number): Bundle {
    this.checkValidity();

    if (isAllPresent(id)) {
      return this.pandino.getBundle(id);
    }

    return this.bundle;
  }

  getBundles(): Bundle[] {
    this.checkValidity();

    return this.pandino.getBundles(this);
  }

  getProperty(key: string): string {
    this.checkValidity();

    return this.pandino.getProperty(key);
  }

  async installBundle(locationOrHeaders: string | BundleManifestHeaders): Promise<Bundle> {
    if (typeof locationOrHeaders === 'string') {
      this.logger.debug(`Installing Bundle from location: ${locationOrHeaders}`);
    } else {
      this.logger.debug(
        `Installing Bundle: ${locationOrHeaders[BUNDLE_SYMBOLICNAME]}: ${locationOrHeaders[BUNDLE_VERSION]}`,
      );
    }
    this.checkValidity();

    return this.pandino.installBundle(this.bundle, locationOrHeaders);
  }

  addServiceListener(listener: ServiceListener, filter?: string): void {
    this.checkValidity();
    this.pandino.addServiceListener(this.bundle, listener, filter);
  }

  getService<S>(reference: ServiceReference<S>): S {
    this.checkValidity();

    if (isAnyMissing(reference)) {
      throw new Error('Specified service reference must be defined.');
    }

    return this.pandino.getService(this.bundle, reference, false);
  }

  getServiceReference<S>(identifier: string): ServiceReference<S> | undefined {
    this.checkValidity();
    try {
      const refs = this.getServiceReferences(identifier, null);
      return BundleContextImpl.getBestServiceReference(refs);
    } catch (ex) {
      this.logger.error('BundleContextImpl: ' + ex);
    }
    return undefined;
  }

  getAllServiceReferences(identifier?: string, filter?: string): Array<ServiceReference<any>> {
    this.checkValidity();

    return this.pandino.getAllowedServiceReferences(this.bundle, identifier, filter, false);
  }

  getServiceReferences<S>(identifier?: string, filter?: string): ServiceReference<S>[] {
    this.checkValidity();

    return this.pandino.getAllowedServiceReferences(this.bundle, identifier, filter, true);
  }

  registerService<S>(
    identifiers: string[] | string,
    service: S | ServiceFactory<S>,
    properties?: ServiceProperties,
  ): ServiceRegistration<S> {
    this.checkValidity();
    return this.pandino.registerService(this, identifiers, service, properties || {});
  }

  removeServiceListener(listener: ServiceListener): void {
    this.checkValidity();
    this.pandino.removeServiceListener(this.bundle, listener);
  }

  ungetService<S>(reference: ServiceReference<S>): boolean {
    this.checkValidity();

    if (isAnyMissing(reference)) {
      throw new Error('Specified service reference cannot be missing.');
    }

    return this.pandino.ungetService(this.bundle, reference, null);
  }

  getServiceObjects<S>(reference: ServiceReference<S>): ServiceObjects<S> | undefined {
    this.checkValidity();

    const reg = (reference as ServiceReferenceImpl).getRegistration();
    if (reg.isValid()) {
      return new ServiceObjectsImpl<S>(reference, this, this.pandino);
    }
    return undefined;
  }

  isValid(): boolean {
    return this.valid;
  }

  invalidate(): void {
    this.valid = false;
  }

  checkValidity(): void {
    if (this.valid) {
      switch (this.bundle.getState()) {
        case 'ACTIVE':
        case 'STARTING':
        case 'STOPPING':
          return;
      }
    }

    throw new Error('Invalid BundleContext.');
  }

  equals(other: any): boolean {
    if (isAnyMissing(other) || !(other instanceof BundleContextImpl)) {
      return false;
    }
    if (
      this.getBundle().getSymbolicName() === other.getBundle().getSymbolicName() &&
      this.getBundle().getVersion().toString() === other.getBundle().getVersion().toString()
    ) {
      return true;
    }
    return false;
  }

  trackBundle<T>(trackedStates: BundleState[], customizer: Partial<BundleTrackerCustomizer<T>>): BundleTracker<T> {
    this.checkValidity();

    const self = this;

    const tracker = new (class extends BundleTrackerImpl<T> {
      constructor() {
        super(self, trackedStates);
      }

      addingBundle(bundle: Bundle, event: BundleEvent): T {
        return customizer.addingBundle ? customizer.addingBundle(bundle, event) : super.addingBundle(bundle, event);
      }

      modifiedBundle(bundle: Bundle, event: BundleEvent, object: T) {
        customizer.modifiedBundle
          ? customizer.modifiedBundle(bundle, event, object)
          : super.modifiedBundle(bundle, event, object);
      }

      removedBundle(bundle: Bundle, event: BundleEvent, object: T) {
        customizer.removedBundle
          ? customizer.removedBundle(bundle, event, object)
          : super.removedBundle(bundle, event, object);
      }
    })();

    this.bundleTrackers.push(tracker);

    return tracker;
  }

  trackService<S, T>(
    identifierOrFilter: string | FilterApi,
    customizer: Partial<ServiceTrackerCustomizer<S, T>>,
  ): ServiceTracker<S, T> {
    this.checkValidity();

    const self = this;

    const tracker = new (class extends ServiceTrackerImpl<S, T> {
      constructor() {
        super(self, identifierOrFilter);
      }

      addingService(reference: ServiceReference<S>): T {
        return customizer.addingService ? customizer.addingService(reference) : super.addingService(reference);
      }

      modifiedService(reference: ServiceReference<S>, service: T) {
        customizer.modifiedService
          ? customizer.modifiedService(reference, service)
          : super.modifiedService(reference, service);
      }

      removedService(reference: ServiceReference<S>, service: T) {
        customizer.removedService
          ? customizer.removedService(reference, service)
          : super.removedService(reference, service);
      }
    })();

    this.serviceTrackers.push(tracker);

    return tracker;
  }

  closeTrackers(): void {
    for (const tracker of this.bundleTrackers) {
      try {
        tracker.close();
      } catch (_) {}
    }

    for (const tracker of this.serviceTrackers) {
      try {
        tracker.close();
      } catch (_) {}
    }

    this.bundleTrackers = [];
    this.serviceTrackers = [];
  }

  private static getBestServiceReference(refs: ServiceReference<any>[]): ServiceReference<any> | undefined {
    if (isAnyMissing(refs)) {
      return undefined;
    }

    if (refs.length === 1) {
      return refs[0];
    }

    let bestRef: ServiceReference<any> = refs[0];
    for (let i = 1; i < refs.length; i++) {
      if (bestRef.compareTo(refs[i]) < 0) {
        bestRef = refs[i];
      }
    }

    return bestRef;
  }
}
