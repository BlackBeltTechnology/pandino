import { BundleReference } from './bundle-reference';
import { Bundle } from './bundle';
import { BundleManifestHeaders } from './bundle-manifest-headers';
import { ServiceListener, ServiceProperties, ServiceReference, ServiceRegistration } from '../service';
import { BundleListener } from './bundle-listener';
import { FrameworkListener } from '../framework';
import { FilterApi } from '../filter-api';

/**
 * A bundle's execution context within the Framework. The context is used to grant access to other methods so that this
 * bundle can interact with the Framework.
 *
 * <p>
 * {@code BundleContext} methods allow a bundle to:
 * <ul>
 * <li>Subscribe to events published by the Framework.</li>
 * <li>Register service objects with the Framework service registry.</li>
 * <li>Retrieve {@code ServiceReferences} from the Framework service registry.</li>
 * <li>Get and release service objects for a referenced service.</li>
 * <li>Install new bundles in the Framework.</li>
 * <li>Get the list of bundles installed in the Framework.</li>
 * <li>Get the {@link Bundle} object for a bundle.</li>
 * </ul>
 *
 * <p>
 * A {@code BundleContext} object will be created for a bundle when the bundle is started. The {@code Bundle} object
 * associated with a {@code BundleContext} object is called the <em>context bundle</em>.
 *
 * <p>
 * The {@code BundleContext} object will be passed to the {@link BundleActivator#start(BundleContext)} method during
 * activation of the context bundle. The same {@code BundleContext} object will be passed to the
 * {@link BundleActivator#stop(BundleContext)} method when the context bundle is stopped. A {@code BundleContext} object
 * is generally for the private use of its associated bundle and is not meant to be shared with other bundles in the
 * Pandino environment.
 *
 * <p>
 * The {@code BundleContext} object is only valid during the execution of its context bundle; that is, during the period
 * from when the context bundle is in the "STARTING", "STOPPING", and "ACTIVE" bundle states. However, the
 * {@code BundleContext} object becomes invalid after {@link BundleActivator#stop(BundleContext)} returns.
 * The {@code BundleContext} object becomes invalid before disposing of any remaining registered services and releasing
 * any remaining services in use. Since those activities can result in other bundles being called (for example,
 * {@link ServiceListener}s for "UNREGISTERING" events and {@link ServiceFactory}s for unget operations), those other
 * bundles can observe the stopping bundle in the {@code STOPPING} state but with an invalid {@code BundleContext}
 * object. If the {@code BundleContext} object is used after it has become invalid, an {@code Error} must be thrown. The
 * {@code BundleContext} object must never be reused after its context bundle is stopped.
 *
 * <p>
 * Two {@code BundleContext} objects are equal if they both refer to the same execution context of a bundle. The
 * Framework is the only entity that can create {@code BundleContext} objects and they are only valid within the
 * Framework that created them.
 */
export interface BundleContext extends BundleReference {
  /**
   * Returns the value of the specified property. If the key is not found in the Framework properties, the system
   * properties are then searched. The method returns {@code undefined} if the property is not found.
   *
   * @param {string} key The name of the requested property.
   * @returns {string} The value of the requested property, or {@code undefined} if the property is undefined.
   */
  getProperty(key: string): string;

  /**
   * Returns the {@code Bundle} object associated with this {@code BundleContext}. This bundle is called the context
   * bundle.
   *
   * @returns {Bundle} object associated with this {@code BundleContext}.
   */
  getBundle(id?: number): Bundle;

  /**
   * Returns a list of all installed bundles.
   * <p>
   * This method returns a list of all bundles installed in the Pandino environment at the time of the call to this
   * method. However, since the Framework is a very dynamic environment, bundles can be installed or uninstalled at
   * anytime.
   *
   * @returns {Array<Bundle>}, one object per installed bundle.
   */
  getBundles(): Bundle[];

