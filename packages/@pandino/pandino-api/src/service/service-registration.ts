import { ServiceReference } from './service-reference';
import { ServiceProperties } from './service-properties';

/**
 * A registered service.
 *
 * <p>
 * The Framework returns a {@code ServiceRegistration} object when a {@code BundleContext.registerService} method
 * invocation is successful. The {@code ServiceRegistration} object is for the private use of the registering bundle and
 * should not be shared with other bundles.
 * <p>
 * The {@code ServiceRegistration} object may be used to update the properties of the service or to unregister the
 * service.
 *
 * @param <S> Type of Service.
 */
export interface ServiceRegistration<S> {
  /**
   * Returns a {@code ServiceReference} object for a service being registered.
   *
   * <p>
   * The {@code ServiceReference} object may be shared with other bundles.
   *
   * @returns {ServiceReference} object.
   */
  getReference(): ServiceReference<S>;

  /**
   * Returns a value for the requested {@code key} from the Registration's corresponding {@code ServiceProperties}
   * object.
   *
   * @param {string} key
   * @returns {any}
   */
  getProperty(key: string): any;

  /**
   * Returns an array of the keys in the properties {@code ServiceProperties} object of the service referenced by this
   * {@code ServiceRegistration} object.
   *
   * <p>
   * This method is <i>case-preserving </i>; this means that every key in the returned array must have the same case as
   * the corresponding key in the properties {@code ServiceProperties}.
   *
   * @returns {Array<string>} An array of property keys.
   */
  getPropertyKeys(): Array<string>;

  /**
   * Returns the {@code ServiceProperties} object registered with this {@code ServiceRegistration} object.
   *
   * @returns {ServiceProperties}
   */
  getProperties(): ServiceProperties;

  /**
   * Updates the properties associated with a service.
   *
   * <p>
   * The {@link OBJECTCLASS}, {@link SERVICE_BUNDLEID}, {@link SERVICE_ID} and {@link SERVICE_SCOPE} keys cannot be
   * modified by this method. These values are set by the Framework when the service is registered in the Pandino
   * environment.
   *
   * <p>
   * The following steps are required to modify service properties:
   * <ol>
   * <li>The service's properties are replaced with the provided properties.</li>
   * <li>A service event of type "MODIFIED" is fired.</li>
   * </ol>
   *
   * @param {ServiceProperties} properties The properties for this service. See {@link pandino-constants.ts} for a list
   *        of standard service property keys. Changes should not be made to this object after calling this method. To
   *        update the service's properties this method should be called again.
   */
  setProperties(properties: ServiceProperties): void;

  /**
   * Unregisters a service. Remove a {@code ServiceRegistration} object from the Framework service registry. All
   * {@code ServiceReference} objects associated with this {@code ServiceRegistration} object can no longer be used to
   * interact with the service once unregistration is complete.
   *
   * <p>
   * The following steps are required to unregister a service:
   * <ol>
   * <li>The service is removed from the Framework service registry so that it can no longer be obtained.</li>
   * <li>A service event of type "UNREGISTERING" is fired so that bundles using this service can release their use of
   * the service. Once delivery of the service event is complete, the {@code ServiceReference} objects for the service
   * may no longer be used to get a service object for the service.</li>
   * <li>For each bundle whose use count for this service is greater than
   * zero:
   * <ul>
   * <li>The bundle's use count for this service is set to zero.</li>
   * <li>If the service was registered with a {@link ServiceFactory} object, the {@code ServiceFactory.ungetService}
   * method is called to release the service object for the bundle.</li>
   * </ul>
   * </li>
   * </ol>
   */
  unregister(): void;
}
