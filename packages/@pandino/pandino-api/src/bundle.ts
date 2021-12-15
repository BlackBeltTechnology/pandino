import { FrameworkEventType, FrameworkListener } from './framework';
import { FilterApi } from './filter';
import {
  BUNDLE_ACTIVATIONPOLICY,
  BUNDLE_ACTIVATOR,
  BUNDLE_DESCRIPTION,
  BUNDLE_MANIFESTVERSION,
  BUNDLE_NAME,
  BUNDLE_SYMBOLICNAME,
  BUNDLE_VENDOR,
  BUNDLE_VERSION,
} from './pandino-constants';
import { Capability, Requirement, Resource } from './resource';
import { SemVer } from 'semver';

export type BundleState =
  | 'INSTALLED'
  | 'RESOLVED'
  | 'STARTING'
  | 'ACTIVE'
  | 'STOPPING'
  | 'UNINSTALLED'
  | 'START_TRANSIENT';

export type BundleEventType =
  | 'INSTALLED'
  | 'STARTED'
  | 'STOPPED'
  | 'UPDATED'
  | 'UNINSTALLED'
  | 'RESOLVED'
  | 'UNRESOLVED'
  | 'STARTING'
  | 'STOPPING'
  | 'LAZY_ACTIVATION';

export interface BundleManifestHeaders {
  [BUNDLE_MANIFESTVERSION]?: string;
  [BUNDLE_SYMBOLICNAME]: string;
  [BUNDLE_VERSION]?: string;
  [BUNDLE_ACTIVATOR]?: string | BundleActivator;
  [BUNDLE_ACTIVATIONPOLICY]?: ActivationPolicy;
  [BUNDLE_NAME]?: string;
  [BUNDLE_DESCRIPTION]?: string;
  [BUNDLE_VENDOR]?: string;
  [key: string]: any;
}

export type BundleConfigMap = Record<string, any>;

export interface Bundle {
  getState(): BundleState;
  start(options?: BundleState): Promise<void>;
  stop(options?: BundleState): Promise<void>;
  update(headers: BundleManifestHeaders, bundle?: Bundle): Promise<void>;
  uninstall(): Promise<void>;
  getHeaders(): BundleManifestHeaders;
  // getRegisteredServices(): ServiceReference<any>[];
  // getServicesInUse(): ServiceReference<any>[];
  getSymbolicName(): string;
  getBundleContext(): BundleContext;
  getVersion(): SemVer;
  getUniqueIdentifier(): string;
  getBundleId(): number;
}

export interface BundleActivator {
  start(context: BundleContext): Promise<void>;
  stop(context: BundleContext): Promise<void>;
}

export interface BundleContext extends BundleReference {
  getProperty(key: string): string;
  getBundle(): Bundle;
  getBundle(id: number): Bundle;
  getBundles(): Bundle[];
  installBundle(locationOrHeaders: string | BundleManifestHeaders): Promise<Bundle>;
  // addServiceListener(listener: ServiceListener, filter: string): void;
  // removeServiceListener(listener: ServiceListener): void;
  addBundleListener(listener: BundleListener): void;
  removeBundleListener(listener: BundleListener): void;
  addFrameworkListener(listener: FrameworkListener): void;
  removeFrameworkListener(listener: FrameworkListener): void;
  // registerService<S>(clazz: string[] | string, service: S, properties: ServiceProperties): ServiceRegistration<S>;
  // getServiceReference<S>(clazz: string, filter?: string): ServiceReference<S>;
  // getService<S>(reference: ServiceReference<S>): S;
  // ungetService<S>(reference: ServiceReference<S>): Promise<boolean>;
  createFilter(filter: string): FilterApi;
  equals(other: any): boolean;
}

export interface BundleReference {
  getBundle(): Bundle;
}

export interface BundleListener {
  bundleChanged(event: BundleEvent): void;
}

export interface BundleEvent {
  getBundle(): Bundle;
  getType(): BundleEventType | FrameworkEventType;
  getOrigin(): Bundle;
}

/**
 * A capability that has been declared from a {@link BundleRevision bundle
 * revision}.
 */
export interface BundleCapability extends Capability {
  getNamespace(): string;
  getDirectives(): Record<string, string>;
  getAttributes(): Record<string, any>;
  getRevision(): BundleRevision;
  getResource(): BundleRevision;
}

/**
 * A requirement that has been declared from a {@link BundleRevision bundle
 * revision}.
 */
export interface BundleRequirement extends Requirement {
  matches(capability: BundleCapability): boolean;
  getNamespace(): string;
  getDirectives(): Record<string, string>;
  getAttributes(): Record<string, any>;
  getRevision(): BundleRevision;
  getResource(): BundleRevision;
}

/**
 * Bundle Revision. When a bundle is installed and each time a bundle is
 * updated, a new bundle revision of the bundle is created. Since a bundle
 * update can change the entries in a bundle, different bundle wirings for the
 * same bundle can be associated with different bundle revisions.
 */
export interface BundleRevision extends BundleReference, Resource {
  getSymbolicName(): string;
  getVersion(): SemVer;
  getDeclaredCapabilities(namespace: string): BundleCapability[];
  getDeclaredRequirements(namespace: string): BundleRequirement[];
  getWiring(): BundleWiring;
  getCapabilities(namespace: string): Capability[];
  getRequirements(namespace: string): Requirement[];
}

export type ActivationPolicy = 'EAGER_ACTIVATION' | 'LAZY_ACTIVATION';

/**
 * A wire connecting a {@link BundleCapability} to a {@link BundleRequirement}.
 */
export interface BundleWire {
  getCapability(): BundleCapability;
  getRequirement(): BundleRequirement;
  getProvider(): BundleRevision;
  getRequirer(): BundleRevision;
}

/**
 * A wiring for a bundle. Each time a bundle is resolved, a new bundle wiring
 * for the bundle is created. A bundle wiring is associated with a bundle
 * revision and represents the dependencies with other bundle wirings.
 *
 * <p>
 * The bundle wiring for a bundle is the {@link #isCurrent() current} bundle
 * wiring if it is the most recent bundle wiring for the current bundle
 * revision. A bundle wiring is {@link #isInUse() in use} if it is the current
 * bundle wiring or if some other in use bundle wiring is dependent upon it. For
 * example, another bundle wiring is wired to a capability provided by the
 * bundle wiring. An in use bundle wiring for a non-fragment bundle has a class
 * loader. All bundles with non-current, in use bundle wirings are considered
 * removal pending. Once a bundle wiring is no longer in use, it is considered
 * stale and is discarded by the framework.
 */
export interface BundleWiring {
  isInUse(): boolean;
  getCapabilities(namespace: string): BundleCapability[];
  getRequirements(namespace: string): BundleRequirement[];
  getProvidedWires(namespace: string): BundleWire[];
  getRequiredWires(namespace: string): BundleWire[];
  getRevision(): BundleRevision;
}
