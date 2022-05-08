import { ServiceTrackerCustomizer } from './service-tracker-customizer';
import { ServiceReference } from './service-reference';

/**
 * The {@code ServiceTracker} class simplifies using services from the Framework's service registry.
 * <p>
 * A {@code ServiceTracker} object is constructed with search criteria and a {@code ServiceTrackerCustomizer} object.
 * A {@code ServiceTracker} can use a {@code ServiceTrackerCustomizer} to customize the service objects to be tracked.
 * The {@code ServiceTracker} can then be opened to begin tracking all services in the Framework's service registry that
 * match the specified search criteria. The {@code ServiceTracker} correctly handles all of the details of listening to
 * {@code ServiceEvent}s and getting and ungetting services.
 * <p>
 * The {@code getServiceReferences} method can be called to get references to the services being tracked. The
 * {@code getService} and {@code getServices} methods can be called to get the service objects for the tracked service.
 *
 * @param <S> The type of the service being tracked.
 * @param <T> The type of the tracked object.
 */
export interface ServiceTracker<S, T> extends ServiceTrackerCustomizer<S, T> {
  /**
   * Open this {@code ServiceTracker} and begin tracking services.
   *
   * <p>
   * Services which match the search criteria specified when this {@code ServiceTracker} was created are now tracked by
   * this {@code ServiceTracker}.
   */
  open(): void;

  /**
   * Close this {@code ServiceTracker}.
   *
   * <p>
   * This method should be called when this {@code ServiceTracker} should end the tracking of services.
   *
   * <p>
   * This implementation calls {@link #getServiceReferences()} to get the list of tracked services to remove.
   */
  close(): void;

  /**
   * Return an array of {@code ServiceReference}s for all services being tracked by this {@code ServiceTracker}.
   *
   * @return Array of {@code ServiceReference}s or {@code undefined} if no services are being tracked.
   */
  getServiceReferences(): Array<ServiceReference<S>>;

  /**
   * Returns a service object for one of the services being tracked by this {@code ServiceTracker}.
   *
   * <p>
   * If any services are being tracked, this implementation returns the result of calling
   * {@code getService(getServiceReference())}.
   *
   * @return A service object or {@code undefined} if no services are being tracked.
   */
  getService(): T | undefined;

  /**
   * Returns a {@code ServiceReference} for one of the services being tracked by this {@code ServiceTracker}.
   *
   * <p>
   * If multiple services are being tracked, the service with the highest ranking (as specified in its
   * {@code service.ranking} property) is returned. If there is a tie in ranking, the service with the lowest service id
   * (as specified in its {@code service.id} property); that is, the service that was registered first is returned. This
   * is the same algorithm used by {@code BundleContext.getServiceReference}.
   *
   * <p>
   * This implementation calls {@link #getServiceReferences()} to get the list of references for the tracked services.
   *
   * @return A {@code ServiceReference} or {@code undefined} if no services are being tracked.
   */
  getServiceReference(): ServiceReference<S> | undefined;

  /**
   * Return an array of service objects for all services being tracked by this {@code ServiceTracker}.
   *
   * <p>
   * This implementation calls {@link #getServiceReferences()} to get the list of references for the tracked services
   * and then calls {@link #getService(ServiceReference)} for each reference to get the tracked service object.
   *
   * @return An array of service objects or {@code []]} if no services are being tracked.
   */
  getServices(): Array<T>;

  /**
   * Remove a service from this {@code ServiceTracker}.
   *
   * The specified service will be removed from this {@code ServiceTracker}. If the specified service was being tracked
   * then the {@code ServiceTrackerCustomizer.removedService} method will be called for that service.
   *
   * @param reference The reference to the service to be removed.
   */
  remove(reference: ServiceReference<S>): void;

  /**
   * Return the number of services being tracked by this {@code ServiceTracker}.
   *
   * @return The number of services being tracked.
   */
  size(): number;

  /**
   * Returns the tracking count for this {@code ServiceTracker}.
   *
   * The tracking count is initialized to 0 when this {@code ServiceTracker} is opened. Every time a service is added,
   * modified or removed from this {@code ServiceTracker}, the tracking count is incremented.
   *
   * <p>
   * The tracking count can be used to determine if this {@code ServiceTracker} has added, modified or removed a service
   * by comparing a tracking count value previously collected with the current tracking count value. If the value has
   * not changed, then no service has been added, modified or removed from this {@code ServiceTracker} since the
   * previous tracking count was collected.
   *
   * @return The tracking count for this {@code ServiceTracker} or -1 if this {@code ServiceTracker} is not open.
   */
  getTrackingCount(): number;

  /**
   * Return if this {@code ServiceTracker} is empty.
   *
   * @return {@code true} if this {@code ServiceTracker} is not tracking any services.
   */
  isEmpty(): boolean;
}