  /**
   * Installs a bundle from the specified {@code InputStream} object.
   *
   * <p>
   * If the specified {@code locationOrHeaders} is a {@code string}, then the Framework will load the Manifest Headers
   * from that location. If the {@code locationOrHeaders} parameter is a {@code BundleManifestHeaders}, then the
   * Framework will process the headers immediately.
   *
   * <p>
   * The specified {@code locationOrHeaders} identifier will be used as the identity of the bundle. Every installed
   * bundle is uniquely identified by its location identifier which is typically in the form of a URL.
   *
   * <p>
   * The following steps are required to install a bundle:
   * <ol>
   * <li>If a bundle containing the same location identifier is already installed, the {@code Bundle} object for that
   * bundle is returned.</li>
   * <li>The bundle's content is read from the input stream. If this fails, a {@code Error} is thrown.</li>
   * <li>The bundle's state is set to "INSTALLED".</li>
   * <li>A bundle event of type "INSTALLED" is fired.</li>
   * <li>The {@code Bundle} object for the newly or previously installed bundle is returned.</li>
   * </ol>
   *
   * @param locationOrHeaders {string | BundleManifestHeaders} The location identifier of the bundle to install, or the
   *        actual headers.
   * @returns {Promise<Bundle>} of the installed bundle.
   */
  installBundle(locationOrHeaders: string | BundleManifestHeaders): Promise<Bundle>;

  /**
   * Adds the specified {@code ServiceListener} object with the specified {@code filter} to the context bundle's list of
   * listeners. See {@link FilterApi} for a description of the filter syntax. {@code ServiceListener} objects are
   * notified when a service has a lifecycle state change.
   *
   * <p>
   * If the context bundle's list of listeners already contains a listener {@code listener}, then this method replaces
   * that listener's filter (which may be {@code undefined}) with the specified one (which may be {@code undefined}).
   *
   * <p>
   * The listener is called if the filter criteria is met. To filter based upon the class of the service, the filter
   * should reference the {@link OBJECTCLASS} property. If {@code filter} is {@code undefined} , all services are
   * considered to match the filter.
   *
   * <p>
   * When using a {@code filter}, it is possible that the {@code ServiceEvent} s for the complete lifecycle of a service
   * will not be delivered to the listener. For example, if the {@code filter} only matches when the property {@code x}
   * has the value {@code 1}, the listener will not be called if the service is registered with the property {@code x}
   * not set to the value {@code 1}. Subsequently, when the service is modified setting property {@code x} to the value
   * {@code 1}, the filter will match and the listener will be called with a {@code ServiceEvent} of type
   * {@code MODIFIED}. Thus, the listener will not be called with a {@code ServiceEvent} of type {@code REGISTERED}.
   *
   * @param {ServiceListener} listener The {@code ServiceListener} object to be added.
   * @param {string} [filter] The filter criteria.
   */
  addServiceListener(listener: ServiceListener, filter?: string): void;

  /**
   * Removes the specified {@code ServiceListener} object from the context bundle's list of listeners.
   *
   * <p>
   * If {@code listener} is not contained in this context bundle's list of listeners, this method does nothing.
   *
   * @param {ServiceListener} listener The {@code ServiceListener} to be removed.
   */
  removeServiceListener(listener: ServiceListener): void;

  /**
   * Adds the specified {@code BundleListener} object to the context bundle's list of listeners if not already present.
   * BundleListener objects are notified when a bundle has a lifecycle state change.
   *
   * <p>
   * If the context bundle's list of listeners already contains a listener {@code l} such that {@code (l==listener)},
   * this method does nothing.
   *
   * @param {BundleListener} listener The {@code BundleListener} to be added.
   */
  addBundleListener(listener: BundleListener): void;

  /**
   * Removes the specified {@code BundleListener} object from the context bundle's list of listeners.
   *
   * <p>
   * If {@code listener} is not contained in the context bundle's list of listeners, this method does nothing.
   *
   * @param {BundleListener} listener The {@code BundleListener} object to be removed.
   */
  removeBundleListener(listener: BundleListener): void;

  /**
   * Adds the specified {@code FrameworkListener} object to the context bundle's list of listeners if not already
   * present. FrameworkListeners are notified of general Framework events.
   *
   * <p>
   * If the context bundle's list of listeners already contains a listener {@code l} such that {@code (l==listener)},
   * this method does nothing.
   *
   * @param {FrameworkListener} listener The {@code FrameworkListener} object to be added.
   */
  addFrameworkListener(listener: FrameworkListener): void;

