import type { BundleContext, Filter, ServiceEvent, ServiceListener, ServiceReference } from '~/framework/interfaces';
import type { ServiceTrackerCustomizer, TrackedService } from '~/services/service-tracker/interfaces';
import { SERVICE_EVENT_TYPES } from '~/types/constants';

export class ServiceTracker<S, T = S> implements ServiceListener {
  private readonly className?: string;
  private context: BundleContext;
  private reference?: ServiceReference<S>;
  private readonly filter: Filter | null = null;
  private readonly customizer: ServiceTrackerCustomizer<S, T> | null = null;
  private isOpen = false;
  private trackedServices = new Map<ServiceReference<S>, TrackedService<S, T>>();

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

    // Add service listener
    this.context.addServiceListener(this);

    // Get initial services
    const references = this.context.getServiceReferences<S>(this.className || '*', this.filter?.toString() || null);
    if (references) {
      for (const reference of references) {
        this.trackInitialService(reference);
      }
    }

    return this;
  }

  close(): void {
    if (!this.isOpen) {
      return;
    }

    this.isOpen = false;

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

  size(): number {
    return this.trackedServices.size;
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
    if (this.customizer) {
      this.customizer.removedService(reference, service, tracked);
    }
    this.context.ungetService(reference);
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

  private trackInitialService(reference: ServiceReference<S>): void {
    if (this.trackedServices.has(reference)) {
      return; // Already tracking this service
    }

    const service = this.context.getService<S>(reference);
    if (!service) {
      return; // Service not available
    }

    const tracked = this.addingService(reference, service);
    if (tracked === null) {
      this.context.ungetService(reference);
      return; // Service should not be tracked
    }

    // Add to tracked services
    this.trackedServices.set(reference, { reference, service, tracked });
  }

  private trackService(reference: ServiceReference<S>): void {
    if (this.trackedServices.has(reference)) {
      return; // Already tracking this service
    }

    const service = this.context.getService<S>(reference);
    if (!service) {
      return; // Service not available
    }

    const tracked = this.addingService(reference, service);
    if (tracked === null) {
      this.context.ungetService(reference);
      return; // Service should not be tracked
    }

    // Add to tracked services
    this.trackedServices.set(reference, { reference, service, tracked });
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

    // Notify about the removed service
    if (tracked.service !== null && tracked.tracked !== null) {
      this.removedService(reference, tracked.service, tracked.tracked);
    }
  }
}
