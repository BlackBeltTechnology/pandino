import { ServiceReference } from './service-reference';

/**
 * The {@code ServiceTrackerCustomizer} interface allows a {@code ServiceTracker} to customize the service objects that
 * are tracked. A {@code ServiceTrackerCustomizer} is called when a service is being added to a {@code ServiceTracker}.
 * The {@code ServiceTrackerCustomizer} can then return an object for the tracked service. A
 * {@code ServiceTrackerCustomizer} is also called when a tracked service is modified or has been removed from a
 * {@code ServiceTracker}.
 *
 * @param <S> The type of the service being tracked.
 * @param <T> The type of the tracked object.
 */
export interface ServiceTrackerCustomizer<S, T> {
  /**
   * A service is being added to the {@code ServiceTracker}.
   *
   * <p>
   * This method is called before a service which matched the search parameters of the {@code ServiceTracker} is added
   * to the {@code ServiceTracker}. This method should return the service object to be tracked for the specified
   * {@code ServiceReference}. The returned service object is stored in the {@code ServiceTracker} and is available from
   * the {@code getService} and {@code getServices} methods.
   *
   * @param reference The reference to the service being added to the {@code ServiceTracker}.
   * @return The service object to be tracked for the specified referenced service or {@code null} if the specified
   *         referenced service should not be tracked.
   */
  addingService(reference: ServiceReference<S>): T;

  /**
   * A service tracked by the {@code ServiceTracker} has been modified.
   *
   * <p>
   * This method is called when a service being tracked by the {@code ServiceTracker} has had it properties modified.
   *
   * @param reference The reference to the service that has been modified.
   * @param service The service object for the specified referenced service.
   */
  modifiedService(reference: ServiceReference<S>, service: T): void;

  /**
   * A service tracked by the {@code ServiceTracker} has been removed.
   *
   * <p>
   * This method is called after a service is no longer being tracked by the {@code ServiceTracker}.
   *
   * @param reference The reference to the service that has been removed.
   * @param service The service object for the specified referenced service.
   */
  removedService(reference: ServiceReference<S>, service: T): void;
}
