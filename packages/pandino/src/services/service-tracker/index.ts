import type {
  BundleContext,
  Filter,
  ServiceEvent,
  ServiceListener,
  ServiceReference,
} from '../../framework/interfaces';
import type { ServiceTrackerCustomizer, TrackedService } from './interfaces';
import { SERVICE_EVENT_TYPES } from '../../types/constants';
export { default } from './bundle';

export class ServiceTracker<S, T = S> implements ServiceListener {
  private readonly className?: string;
  private context: BundleContext;
  private reference?: ServiceReference<S>;
  private readonly filter: Filter | null = null;
  private readonly customizer: ServiceTrackerCustomizer<S, T> | null = null;
  private isOpen = false;
  private trackedServices = new Map<ServiceReference<S>, TrackedService<S, T>>();
  private trackingCount = -1;
  private waiters: Array<(value: T | null) => void> = [];

  constructor(
    context: BundleContext,
    referenceOrClassNameOrFilter: ServiceReference<S> | string | Function | Filter,
    customizer?: ServiceTrackerCustomizer<S, T>,
  ) {
    this.context = context;
    this.customizer = customizer || null;

    // Determine the tracking approach based on the type of the second parameter
    if (typeof referenceOrClassNameOrFilter === 'object' && 'getProperty' in referenceOrClassNameOrFilter) {
      // It's a ServiceReference
      this.reference = referenceOrClassNameOrFilter as ServiceReference<S>;
      const interfaceName = this.reference.getProperty('objectClass');
      this.filter = this.context.createFilter(`(objectClass=${interfaceName})`);
    } else if (typeof referenceOrClassNameOrFilter === 'object' && 'match' in referenceOrClassNameOrFilter) {
      // It's a Filter
      this.filter = referenceOrClassNameOrFilter as Filter;
    } else {
      // It's a class name or function
      this.className =
        typeof referenceOrClassNameOrFilter === 'string'
          ? referenceOrClassNameOrFilter
          : (referenceOrClassNameOrFilter as Function).name;
      this.filter = this.context.createFilter(`(objectClass=${this.className})`);
    }
  }

  open(): ServiceTracker<S, T> {
    if (this.isOpen) {
      return this;
    }

    this.isOpen = true;
    this.trackingCount = 0;

    // Add service listener
    this.context.addServiceListener(this);

    // Get initial services
    const references = this.context.getServiceReferences<S>(this.className || '*', this.filter?.toString() || null);
    if (references) {
      for (const reference of references) {
        this.trackService(reference);
      }
    }

    return this;
  }

  close(): void {
    if (!this.isOpen) {
      return;
    }

    this.isOpen = false;
    this.trackingCount = -1;

    // Resolve any pending waiters so their promises do not hang forever.
    const pendingWaiters = this.waiters.splice(0);
    for (const waiter of pendingWaiters) {
      waiter(null);
    }

    // Remove service listener
    this.context.removeServiceListener(this);

    // Remove all tracked services
    const trackedServicesCopy = new Map(this.trackedServices);
    this.trackedServices.clear();

    // Call removedService for each tracked service
    for (const [reference, tracked] of trackedServicesCopy.entries()) {
      if (tracked.service && tracked.tracked) {
        this.removedService(reference, tracked.service, tracked.tracked);
      }
    }
  }

  getService(reference?: ServiceReference<S>): T | null {
    if (reference) {
      const tracked = this.trackedServices.get(reference);
      return tracked ? tracked.tracked : null;
    } else {
      const references = this.getServiceReferences();
      if (!references || references.length === 0) {
        return null;
      }
      const tracked = this.trackedServices.get(references[0]);
      return tracked ? tracked.tracked : null;
    }
  }

  getServices(): T[] {
    const result: T[] = [];
    for (const tracked of this.trackedServices.values()) {
      if (tracked.tracked !== null) {
        result.push(tracked.tracked);
      }
    }
    return result;
  }

  getServiceReferences(): ServiceReference<S>[] | null {
    if (this.trackedServices.size === 0) {
      return null;
    }

    const references = Array.from(this.trackedServices.keys());

    // Sort by service ranking (highest first)
    references.sort((a, b) => {
      const rankingA = a.getProperty('service.ranking') || 0;
      const rankingB = b.getProperty('service.ranking') || 0;

      if (rankingA !== rankingB) {
        return rankingB - rankingA; // Descending order
      }

      // If rankings are equal, sort by service ID (lowest first)
      const idA = a.getProperty('service.id') || 0;
      const idB = b.getProperty('service.id') || 0;
      return idA - idB;
    });

    return references;
  }

  /** Returns the single best (highest-ranked) tracked reference, or null. */
  getServiceReference(): ServiceReference<S> | null {
    const references = this.getServiceReferences();
    return references && references.length > 0 ? references[0] : null;
  }

  size(): number {
    return this.trackedServices.size;
  }

  /** Returns true when no services are currently tracked. */
  isEmpty(): boolean {
    return this.trackedServices.size === 0;
  }

