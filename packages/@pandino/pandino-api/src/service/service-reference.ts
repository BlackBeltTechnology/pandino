import { BundleReference } from '../bundle/bundle-reference';
import { Bundle } from '../bundle/bundle';
import { ServiceProperties } from './service-properties';

/**
 * A reference to a service.
 *
 * <p>
 * The Framework returns {@code ServiceReference} objects from the {@code BundleContext.getServiceReference} and
 * {@code BundleContext.getServiceReferences} methods.
 *
 * <p>
 * A {@code ServiceReference} object may be shared between bundles and can be used to examine the properties of the
 * service and to get the service object.
 *
 * <p>
 * Every service registered in the Framework has a unique {@code ServiceRegistration} object and may have multiple,
 * distinct {@code ServiceReference} objects referring to it. {@code ServiceReference} objects associated with a
 * {@code ServiceRegistration} object are considered equal (more specifically, their {@code compareTo()} method will
 * return {@code 0} when compared).
 *
 * <p>
 * If the same service object is registered multiple times, {@code ServiceReference} objects associated with different
 * {@code ServiceRegistration} objects are not equal.
 *
 * @param <S> Type of Service.
 */
export interface ServiceReference<S> extends BundleReference {
  /**
   * Returns the property value to which the specified property key is mapped in the properties
   * {@code ServiceProperties} object of the service referenced by this {@code ServiceReference} object.
   *
   * <p>
   * Property keys are case-sensitive.
   *
   * <p>
   * This method must continue to return property values after the service has been unregistered. This is so references
   * to unregistered services (for example, {@code ServiceReference} objects stored in the log) can still be
   * interrogated.
   *
   * @param {string} key The property key.
   * @returns {any} The property value to which the key is mapped; {@code null} if there is no property named after the
   *          key.
   */
  getProperty(key: string): any;

  /**
   * Returns an array of the keys in the properties {@code ServiceProperties} object of the service referenced by this
   * {@code ServiceReference} object.
   *
   * <p>
   * This method will continue to return the keys after the service has been unregistered. This is so references to
   * unregistered services (for example, {@code ServiceReference} objects stored in the log) can still be interrogated.
   *
   * <p>
   * This method is <i>case-preserving </i>; this means that every key in the returned array must have the same case as
   * the corresponding key in the properties {@code ServiceProperties}.
   *
   * @returns {Array<string>} An array of property keys.
   */
  getPropertyKeys(): Array<string>;

  /**
   * Returns the bundle that registered the service referenced by this {@code ServiceReference} object.
   *
   * <p>
   * This method must return {@code undefined} when the service has been unregistered. This can be used to determine if
   * the service has been unregistered.
   *
   * @returns {Bundle} The bundle that registered the service referenced by this {@code ServiceReference} object;
   *          {@code undefined} if that service has already been unregistered.
   */
  getBundle(): Bundle;

  /**
   * Returns the bundles that are using the service referenced by this {@code ServiceReference} object. Specifically,
   * this method returns the bundles whose usage count for that service is greater than zero.
   *
   * @returns {Array<Bundle>} An array of bundles whose usage count for the service referenced by this
   *          {@code ServiceReference} object is greater than zero; {@code undefined} if no bundles are currently using
   *          that service.
   */
  getUsingBundles(): Bundle[];

  /**
   * Returns a copy of the properties of the service referenced by this {@code ServiceReference} object.
   *
   * <p>
   * This method will continue to return the properties after the service has been unregistered. This is so references
   * to unregistered services (for example, {@code ServiceReference} objects stored in the log) can still be
   * interrogated.
   *
   * <p>
   * The returned {@code ServiceProperties} object:
   * <ul>
   * <li>Must map property values by using property keys in a
   * <i>case-sensitive manner</i>.</li>
   * <li>Must return property keys is a <i>case-preserving</i> manner. This means that the keys must have the same case
   * as the corresponding key in the properties {@code ServiceProperties} that was passed to the
   * {@link BundleContext#registerService(String[],any,ServiceProperties)} or
   * {@link ServiceRegistration#setProperties(ServiceProperties)} methods.</li>
   * <li>Is the property of the caller and can be modified by the caller but any changes are not reflected in the
   * properties of the service. {@link ServiceRegistration#setProperties(ServiceProperties)} must be called to modify
   * the properties of the service.</li>
   * </ul>
   *
   * @return {ServiceProperties} A copy of the properties of the service referenced by this {@code ServiceReference}
   *         object
   */
  getProperties(): ServiceProperties;

  /**
   * Tests if the bundle that registered the service referenced by this
   * {@code ServiceReference} and the specified bundle use the same source for the package of the specified className.
   * <p>
   * This method performs the following checks:
   * <ol>
   * <li>If the specified bundle is equal to the bundle that registered the service referenced by this
   * {@code ServiceReference} (registrant bundle) return {@code true}.</li>
   * <li>For the registrant bundle; find the source for the package. If the package source is found then return
   * {@code true} if the package source equals the package source of the specified bundle; otherwise return
   * {@code false}.</li>
   * <li>If no package source is found for the registrant bundle then determine the package source based on the service
   * object. If the service object is a {@code ServiceFactory} and the factory implementation is not from the registrant
   * bundle return {@code true}; otherwise attempt to find the package source based on the service object class. If the
   * package source is found and is equal to package source of the specified bundle
   * return {@code true}; otherwise return {@code false}.</li>
   * </ol>
   *
   * @param {Bundle} bundle The {@code Bundle} object to check.
   * @param {string} className The class name to check.
   * @returns {@code true} if the bundle which registered the service
   *          referenced by this {@code ServiceReference} and the specified
   *          bundle use the same source for the package of the specified class
   *          name. Otherwise {@code false} is returned.
   */
  isAssignableTo(bundle: Bundle, className: string): boolean;

  /**
   * Compares this {@code ServiceReference} with the specified {@code ServiceReference} for order.
   *
   * <p>
   * If this {@code ServiceReference} and the specified {@code ServiceReference} have the same
   * {@link SERVICE_ID service id} they are equal. This {@code ServiceReference} is less than the specified
   * {@code ServiceReference} if it has a lower {@link SERVICE_RANKING service ranking} and greater if it has a higher
   * service ranking. Otherwise, if this {@code ServiceReference} and the specified {@code ServiceReference} have the
   * same {@link SERVICE_RANKING service ranking}, this {@code ServiceReference} is less than the specified
   * {@code ServiceReference} if it has a higher {@link SERVICE_ID service id} and greater if it has a lower service id.
   *
   * @param {ServiceReference<any>} other The {@code ServiceReference} to be compared.
   */
  compareTo(other: ServiceReference<any>): number;

  /**
   * Checks whether the ServiceReference has been defined for the given objectClass.
   *
   * @param {string} objectClass
   */
  hasObjectClass(objectClass: string): boolean;
}
