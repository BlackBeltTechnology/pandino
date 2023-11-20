import { SERVICE_ID, SERVICE_RANKING } from '@pandino/pandino-api';
import type { ServiceEvent, ServiceListener, ServiceReference, ServiceTracker, ServiceTrackerCustomizer } from '@pandino/pandino-api';
import { serializeFilter } from '@pandino/filters';
import type { FilterNode } from '@pandino/filters';
import { AbstractTracked } from './abstract-tracked';
import { BundleContextImpl } from './bundle-context-impl';

export class ServiceTrackerImpl<S, T> implements ServiceTracker<S, T> {
  readonly customizer: ServiceTrackerCustomizer<S, T>;
  protected readonly context: BundleContextImpl;
  protected readonly filter?: FilterNode;
  private readonly listenerFilter?: string;
  private tracked?: Tracked<S, T>;
  private cachedReference?: ServiceReference<S>;
  private cachedService?: T;

  constructor(context: BundleContextImpl, filter: string | FilterNode, customizer?: ServiceTrackerCustomizer<S, T>) {
    this.context = context;
    this.customizer = customizer || this;
    this.listenerFilter = typeof filter === 'string' ? filter : serializeFilter(filter);
    this.filter = typeof filter === 'string' ? (this.listenerFilter ? context.createFilter(this.listenerFilter) : undefined) : filter;
  }

  open(): void {
    let t: Tracked<S, T>;

    if (this.tracked) {
      return;
    }

    t = new AllTracked(this);

    this.context.addServiceListener(t, this.listenerFilter);

    let references: Array<ServiceReference<S>> = [];

    references = this.getInitialReferences(undefined, this.listenerFilter);

    t.setInitial(references);

    this.tracked = t;

    t.trackInitial();
  }

  close(): void {
    const outgoing: Tracked<S, T> | undefined = this.tracked;
    let references: Array<ServiceReference<S>>;

    if (!outgoing) {
      return;
    }

    outgoing.close();
    references = this.getServiceReferences();

    this.tracked = undefined;

    try {
      this.context.removeServiceListener(outgoing);
    } catch (_) {
      /* In case the context was stopped. */
    }

    this.modified();

    if (Array.isArray(references)) {
      for (const reference of references) {
        outgoing.untrack(reference, undefined);
      }
    }
  }

  getServiceReferences(): Array<ServiceReference<S>> {
    let t = this.tracked;
    if (!t) {
      return [];
    }
    if (!t || t.isEmpty()) {
      return [];
    }

    let result: Array<ServiceReference<S>> = [];
    return t.copyKeys(result);
  }

  addingService(reference: ServiceReference<S>): T | undefined {
    return this.context.getService<T>(reference);
  }

  modifiedService(reference: ServiceReference<S>, service: T): void {
    /* do nothing */
  }

  removedService(reference: ServiceReference<S>, service: T): void {
    try {
      // If a Bundle is in a STOPPING state, unget will fail
      this.context.ungetService(reference);
    } catch (_) {}
  }

  getService(): T | undefined {
    let service = this.cachedService;
    if (service) {
      return service;
    }
    let reference = this.getServiceReference();
    if (!reference) {
      return undefined;
    }
    return (this.cachedService = this.getServiceForReference(reference));
  }

  getServiceReference(): ServiceReference<S> | undefined {
    const reference = this.cachedReference;
    if (reference) {
      return reference;
    }
    const references = this.getServiceReferences();
    const length = !Array.isArray(references) ? 0 : references.length;
    if (length === 0) {
      return undefined;
    }
    let index = 0;
    if (length > 1) {
      const rankings: number[] = [];
      let count = 0;
      let maxRanking = Number.MIN_VALUE;
      for (let i = 0; i < length; i++) {
        const property = references[i].getProperty(SERVICE_RANKING);
        const ranking: number = typeof property === 'number' ? Number(property) : 0;
        rankings[i] = ranking;
        if (ranking > maxRanking) {
          index = i;
          maxRanking = ranking;
          count = 1;
        } else {
          if (ranking === maxRanking) {
            count++;
          }
        }
      }
      if (count > 1) {
        let minId = Number.MAX_VALUE;
        for (let i = 0; i < length; i++) {
          if (rankings[i] == maxRanking) {
            const id: number = Number(references[i].getProperty(SERVICE_ID));
            if (id < minId) {
              index = i;
              minId = id;
            }
          }
        }
      }
    }
    return (this.cachedReference = references[index]);
  }

  getServiceForReference(reference: ServiceReference<S>): T | undefined {
    let t = this.tracked;
    if (!t) {
      return undefined;
    }
    return t.getCustomizedObject(reference);
  }

  getServices(): T[] {
    let t = this.tracked;
    if (!t) {
      return [];
    }
    const references: ServiceReference<S>[] = this.getServiceReferences();

    if (Array.isArray(references)) {
      const refs: T[] = [];
      for (const ref of references) {
        const svc = this.getServiceForReference(ref);
        if (svc) {
          refs.push(svc);
        }
      }
      return refs;
    }
    return [];
  }

  modified(): void {
    this.cachedReference = undefined;
    this.cachedService = undefined;
  }

  remove(reference: ServiceReference<S>): void {
    let t = this.tracked;
    if (!t) {
      return;
    }
    t.untrack(reference, undefined);
  }

  size(): number {
    const t = this.tracked;
    if (!t) {
      return 0;
    }

    return t.size();
  }

  getTrackingCount(): number {
    const t = this.tracked;

    if (!t) {
      return -1;
    }

    return t.getTrackingCount();
  }

  isEmpty(): boolean {
    const t = this.tracked;

    if (!t) {
      return true;
    }

    return t.isEmpty();
  }

  private getInitialReferences(identifier?: string, filterString?: string): Array<ServiceReference<S>> {
    if (!identifier && !filterString) {
      throw new Error('Either the parameter "identifier" or "filterString" must be provided!');
    }
    return this.context.getAllServiceReferences(identifier, filterString);
  }
}

class Tracked<S, T> extends AbstractTracked<ServiceReference<S>, T, ServiceEvent> implements ServiceListener {
  isSync = true;
  private tracker: ServiceTrackerImpl<S, T>;

  constructor(tracker: ServiceTrackerImpl<S, T>) {
    super();
    this.tracker = tracker;
  }

  serviceChanged(event: ServiceEvent): void {
    if (this.closed) {
      return;
    }
    const reference: ServiceReference<S> = event.getServiceReference();

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
    this.tracker.modified();
  }

  customizerAdding(item: ServiceReference<S>, related?: ServiceEvent): T | undefined {
    return this.tracker.customizer.addingService(item);
  }

  customizerModified(item: ServiceReference<S>, object: T, related?: ServiceEvent): void {
    this.tracker.customizer.modifiedService(item, object);
  }

  customizerRemoved(item: ServiceReference<S>, object: T, related?: ServiceEvent): void {
    this.tracker.customizer.removedService(item, object);
  }
}

class AllTracked<S, T> extends Tracked<S, T> implements ServiceListener {
  constructor(tracker: ServiceTrackerImpl<S, T>) {
    super(tracker);
  }
}
