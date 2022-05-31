import { ServiceFactory } from './service-factory';
import { Bundle } from '../bundle';
import { ServiceRegistration } from './service-registration';

/**
 * A factory for {@link Constants#SCOPE_PROTOTYPE prototype scope} services. The
 * factory can provide multiple, customized service objects in the OSGi
 * environment.
 *
 * <p>
 * When registering a service, a {@code PrototypeServiceFactory} object can be
 * used instead of a service object, so that the bundle developer can create a
 * customized service object for each caller that is using the service.
 *
 * <p>
 * When a caller uses a {@link ServiceObjects} to
 * {@link ServiceObjects#getService() request} a service object, the framework
 * calls the {@link #getService(Bundle, ServiceRegistration) getService} method
 * to return a service object customized for the requesting caller. The caller
 * can {@link ServiceObjects#ungetService(Object) release} the returned service
 * object and the framework will call the
 * {@link #ungetService(Bundle, ServiceRegistration, Object) ungetService}
 * method with the service object.
 *
 * <p>
 * When a bundle uses the {@link BundleContext#getService(ServiceReference)}
 * method to obtain a service object, the framework must act as if the service
 * has {@link Constants#SCOPE_BUNDLE bundle scope}. That is, the framework will
 * call the {@link #getService(Bundle, ServiceRegistration) getService} method
 * to obtain a bundle-scoped service object which will be cached and have a use
 * count. See {@link ServiceFactory}.
 *
 * <p>
 * A bundle can use both {@link ServiceObjects} and
 * {@link BundleContext#getService(ServiceReference)} to obtain a service object
 * for a service. {@link ServiceObjects#getService()} will always return a
 * service object provided by a call to
 * {@link #getService(Bundle, ServiceRegistration)} and
 * {@link BundleContext#getService(ServiceReference)} will always return the
 * bundle-scoped service object.
 *
 * <p>
 * {@code PrototypeServiceFactory} objects are only used by the Framework and
 * are not made available to other bundles in the OSGi environment. The
 * Framework may concurrently call a {@code PrototypeServiceFactory}.
 *
 * @param <S> Type of Service
 */
export interface PrototypeServiceFactory<S> extends ServiceFactory<S> {
  /**
   * Returns a service object for a caller.
   *
   * <p>
   * The Framework invokes this method for each caller requesting a service
   * object using {@link ServiceObjects#getService()}. The factory can then
   * return a customized service object for the caller.
   *
   * <p>
   * The Framework must check that the returned service object is valid. If
   * the returned service object is {@code null} or is not an
   * {@code instanceof} all the classes named when the service was registered,
   * a framework event of type {@link FrameworkEvent#ERROR} is fired
   * containing a service exception of type
   * {@link ServiceException#FACTORY_ERROR} and {@code null} is returned to
   * the caller. If this method throws an exception, a framework event of type
   * {@link FrameworkEvent#ERROR} is fired containing a service exception of
   * type {@link ServiceException#FACTORY_EXCEPTION} with the thrown exception
   * as the cause and {@code null} is returned to the caller.
   *
   * @param bundle The bundle requesting the service.
   * @param registration The {@code ServiceRegistration} object for the
   *        requested service.
   * @return A service object that <strong>must</strong> be an instance of all
   *         the classes named when the service was registered.
   */
  getService(bundle: Bundle, registration: ServiceRegistration<S>): S;

  /**
   * Releases a service object customized for a caller.
   *
   * <p>
   * The Framework invokes this method when a service has been released by a
   * bundle such as by calling {@link ServiceObjects#ungetService(Object)}.
   * The service object may then be destroyed.
   *
   * <p>
   * If this method throws an exception, a framework event of type
   * {@link FrameworkEvent#ERROR} is fired containing a service exception of
   * type {@link ServiceException#FACTORY_EXCEPTION} with the thrown exception
   * as the cause.
   *
   * @param bundle The bundle releasing the service.
   * @param registration The {@code ServiceRegistration} object for the
   *        service being released.
   * @param service The service object returned by a previous call to the
   *        {@link #getService(Bundle, ServiceRegistration) getService}
   *        method.
   */
  ungetService(bundle: Bundle, registration: ServiceRegistration<S>, service: S): void;
}
