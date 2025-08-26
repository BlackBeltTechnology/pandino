import type { ServiceReference } from '../../framework/interfaces';

/**
 * The ServiceTrackerCustomizer interface allows a ServiceTracker to customize
 * the service objects that are tracked. A ServiceTrackerCustomizer is called when
 * a service is being added to a ServiceTracker. The ServiceTrackerCustomizer can
 * then return an object for the tracked service. A ServiceTrackerCustomizer is
 * also called when a tracked service is modified or has been removed from a
 * ServiceTracker.
 */
export interface ServiceTrackerCustomizer<S, T> {
  addingService(reference: ServiceReference<S>, service: S): T | null;
  modifiedService(reference: ServiceReference<S>, service: S, tracked: T): void;
  removedService(reference: ServiceReference<S>, service: S, tracked: T): void;
}

export interface TrackedService<S, T> {
  reference: ServiceReference<S>;
  service: S | null;
  tracked: T | null;
}
