import type { LogService } from '../services/log-service';
import type { BundleModule } from '../types/bundle-metadata';
import type { BundleState, ServiceEventType } from '../types/constants';

/**
 * Lifecycle interface for bundles. Implement this to execute logic
 * when a bundle is started or stopped.
 */
export interface BundleActivator {
  /** Called when the bundle is started. Register services and listeners here. */
  start(context: BundleContext): void | Promise<void>;
  /** Called when the bundle is stopped. Perform cleanup here (services registered via the context are released automatically). */
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

/**
 * Represents an installed bundle in the framework. Bundles are the unit of
 * modularity in Pandino, each with its own lifecycle and service registrations.
 */
export interface Bundle {
  /** Returns the unique numeric identifier for this bundle. */
  getBundleId(): number;
  /** Returns the symbolic name from the bundle's headers (e.g. `'com.example.database'`). */
  getSymbolicName(): string;
  /** Returns the version string from the bundle's headers. */
  getVersion(): string;
  /** Returns the current lifecycle state (one of the {@link BUNDLE_STATES} values). */
  getState(): BundleState;
  /** Returns the bundle's manifest headers as key-value pairs. */
  getHeaders(locale?: string): Record<string, string>;
  /** Returns the location identifier used to install this bundle. */
  getLocation(): string;
  /** Starts the bundle, transitioning it through STARTING to ACTIVE. */
  start(options?: number): Promise<void>;
  /** Stops the bundle, transitioning it through STOPPING to RESOLVED. */
  stop(options?: number): Promise<void>;
  /** Updates the bundle with new content. */
  update(source?: ReadableStream): Promise<void>;
  /** Uninstalls the bundle from the framework. */
  uninstall(): Promise<void>;
  /** Returns all service references registered by this bundle. */
  getRegisteredServices(): ServiceReference<any>[];
  /** Returns all service references currently in use by this bundle. */
  getServicesInUse(): ServiceReference<any>[];
  /** Returns the {@link BundleContext} for this bundle. */
  getContext(): BundleContext;
  /** Returns the raw bundle module object, or null if not available. */
  getBundleModule(): BundleModule | null;
  /** Looks up a resource by logical path in this bundle (and its fragments). Returns the URL string or null. */
  getResource(path: string): string | null;
  /** Finds all resources matching a glob pattern under the given base path. */
  findResources(basePath: string, pattern: string): string[];
}

/**
 * The primary API for interacting with the Pandino framework from within a bundle.
 * Use it to register and discover services, install bundles, and listen for events.
 */
export interface BundleContext {
  /** Returns a framework property value by key. */
  getProperty(key: string): string | undefined;
  /** Returns this context's own bundle (no args) or a bundle by numeric id. */
  getBundle(): Bundle;
  getBundle(id: number): Bundle | null;
  /** Returns all installed bundles. */
  getBundles(): Bundle[];
  /** Installs a bundle from a module promise or location string. */
  installBundle(modulePromise: Promise<BundleModule>, config?: BundleConfiguration): Promise<Bundle>;
  installBundle(location: string, config?: BundleConfiguration): Promise<Bundle>;
  /**
   * Registers a service under one or more interface names. Other bundles can
   * discover it via {@link getServiceReference} or {@link getServiceReferences}.
   *
   * @param clazz - Interface name(s) or constructor under which to register.
   * @param service - The service instance.
   * @param properties - Optional metadata (e.g. `service.ranking`, custom keys).
   * @returns A registration handle to update properties or unregister.
   */
  registerService<S>(
    clazz: string | string[] | Function,
    service: S,
    properties?: Record<string, any>,
  ): ServiceRegistration<S>;
  /** Returns the highest-ranked service reference matching the given interface, or null. */
  getServiceReference<S>(clazz: string | Function): ServiceReference<S> | null;
  /** Returns all service references matching the interface and optional LDAP filter, or null. */
  getServiceReferences<S>(clazz: string | Function, filter?: string | null): ServiceReference<S>[] | null;
  /** Obtains the service object for the given reference. Call {@link ungetService} when done. */
  getService<S>(reference: ServiceReference<S>): S | null;
  /** Releases a service obtained via {@link getService}. Returns true if the reference was in use. */
  ungetService(reference: ServiceReference<any>): boolean;
  /** Registers a listener for service events, with an optional LDAP filter. */
  addServiceListener(listener: ServiceListener, filter?: string): void;
  /** Removes a previously registered service listener. */
  removeServiceListener(listener: ServiceListener): void;
  /** Registers a listener for bundle lifecycle events. */
  addBundleListener(listener: BundleListener): void;
  /** Removes a previously registered bundle listener. */
  removeBundleListener(listener: BundleListener): void;
  /** Parses an LDAP filter string into a {@link Filter} object for programmatic matching. */
  createFilter(filter: string): Filter;
  /** Returns a data file path scoped to this bundle. */
  getDataFile(filename: string): string;
  /** Returns the framework's built-in LogService, or null if not yet available. */
  getLogService(): LogService | null;
}

/**
 * Handle returned when a service is registered. Use it to update properties
 * or unregister the service.
 */
export interface ServiceRegistration<S> {
  /** Returns the {@link ServiceReference} for this registration. */
  getReference(): ServiceReference<S>;
  /** Replaces the service's metadata properties. Triggers MODIFIED events on listeners. */
  setProperties(properties: Record<string, any>): void;
  /** Removes the service from the registry. Triggers UNREGISTERING events. */
  unregister(): void;
}

/**
 * A reference to a registered service. Used to inspect service properties
 * and to obtain the actual service object via {@link BundleContext.getService}.
 */
// oxlint-disable-next-line no-unused-vars
export interface ServiceReference<S> {
  /** Returns a single property value by key. */
  getProperty(key: string): any;
  /** Returns all property keys for this service. */
  getPropertyKeys(): string[];
  /** Returns the bundle that registered this service. */
  getBundle(): Bundle;
  /** Checks whether the service can be assigned to the given class name in the context of the given bundle. */
  isAssignableTo(bundle: Bundle, className: string): boolean;
  /** Returns a copy of all properties for this service. */
  getProperties(): Record<string, any>;
}

/** Listener for service registry events (REGISTERED, MODIFIED, UNREGISTERING). */
export interface ServiceListener {
  /** Called when a service event occurs. */
  serviceChanged(event: ServiceEvent): void;
}

/** Listener for bundle lifecycle events. */
export interface BundleListener {
  /** Called when a bundle event occurs (started, stopped, installed, etc.). */
  bundleChanged(event: BundleEvent): void;
}

/** An LDAP filter for matching service properties programmatically. */
export interface Filter {
  /** Tests whether the given properties match this filter expression. */
  match(properties: Record<string, any>): boolean;
  /** Returns the LDAP filter string representation. */
  toString(): string;
}

export interface LdapFilterService {
  match(filter: string, properties: Record<string, any>): boolean;
  validateFilter(filter: string): boolean;
}

/** Emitted when a service is registered, modified, or unregistered. */
export class ServiceEvent {
  constructor(
    private type: ServiceEventType,
    private reference: ServiceReference<any>,
  ) {}

