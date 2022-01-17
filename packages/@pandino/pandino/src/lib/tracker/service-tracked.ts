import { ServiceEvent, ServiceListener, ServiceReference } from '@pandino/pandino-api';
import { AbstractTracked } from './abstract-tracked';
import { ServiceTracker } from './service-tracker';

export class ServiceTracked<S, T>
  extends AbstractTracked<ServiceReference<S>, T, ServiceEvent>
  implements ServiceListener
{
  private serviceTracker: ServiceTracker<S, T>;

  /**
   * This part is super important!
   */
  isSync = true;

  constructor(serviceTracker: ServiceTracker<S, T>) {
    super();
    this.serviceTracker = serviceTracker;
  }

  serviceChanged(event: ServiceEvent): void {
    if (this.closed) {
      return;
    }

    const reference = event.getServiceReference();

    switch (event.getType()) {
      case 'REGISTERED':
      case 'MODIFIED':
        this.track(reference, event);
        break;
      case 'MODIFIED_ENDMATCH':
      case 'UNREGISTERING':
        this.untrack(reference, event);
        break;
    }
  }

  modified(): void {
    super.modified();
    this.serviceTracker.modified();
  }

  customizerAdding(item: ServiceReference<S>, related: ServiceEvent): T {
    return this.serviceTracker.getCustomizer().addingService(item);
  }

  customizerModified(item: ServiceReference<S>, related: ServiceEvent, object: T): void {
    this.serviceTracker.getCustomizer().modifiedService(item, object);
  }

  customizerRemoved(item: ServiceReference<S>, related: ServiceEvent, object: T): void {
    this.serviceTracker.getCustomizer().removedService(item, object);
  }
}