  /**
   * Returns the tracking count: -1 when the tracker is closed, otherwise a
   * value incremented each time a service is added, modified, or removed.
   */
  getTrackingCount(): number {
    return this.trackingCount;
  }

  /** Returns a snapshot map of tracked references to their customized objects. */
  getTracked(): Map<ServiceReference<S>, T> {
    const result = new Map<ServiceReference<S>, T>();
    for (const [reference, tracked] of this.trackedServices.entries()) {
      if (tracked.tracked !== null) {
        result.set(reference, tracked.tracked);
      }
    }
    return result;
  }

  /** Manually removes a reference from tracking, invoking removedService. */
  remove(reference: ServiceReference<S>): void {
    this.untrackService(reference);
  }

  /**
   * Waits for a tracked service to become available. Resolves immediately if one
   * is already tracked. A `timeout` of 0 waits indefinitely; a positive value
   * resolves with the current service (possibly null) after that many ms.
   */
  waitForService(timeout = 0): Promise<T | null> {
    if (timeout < 0) {
      throw new Error('timeout must not be negative');
    }

    const existing = this.getService();
    if (existing !== null) {
      return Promise.resolve(existing);
    }

    return new Promise<T | null>((resolve) => {
      let settled = false;
      const finish = (value: T | null): void => {
        if (settled) return;
        settled = true;
        resolve(value);
      };
      this.waiters.push(finish);
      if (timeout > 0) {
        setTimeout(() => {
          const index = this.waiters.indexOf(finish);
          if (index >= 0) {
            this.waiters.splice(index, 1);
          }
          finish(this.getService());
        }, timeout);
      }
    });
  }

  private notifyWaiters(): void {
    if (this.waiters.length === 0) {
      return;
    }
    const service = this.getService();
    if (service === null) {
      return;
    }
    const pending = this.waiters.splice(0);
    for (const waiter of pending) {
      waiter(service);
    }
  }

  addingService(reference: ServiceReference<S>, service: S): T | null {
    if (this.customizer) {
      return this.customizer.addingService(reference, service);
    }
    return service as unknown as T;
  }

  modifiedService(reference: ServiceReference<S>, service: S, tracked: T): void {
    if (this.customizer) {
      this.customizer.modifiedService(reference, service, tracked);
    }
  }

  removedService(reference: ServiceReference<S>, service: S, tracked: T): void {
    try {
      if (this.customizer) {
        this.customizer.removedService(reference, service, tracked);
      }
    } finally {
      // The reference must always be released, even if the customizer throws.
      this.context.ungetService(reference);
    }
  }

  serviceChanged(event: ServiceEvent): void {
    if (!this.isOpen) {
      return;
    }

    const reference = event.getServiceReference() as ServiceReference<S>;

    // Check if this service should be tracked
    if (!this.filter || !this.filter.match(reference.getProperties())) {
      return;
    }

    switch (event.getType()) {
      case SERVICE_EVENT_TYPES.REGISTERED:
        this.trackService(reference);
        break;
      case SERVICE_EVENT_TYPES.MODIFIED:
        this.modifyService(reference);
        break;
      case SERVICE_EVENT_TYPES.UNREGISTERING:
        this.untrackService(reference);
        break;
    }
  }

  private trackService(reference: ServiceReference<S>): void {
    if (this.trackedServices.has(reference)) {
      return; // Already tracking this service
    }

    const service = this.context.getService<S>(reference);
    if (!service) {
      return; // Service not available
    }

    let tracked: T | null;
    try {
      tracked = this.addingService(reference, service);
    } catch (error) {
      // A throwing customizer must not leak the obtained reference.
      this.context.ungetService(reference);
      throw error;
    }
    if (tracked === null) {
      this.context.ungetService(reference);
      return; // Service should not be tracked
    }

    // Add to tracked services
    this.trackedServices.set(reference, { reference, service, tracked });
    this.trackingCount++;
    this.notifyWaiters();
  }

  private modifyService(reference: ServiceReference<S>): void {
    const tracked = this.trackedServices.get(reference);
    if (!tracked) {
      return; // Not tracking this service
    }

    const service = this.context.getService<S>(reference);
    if (!service) {
      this.untrackService(reference);
      return; // Service no longer available
    }

    // Update the service in the tracked service
    tracked.service = service;
    this.trackingCount++;

    // Notify about the modified service
    if (tracked.tracked !== null) {
      this.modifiedService(reference, service, tracked.tracked);
    }
  }

  private untrackService(reference: ServiceReference<S>): void {
    const tracked = this.trackedServices.get(reference);
    if (!tracked) {
      return; // Not tracking this service
    }

    // Remove from tracked services
    this.trackedServices.delete(reference);
    if (this.trackingCount >= 0) {
      this.trackingCount++;
    }

    // Notify about the removed service
    if (tracked.service !== null && tracked.tracked !== null) {
      this.removedService(reference, tracked.service, tracked.tracked);
    }
  }
}
