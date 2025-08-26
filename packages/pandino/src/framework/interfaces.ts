import type { LogService } from '../services/log-service';
import type { BundleModule } from '../types/bundle-metadata';
import type { BundleState, ServiceEventType } from '../types/constants';

export interface BundleActivator {
  start(context: BundleContext): void | Promise<void>;
  stop(context: BundleContext): void | Promise<void>;
}

export interface BundleHeader {
  bundleSymbolicName?: string;
  bundleVersion?: string;
  bundleName?: string;
  bundleDescription?: string;
  bundleManifestVersion?: string;
  [key: string]: string | undefined;
}

export interface BundleConfiguration {
  headers?: BundleHeader;
  activator?: BundleActivator | (() => BundleActivator);
}

export interface Bundle {
  getBundleId(): number;
  getSymbolicName(): string;
  getVersion(): string;
  getState(): BundleState;
  getHeaders(locale?: string): Record<string, string>;
  getLocation(): string;
  start(options?: number): Promise<void>;
  stop(options?: number): Promise<void>;
  update(source?: ReadableStream): Promise<void>;
  uninstall(): Promise<void>;
  getRegisteredServices(): ServiceReference<any>[];
  getServicesInUse(): ServiceReference<any>[];
  getContext(): BundleContext;
  getBundleModule(): BundleModule | null;
  getResource(path: string): string | null;
  findResources(basePath: string, pattern: string): string[];
}

export interface BundleContext {
  getProperty(key: string): string | undefined;
  getBundle(): Bundle;
  getBundle(id: number): Bundle | null;
  getBundles(): Bundle[];
  installBundle(modulePromise: Promise<BundleModule>, config?: BundleConfiguration): Promise<Bundle>;
  installBundle(location: string, config?: BundleConfiguration): Promise<Bundle>;
  registerService<S>(
    clazz: string | string[] | Function,
    service: S,
    properties?: Record<string, any>,
  ): ServiceRegistration<S>;
  getServiceReference<S>(clazz: string | Function): ServiceReference<S> | null;
  getServiceReferences<S>(clazz: string | Function, filter?: string | null): ServiceReference<S>[] | null;
  getService<S>(reference: ServiceReference<S>): S | null;
  ungetService(reference: ServiceReference<any>): boolean;
  addServiceListener(listener: ServiceListener, filter?: string): void;
  removeServiceListener(listener: ServiceListener): void;
  addBundleListener(listener: BundleListener): void;
  removeBundleListener(listener: BundleListener): void;
  createFilter(filter: string): Filter;
  getDataFile(filename: string): string;
  getLogService(): LogService | null;
}

export interface ServiceRegistration<S> {
  getReference(): ServiceReference<S>;
  setProperties(properties: Record<string, any>): void;
  unregister(): void;
}

// oxlint-disable-next-line no-unused-vars
export interface ServiceReference<S> {
  getProperty(key: string): any;
  getPropertyKeys(): string[];
  getBundle(): Bundle;
  isAssignableTo(bundle: Bundle, className: string): boolean;
  getProperties(): Record<string, any>;
}

export interface ServiceListener {
  serviceChanged(event: ServiceEvent): void;
}

export interface BundleListener {
  bundleChanged(event: BundleEvent): void;
}

export interface Filter {
  match(properties: Record<string, any>): boolean;
  toString(): string;
}

export interface LdapFilterService {
  match(filter: string, properties: Record<string, any>): boolean;
  validateFilter(filter: string): boolean;
}

export class ServiceEvent {
  constructor(
    private type: ServiceEventType,
    private reference: ServiceReference<any>,
  ) {}

  getType(): ServiceEventType {
    return this.type;
  }

  getServiceReference(): ServiceReference<any> {
    return this.reference;
  }
}

export class BundleEvent {
  constructor(
    private type: number,
    private bundle: Bundle,
  ) {}

  getType(): number {
    return this.type;
  }

  getBundle(): Bundle {
    return this.bundle;
  }
}

export interface ServiceFactory<S> {
  getService(bundle: Bundle, registration: ServiceRegistration<S>): S;
  ungetService(bundle: Bundle, registration: ServiceRegistration<S>, service: S): void;
}

export interface FragmentResourceProcessor {
  getResourceType(): string;
  processResources(host: Bundle, fragment: Bundle): boolean;
}