  /**
   * Removes the specified {@code FrameworkListener} object from the context bundle's list of listeners.
   *
   * <p>
   * If {@code listener} is not contained in the context bundle's list of listeners, this method does nothing.
   *
   * @param {FrameworkListener} listener The {@code FrameworkListener} object to be removed.
   */
  removeFrameworkListener(listener: FrameworkListener): void;

  /**
   * Registers the specified service object with the specified properties under the specified class names into the
   * Framework. A {@code ServiceRegistration} object is returned. The {@code ServiceRegistration} object is for the
   * private use of the bundle registering the service and should not be shared with other bundles. The registering
   * bundle is defined to be the context bundle. Other bundles can locate the service by using one of the
   * {@link #getServiceReferences(string, string)},
   * {@link #getServiceReference(string)} methods.
   *
   * <p>
   * A bundle can register a service object that implements the {@link ServiceFactory} interface to have more
   * flexibility in providing service objects to other bundles.
   *
   * <p>
   * The following steps are required to register a service:
   * <ol>
   * <li>The Framework adds the following service properties to the service properties from the specified
   * {@code ServiceProperties} (which may be {@code null}):
   * <ul>
   * <li>A property named {@link SERVICE_ID} identifying the registration number of the service</li>
   * <li>A property named {@link OBJECTCLASS} containing all the specified classes.</li>
   * <li>A property named {@link SERVICE_SCOPE} identifying the scope of the service.</li>
   * <li>A property named {@link SERVICE_BUNDLEID} identifying the context bundle.</li>
   * </ul>
   * Properties with these names in the specified {@code ServiceProperties} will be ignored.</li>
   * <li>The service is added to the Framework service registry and may now be used by other bundles.</li>
   * <li>A service event of type "REGISTERED" is fired.</li>
   * <li>A {@code ServiceRegistration} object for this registration is returned.</li>
   * </ol>
   *
   * @param {string[] | string}identifiers The class identifier(s) under which the service can be located. The class
   *        names in this array will be stored in the service's properties under the key {@link OBJECTCLASS}.
   * @param {any} service The service object or an object implementing {@code ServiceFactory}.
   * @param {ServiceProperties} properties The properties for this service. The keys in the properties object must all
   *        be {@code string}. See {@link pandino-constants.ts} for a list of standard service property keys. Changes
   *        should not be made to this object after calling this method. To update the service's properties the
   *        {@link ServiceRegistration#setProperties(Dictionary)} method must be called. The set of properties may be
   *        {@code undefined} if the service has no properties.
   * @returns {ServiceRegistration<any>} object for use by the bundle registering the service to update the service's
   *          properties or to unregister the service.
   */
  registerService<S>(
    identifiers: string[] | string,
    service: S,
    properties?: ServiceProperties,
  ): ServiceRegistration<S>;

  /**
   * Returns a {@code ServiceReference} object for a service that implements and was registered under the specified class.
   *
   * <p>
   * The returned {@code ServiceReference} object is valid at the time of the call to this method. However as the
   * Framework is a very dynamic environment, services can be modified or unregistered at any time.
   *
   * <p>
   * This method is the same as calling {@link #getServiceReferences(String, String)} with a {@code undefined} filter
   * expression and then finding the reference with the highest priority. It is provided as a convenience for when the
   * caller is interested in any service that implements the specified class.
   * <p>
   * If multiple such services exist, the service with the highest priority is selected. This priority is defined as the
   * service reference with the highest ranking (as specified in its {@link SERVICE_RANKING} property) is returned.
   * <p>
   * If there is a tie in ranking, the service with the lowest service id (as specified in its
   * {@link SERVICE_ID} property); that is, the service that was registered first is returned.
   *
   * @param {string} identifier The class name with which the service was registered.
   * @returns A {@code ServiceReference} object, or {@code null} if no services
   *          are registered which implement the named class.
   */
  getServiceReference<S>(identifier: string): ServiceReference<S>;

