import type { ServiceRegistration } from './service-registration';
import type { Bundle } from '../bundle';
import type { SERVICE_FACTORY_TYPE } from '../pandino-constants';

/**
 * A factory for {@link SCOPE_BUNDLE bundle scope} services. The factory can provide service objects customized for each
 * bundle in the Pandino environment.
 *
 * <p>
 * When registering a service, a {@code ServiceFactory} object can be used instead of a service object, so that the
 * bundle developer can create a customized service object for each bundle that is using the service.
 *
 * <p>
 * When a bundle {@link BundleContext#getService(ServiceReference) requests} the service object, the framework calls the
 * {@link #getService(Bundle, ServiceRegistration) getService} method to return a service object customized for the
 * requesting bundle. The returned service object is cached by the Framework for subsequent calls to
 * {@link BundleContext#getService(ServiceReference)} until the bundle releases its use of the service.
 *
 * <p>
 * When the bundle's use count for the service is {@link BundleContext#ungetService(ServiceReference) decremented} to
 * zero (including the bundle stopping or the service being unregistered), the framework will call the
 * {@link #ungetService(Bundle, ServiceRegistration, Object) ungetService} method.
 *
 * @param <S> Type of Service
 */

export interface ServiceFactory<S> {
  factoryType: SERVICE_FACTORY_TYPE;

  /**
   * Returns a service object for a bundle.
   *
   * <p>
   * The Framework invokes this method the first time the specified {@code bundle} requests a service object using the
   * {@link BundleContext#getService(ServiceReference)} method. The factory can then return a customized service object
   * for each bundle.
   *
   * <p>
   * The Framework must check that the returned service object is valid. If the returned service object is
   * {@code undefined} or is not an {@code instanceof} all the classes named when the service was registered,
   * a framework event of type {@link ERROR} is fired containing a service Error and {@code undefined} is returned to
   * the bundle. If this method throws an Error, a framework event of type {@link ERROR} is fired containing a service
   * Error of type {@link FACTORY_EXCEPTION} with the thrown error as the cause and {@code undefined} is returned to the
   * bundle. If this method is recursively called for the specified bundle, a framework event of type
   * {@link ERROR} is fired containing a service Error of type {@link FACTORY_RECURSION} and {@code undefined} is
   * returned to the bundle.
   *
   * <p>
   * The Framework caches the valid service object and will return the same service object on any future call to
   * {@link BundleContext#getService(ServiceReference)} for the specified bundle.
   *
   * @param bundle The bundle requesting the service.
   * @param registration The {@code ServiceRegistration} object for the requested service.
   * @return A service object that <strong>must</strong> be an instance of all the classes named when the service was
   *         registered.
   */
  getService(bundle: Bundle, registration: ServiceRegistration<S>): S;

  /**
   * Releases a service object customized for a bundle.
   *
   * <p>
   * The Framework invokes this method when a service has been released by a bundle. The service object may then be
   * destroyed.
   *
   * <p>
   * If this method throws an exception, a framework event of type {@link ERROR} is fired containing a service Error of
   * type {@link FACTORY_EXCEPTION} with the thrown error as the cause.
   *
   * @param bundle The bundle releasing the service.
   * @param registration The {@code ServiceRegistration} object for the service being released.
   * @param service The service object returned by a previous call to the
   *        {@link #getService(Bundle, ServiceRegistration) getService} method.
   */
  ungetService(bundle: Bundle, registration: ServiceRegistration<S>, service: S): void;
}
