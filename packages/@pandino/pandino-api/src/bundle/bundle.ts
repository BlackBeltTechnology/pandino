import { BundleState } from './bundle-state';
import { BundleManifestHeaders } from './bundle-manifest-headers';
import { ServiceReference } from '../service';
import { BundleContext } from './bundle-context';
import { SemVer } from 'semver';

/**
 * An installed bundle in the Framework.
 *
 * <p>
 * A {@code Bundle} object is the access point to define the lifecycle of an installed bundle. Each bundle installed in
 * the Pandino environment must have an associated {@code Bundle} object.
 *
 * <p>
 * A bundle must have a unique identity, a {@code number}, chosen by the Framework. This identity must not change during
 * the lifecycle of a bundle, even when the bundle is updated. Uninstalling and then reinstalling the bundle must create
 * a new unique identity.
 *
 * <p>
 * A bundle can be in one of six states:
 * <ul>
 * <li>UNINSTALLED</li>
 * <li>INSTALLED</li>
 * <li>RESOLVED</li>
 * <li>STARTING</li>
 * <li>STOPPING</li>
 * <li>ACTIVE</li>
 * </ul>
 *
 * <p>
 * The Framework is the only entity that is allowed to create {@code Bundle} objects, and these objects are only valid
 * within the Framework that created them.
 *
 * <p>
 * Bundles have a natural ordering such that if two {@code Bundle}s have the same {@link #getBundleId() bundle id} they
 * are equal. A {@code Bundle} is less than another {@code Bundle} if it has a lower {@link #getBundleId() bundle id}
 * and is greater if it has a higher bundle id.
 */
export interface Bundle {
  /**
   * Returns this bundle's current state.
   *
   * <p>
   * A bundle can be in only one state at any time.
   *
   * @returns {BundleState}
   */
  getState(): BundleState;

  /**
   * Starts this bundle with no options.
   *
   * <p>
   * If this bundle's state is {@code UNINSTALLED} then an {@code Error} is thrown.
   *
   * @param {BundleState} [options]
   * @returns {Promise<void>}
   */
  start(options?: BundleState): Promise<void>;

  /**
   * Stops this bundle with no options.
   *
   * @param {BundleState} [options]
   * @returns {Promise<void>}
   */
  stop(options?: BundleState): Promise<void>;

  /**
   * Updates this bundle from a {@code BundleManifestHeaders} with or without an explicitly defined {@code Bundle}.
   *
   * @param {BundleManifestHeaders} headers
   * @param {Bundle} [bundle]
   * @returns {Promise<void>}
   */
  update(headers: BundleManifestHeaders, bundle?: Bundle): Promise<void>;

  /**
   * Uninstalls this bundle.
   *
   * <p>
   * This method causes the Framework to notify other bundles that this bundle is being uninstalled, and then puts this
   * bundle into the {@code UNINSTALLED} state. The Framework must remove any resources related to this bundle that it
   * is able to remove.
   *
   * @returns {Promise<void>}
   */
  uninstall(): Promise<void>;

  /**
   * Returns this bundle's Manifest headers and values. This method returns all the Manifest headers and values from the
   * main section of this bundle's Manifest file.
   *
   * <p>
   * Manifest header names are case-sensitive. The methods of the returned {@code BundleManifestHeaders} object must
   * operate on header names in a case-sensitive manner.
   *
   * <p>
   * For example, the following Manifest headers and values are included if they are present in the Manifest file:
   *
   * <pre>
   *     Bundle-Name
   *     Bundle-Vendor
   *     Bundle-Version
   *     Bundle-Description
   * </pre>
   *
   * @returns {BundleManifestHeaders}
   */
  getHeaders(): BundleManifestHeaders;

  /**
   * Returns this bundle's {@code ServiceReference} list for all services it has registered.
   *
   * <p>
   * The list is valid at the time of the call to this method, however, as the Framework is a very dynamic environment,
   * services can be modified or unregistered at anytime.
   *
   * @returns {Array<ServiceReference<any>>}
   */
  getRegisteredServices(): ServiceReference<any>[];

  /**
   * Returns this bundle's {@code ServiceReference} list for all services it is using. A bundle is considered to be
   * using a service if it has any unreleased service objects.
   *
   * <p>
   * The list is valid at the time of the call to this method, however, as the Framework is a very dynamic environment,
   * services can be modified or unregistered at anytime.
   *
   * @returns {Array<ServiceReference<any>>}
   */
  getServicesInUse(): ServiceReference<any>[];

  /**
   * Returns the symbolic name of this bundle as specified by its {@code Bundle-SymbolicName} manifest header.
   * The bundle symbolic name should be based on NPM Package naming convention with any number of appended paths
   * segments.
   *
   * <p>
   * This method must continue to return this bundle's symbolic name while this bundle is in the "UNINSTALLED" state.
   *
   * @returns {string}
   */
  getSymbolicName(): string;

  /**
   * Returns this bundle's {@link BundleContext}. The returned {@code BundleContext} can be used by the caller to act on
   * behalf of this bundle.
   *
   * <p>
   * If this bundle is not in the "STARTING", "ACTIVE", or "STOPPING" states, then this bundle has no valid
   * {@code BundleContext}. This method will return {@code undefined} if this bundle has no valid {@code BundleContext}.
   *
   * @returns {BundleContext}
   */
  getBundleContext(): BundleContext;

  /**
   * Returns the version of this bundle as specified by its {@code Bundle-Version} manifest header. If this bundle does
   * not have a specified version then a {@link SemVer} object created from "0.0.0" is returned.
   *
   * <p>
   * This method must continue to return this bundle's version while this bundle is in the "UNINSTALLED" state.
   *
   * @returns {SemVer}
   */
  getVersion(): SemVer;

  /**
   * Returns this bundle's unique identifier. This bundle is assigned a unique identifier by the Framework when it was
   * installed in the Pandino environment.
   *
   * @returns {number}
   */
  getBundleId(): number;

  /**
   * Utility method which returns a simple, but accurate representation of a {@link Bundle}
   *
   * @returns {string}
   */
  getUniqueIdentifier(): string;
}