  /**
   * Returns an array of {@code ServiceReference} objects. The returned array of {@code ServiceReference} objects
   * contains services that were registered under the specified class, match the specified filter expression.
   *
   * <p>
   * The list is valid at the time of the call to this method. However since the Framework is a very dynamic
   * environment, services can be modified or unregistered at any time.
   *
   * <p>
   * The specified {@code filter} expression is used to select the registered services whose service properties contain
   * keys and values which satisfy the filter expression. See {@link FilterApi} for a description of the filter syntax.
   * If the specified {@code filter} is {@code undefined}, all registered services are considered to match the filter.
   * If the specified {@code filter} expression cannot be parsed, an {@link Error} will be thrown with a human readable
   * message where the filter became unparsable.
   *
   * <p>
   * The result is an array of {@code ServiceReference} objects for all services that meet all of the following
   * conditions:
   * <ul>
   * <li>If the specified class name, {@code identifier}, is not {@code undefined}, the service must have been
   * registered with the specified class name. The complete list of class names with which a service was registered is
   * available from the service's {@link OBJECTCLASS objectClass} property.</li>
   * <li>If the specified {@code filter} is not {@code undefined}, the filter expression must match the service.</li>
   * </ul>
   *
   * @param {string} identifier The class name with which the service was registered or {@code undefined} for all services.
   * @param {string} filter The filter expression or {@code undefined} for all services.
   * @returns An array of {@code ServiceReference} objects or {@code null} if
   *          no services are registered which satisfy the search.
   */
  getServiceReferences<S>(identifier: string, filter?: string): ServiceReference<S>[];

  /**
   * Returns the service object for the service referenced by the specified {@code ServiceReference} object.
   *
   * <p>
   * A bundle's use of a service object obtained from this method is tracked by the bundle's use count of that service.
   * Each time the service object is returned by {@link #getService(ServiceReference)} the context bundle's use count
   * for the service is incremented by one. Each time the service object is released by
   * {@link #ungetService(ServiceReference)} the context bundle's use count for the service is decremented by one.
   *
   * <p>
   * When a bundle's use count for the service drops to zero, the bundle should no longer use the service object.
   *
   * <p>
   * This method will always return {@code undefined} when the service associated with the specified {@code reference}
   * has been unregistered.
   *
   * <p>
   * The following steps are required to get the service object:
   * <ol>
   * <li>If the service has been unregistered, {@code undefined} is returned.</li>
   * <li>If the context bundle's use count for the service is currently zero.</li>
   * <li>The context bundle's use count for the service is incremented by one.
   * </li>
   * <li>The service object for the service is returned.</li>
   * </ol>
   *
   * @param {ServiceReference<S>} reference A reference to the service.
   * @returns {S} A service object for the service associated with {@code reference}.
   */
  getService<S>(reference: ServiceReference<S>): S;

  /**
   * Releases the service object for the service referenced by the specified {@code ServiceReference} object. If the
   * context bundle's use count for the service is zero, this method returns {@code false}. Otherwise, the context
   * bundle's use count for the service is decremented by one.
   *
   * <p>
   * The service object must no longer be used and all references to it should be destroyed when a bundle's use count
   * for the service drops to zero.
   *
   * <p>
   * The following steps are required to release the service object:
   * <ol>
   * <li>If the context bundle's use count for the service is zero or the service has been unregistered, {@code false}
   * is returned.</li>
   * <li>The context bundle's use count for the service is decremented by one.
   * </li>
   * <li>{@code true} is returned.</li>
   * </ol>
   *
   * @param {ServiceReference<S>} reference A reference to the service to be released.
   * @returns {@code false} if the context bundle's use count for the service is zero or if the service has been
   *          unregistered; {@code true} otherwise.
   */
  ungetService<S>(reference: ServiceReference<S>): boolean;

  /**
   * Creates a {@code FilterApi} object. This {@code FilterApi} object may be used to match a {@code ServiceReference}
   * object or a {@code ServiceProperties} object.
   *
   * <p>
   * If the filter cannot be parsed, an {@link Error} will be thrown with a human readable message where the filter
   * became unparsable.
   *
   * @param {string} filter The filter string.
   * @returns {FilterApi} A {@code FilterApi} object encapsulating the filter string.
   */
  createFilter(filter: string): FilterApi;

  /**
   * An utility method abstracting the comparison functionality.
   *
   * @param {any} other
   * @returns {boolean}
   */
  equals(other: any): boolean;
}
