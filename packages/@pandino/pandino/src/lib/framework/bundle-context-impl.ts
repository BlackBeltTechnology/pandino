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
} from '@pandino/pandino-api';
import Pandino from '../../pandino';
import Filter from '../filter/filter';
import { BundleImpl } from './bundle-impl';
import { isAllPresent, isAnyMissing } from '../utils/helpers';

export class BundleContextImpl implements BundleContext {
  private valid = true;

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

    return Filter.parse(filter);
  }

  getBundle(): Bundle;
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

    const result = await this.pandino.installBundle(this.bundle, locationOrHeaders);
    return Promise.resolve(result);
  }

  addServiceListener(listener: ServiceListener, filter?: string): void {
    this.pandino.addServiceListener(this.bundle, listener, filter);
  }

  getService<S>(reference: ServiceReference<S>): S {
    this.checkValidity();

    if (isAnyMissing(reference)) {
      throw new Error('Specified service reference must be defined.');
    }

    return this.pandino.getService(this.bundle, reference, false);
  }

  getServiceReference<S>(identifier: string): ServiceReference<S> {
    throw new Error('Method not implemented.');
  }

  getServiceReferences<S>(identifier: string, filter?: string): ServiceReference<S>[] {
    throw new Error('Method not implemented.');
  }

  registerService<S>(
    identifiers: string[] | string,
    service: S,
    properties: ServiceProperties,
  ): ServiceRegistration<S> {
    throw new Error('Method not implemented.');
  }

  removeServiceListener(listener: ServiceListener): void {
    throw new Error('Method not implemented.');
  }

  ungetService<S>(reference: ServiceReference<S>): boolean {
    throw new Error('Method not implemented.');
  }

  invalidate(): void {
    this.valid = false;
  }

  private checkValidity(): void {
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
    // TODO: this shouldn't be enough, should add more cases
    return false;
  }
}