  /** Returns the event type (REGISTERED, MODIFIED, or UNREGISTERING). */
  getType(): ServiceEventType {
    return this.type;
  }

  /** Returns the reference to the service that triggered this event. */
  getServiceReference(): ServiceReference<any> {
    return this.reference;
  }
}

/** Emitted when a bundle's lifecycle state changes. */
export class BundleEvent {
  constructor(
    private type: number,
    private bundle: Bundle,
  ) {}

  /** Returns the event type. */
  getType(): number {
    return this.type;
  }

  /** Returns the bundle that triggered this event. */
  getBundle(): Bundle {
    return this.bundle;
  }
}

/**
 * Factory for creating per-bundle service instances. Register this instead of
 * a direct service object when each consuming bundle should get its own instance.
 */
export interface ServiceFactory<S> {
  /** Creates a service instance for the requesting bundle. */
  getService(bundle: Bundle, registration: ServiceRegistration<S>): S;
  /** Releases the service instance when the bundle is done. */
  ungetService(bundle: Bundle, registration: ServiceRegistration<S>, service: S): void;
}

/**
 * Processes resources contributed by fragment bundles and merges them
 * into the host bundle. Register as a service to handle custom resource types.
 */
export interface FragmentResourceProcessor {
  /** Returns the resource type this processor handles. */
  getResourceType(): string;
  /** Merges resources from the fragment into the host. Returns true if resources were processed. */
  processResources(host: Bundle, fragment: Bundle): boolean;
}
