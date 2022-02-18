import { ServiceReference } from './service-reference';

/**
 * The {@code ServiceTrackerCustomizer} interface allows a {@code ServiceTracker} to customize the service objects that
 * are tracked. A {@code ServiceTrackerCustomizer} is called when a service is being added to a {@code ServiceTracker}.
 * The {@code ServiceTrackerCustomizer} can then return an object for the tracked service. A
 * {@code ServiceTrackerCustomizer} is also called when a tracked service is modified or has been removed from a
 * {@code ServiceTracker}.
 *
 * <p>
 * The methods in this interface may be called as the result of a {@code ServiceEvent} being received by a
 * {@code ServiceTracker}. Since {@code ServiceEvent}s are synchronously delivered by the Framework, it is highly
 * recommended that implementations of these methods do not register ( {@code BundleContext.registerService}), modify (
 * {@code ServiceRegistration.setProperties}) or unregister ({@code ServiceRegistration.unregister}) a service while
 * being synchronized on any object.
 */
export interface ServiceTrackerCustomizer<S, T> {
  /**
   * A service is being added to the {@code ServiceTracker}.
   *
   * <p>
   * This method is called before a service which matched the search parameters of the {@code ServiceTracker} is added
   * to the {@code ServiceTracker}. This method should return the service object to be tracked for the specified
   * {@code ServiceReference}. The returned service object is stored in the {@code ServiceTracker} and is available
   * from the {@code getService} and {@code getServices} methods.
   */
  addingService(reference: ServiceReference<S>): T;

  /**
   * A service tracked by the {@code ServiceTracker} has been modified.
   *
   * <p>
   * This method is called when a service being tracked by the {@code ServiceTracker} has had it properties modified.
   */
  modifiedService(reference: ServiceReference<S>, service: T): void;

  /**
   * A service tracked by the {@code ServiceTracker} has been removed.
   *
   * <p>
   * This method is called after a service is no longer being tracked by the {@code ServiceTracker}.
   */
  removedService(reference: ServiceReference<S>, service: T): void;
}
