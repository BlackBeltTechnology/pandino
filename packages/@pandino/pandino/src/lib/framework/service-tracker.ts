import {
  BundleContext,
  FilterApi,
  OBJECTCLASS,
  SERVICE_ID,
  SERVICE_RANKING,
  ServiceEvent,
  ServiceListener,
  ServiceReference,
  ServiceTrackerCustomizer,
} from '@pandino/pandino-api';
import { isAllPresent, isAnyMissing } from '../utils/helpers';

export class ServiceTracker<S, T> implements ServiceTrackerCustomizer<S, T> {
  protected readonly context: BundleContext;
  protected readonly filter: FilterApi;
  readonly customizer: ServiceTrackerCustomizer<S, T>;
  listenerFilter: string;
  private readonly identifier?: string;
  private readonly trackReference?: ServiceReference<S>;
  private tracked: Tracked<S, T>;
  private cachedReference: ServiceReference<S>;
  private cachedService: T;

  constructor(
    context: BundleContext,
    identifierOrFilter: string | FilterApi,
    customizer?: ServiceTrackerCustomizer<S, T>,
  ) {
    this.context = context;
    this.customizer = customizer || this;
    this.listenerFilter =
      typeof identifierOrFilter === 'string' ? `(${OBJECTCLASS}=${identifierOrFilter})` : identifierOrFilter.toString();
    this.identifier = typeof identifierOrFilter === 'string' ? identifierOrFilter : undefined;
    this.filter =
      typeof identifierOrFilter === 'string' ? context.createFilter(this.listenerFilter) : identifierOrFilter;
  }

  /**
   * Open this {@code ServiceTracker} and begin tracking services.
   *
   * <p>
   * Services which match the search criteria specified when this {@code ServiceTracker} was created are now tracked by
   * this {@code ServiceTracker}.
   *
   * @param trackAllServices If {@code true}, then this {@code ServiceTracker} will track all matching services
   */
  open(trackAllServices = false): void {
    let t: Tracked<S, T>;

    if (isAllPresent(this.tracked)) {
      return;
    }

    t = trackAllServices ? new AllTracked(this) : new Tracked(this);

    this.context.addServiceListener(t, this.listenerFilter);

    let references: Array<ServiceReference<S>> = [];

    if (isAllPresent(this.identifier)) {
      references = this.getInitialReferences(trackAllServices, this.identifier);
    } else {
      if (isAllPresent(this.trackReference)) {
        if (isAllPresent(this.trackReference.getBundle())) {
          references = [this.trackReference];
        }
      } else {
        references = this.getInitialReferences(trackAllServices, undefined, this.listenerFilter);
      }
    }

    t.setInitial(references);

    this.tracked = t;

    t.trackInitial();
  }

  /**
   * Close this {@code ServiceTracker}.
   *
   * <p>
   * This method should be called when this {@code ServiceTracker} should end the tracking of services.
   *
   * <p>
   * This implementation calls {@link #getServiceReferences()} to get the list of tracked services to remove.
   */
  close(): void {
    let outgoing: Tracked<S, T>;
    let references: Array<ServiceReference<S>>;

    outgoing = this.tracked;

    if (isAnyMissing(outgoing)) {
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

    if (isAllPresent(references)) {
      for (let i = 0; i < references.length; i++) {
        outgoing.untrack(references[i], undefined);
      }
    }
  }

  /**
   * Return an array of {@code ServiceReference}s for all services being tracked by this {@code ServiceTracker}.
   *
   * @return Array of {@code ServiceReference}s or {@code undefined} if no services are being tracked.
   */
  getServiceReferences(): Array<ServiceReference<S>> {
    let t: Tracked<S, T> = this.tracked;
    if (isAnyMissing(t)) {
      return [];
    }
    if (t.isEmpty()) {
      return [];
    }

    let result: Array<ServiceReference<S>> = [];
    return t.copyKeys(result);
  }

  addingService(reference: ServiceReference<S>): T {
    return this.context.getService<T>(reference);
  }

  modifiedService(reference: ServiceReference<S>, service: T): void {
    /* do nothing */
  }

  removedService(reference: ServiceReference<S>, service: T): void {
    this.context.ungetService(reference);
  }

  /**
   * Returns a service object for one of the services being tracked by this {@code ServiceTracker}.
   *
   * <p>
   * If any services are being tracked, this implementation returns the result of calling
   * {@code getService(getServiceReference())}.
   *
   * @return A service object or {@code undefined} if no services are being tracked.
   */
  getService(): T | undefined {
    let service: T = this.cachedService;
    if (isAllPresent(service)) {
      return service;
    }
    let reference: ServiceReference<S> = this.getServiceReference();
    if (isAnyMissing(reference)) {
      return undefined;
    }
    return (this.cachedService = this.getServiceForReference(reference));
  }

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
  getServiceReference(): ServiceReference<S> | undefined {
    const reference: ServiceReference<S> = this.cachedReference;
    if (isAllPresent(reference)) {
      return reference;
    }
    const references: Array<ServiceReference<S>> = this.getServiceReferences();
    const length = isAnyMissing(references) ? 0 : references.length;
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
    let t: Tracked<S, T> = this.tracked;
    if (isAnyMissing(t)) {
      return undefined;
    }
    return t.getCustomizedObject(reference);
  }

  /**
   * Return an array of service objects for all services being tracked by this {@code ServiceTracker}.
   *
   * <p>
   * This implementation calls {@link #getServiceReferences()} to get the list of references for the tracked services
   * and then calls {@link #getService(ServiceReference)} for each reference to get the tracked service object.
   *
   * @return An array of service objects or {@code []]} if no services are being tracked.
   */
  getServices(): any[] {
    let t: Tracked<S, T> = this.tracked;
    if (isAnyMissing(t)) {
      return [];
    }
    let references: ServiceReference<S>[] = this.getServiceReferences();
    let length = isAllPresent(references) ? references.length : 0;
    if (length === 0) {
      return [];
    }
    const objects: any[] = [];
    for (let i = 0; i < length; i++) {
      objects[i] = this.getServiceForReference(references[i]);
    }
    return objects;
  }

  modified(): void {
    this.cachedReference = undefined;
    this.cachedService = undefined;
  }

  /**
   * Remove a service from this {@code ServiceTracker}.
   *
   * The specified service will be removed from this {@code ServiceTracker}. If the specified service was being tracked
   * then the {@code ServiceTrackerCustomizer.removedService} method will be called for that service.
   *
   * @param reference The reference to the service to be removed.
   */
  remove(reference: ServiceReference<S>): void {
    let t: Tracked<S, T> = this.tracked;
    if (isAnyMissing(t)) {
      return;
    }
    t.untrack(reference, undefined);
  }

  /**
   * Return the number of services being tracked by this {@code ServiceTracker}.
   *
   * @return The number of services being tracked.
   */
  size(): number {
    const t: Tracked<S, T> = this.tracked;
    if (isAnyMissing(t)) {
      return 0;
    }

    return t.size();
  }

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
  getTrackingCount(): number {
    const t: Tracked<S, T> = this.tracked;

    if (isAnyMissing(t)) {
      return -1;
    }

    return t.getTrackingCount();
  }

  /**
   * Return a {@code SortedMap} of the {@code ServiceReference}s and service objects for all services being tracked by
   * this {@code ServiceTracker}. The map is sorted in reverse natural order of {@code ServiceReference}. That is, the
   * first entry is the service with the highest ranking and the lowest service id.
   *
   * @return A {@code SortedMap} with the {@code ServiceReference}s and service objects for all services being tracked
   *         by this {@code ServiceTracker}. If no services are being tracked, then the returned map is empty.
   */
  getTracked(): Map<ServiceReference<S>, T> {
    const map: Map<ServiceReference<S>, T> = new Map<ServiceReference<S>, T>();
    const t: Tracked<S, T> = this.tracked;

    if (isAnyMissing(t)) {
      return map;
    }

    return t.copyEntries(map);
  }

  /**
   * Return if this {@code ServiceTracker} is empty.
   *
   * @return {@code true} if this {@code ServiceTracker} is not tracking any services.
   */
  isEmpty(): boolean {
    const t: Tracked<S, T> = this.tracked;

    if (isAnyMissing(t)) {
      return true;
    }

    return t.isEmpty();
  }

  private getInitialReferences(
    trackAllServices: boolean,
    identifier?: string,
    filterString?: string,
  ): Array<ServiceReference<S>> {
    if (isAnyMissing(identifier) && isAnyMissing(filterString)) {
      throw new Error('Either the parameter "identifier" or "filterString" must be provided!');
    }
    return trackAllServices
      ? this.context.getAllServiceReferences(identifier, filterString)
      : this.context.getServiceReferences(identifier, filterString);
  }
}

/**
 * Abstract class to track items. If a Tracker is reused (closed then reopened), then a new AbstractTracked object is
 * used. This class acts a map of tracked item -> customized object. Subclasses of this class will act as the listener
 * object for the tracker. This class is used to synchronize access to the tracked items. This is not a public class. It
 * is only for use by the implementation of the Tracker class.
 *
 * @param <S> The tracked item. It is the key.
 * @param <T> The value mapped to the tracked item.
 * @param <R> The reason the tracked item is being tracked or untracked.
 */
abstract class AbstractTracked<S, T, R> {
  closed = false;
  private trackingCount = 0;
  private tracked: Map<S, T> = new Map<S, T>();
  private adding: Array<S> = [];
  private initial: Array<S> = [];

  /**
   * Call the specific customizer adding method.
   *
   * @param item <S> Item to be tracked.
   * @param related <R> Action related object.
   * @return <T> Customized object for the tracked item or {@code undefined} if the item is not to be tracked.
   */
  abstract customizerAdding(item: S, related?: R): T;

  /**
   * Call the specific customizer modified method.
   *
   * @param item <S> Tracked item.
   * @param object <T> Customized object for the tracked item.
   * @param related <R> Action related object.
   */
  abstract customizerModified(item: S, object: T, related?: R): void;

  /**
   * Call the specific customizer removed method.
   *
   * @param item <S> Tracked item.
   * @param object <T> Customized object for the tracked item.
   * @param related <R> Action related object.
   */
  abstract customizerRemoved(item: S, object: T, related?: R): void;

  setInitial(list: S[] = []): void {
    for (const item of list) {
      if (!item) {
        continue;
      }
      this.initial.push(item);
    }
  }

  trackInitial(): void {
    while (true) {
      let item: S;
      if (this.closed || this.initial.length === 0) {
        return;
      }
      item = this.initial[0];
      this.initial.splice(0, 1);
      if (this.tracked.get(item)) {
        continue;
      }
      if (this.adding.includes(item)) {
        continue;
      }
      this.adding.push(item);
      this.trackAdding(item, undefined);
    }
  }

  close(): void {
    this.closed = true;
  }

  track(item: S, related?: R): void {
    let object: T;
    if (this.closed) {
      return;
    }
    object = this.tracked.get(item);
    if (isAnyMissing(object)) {
      if (this.adding.includes(item)) {
        return;
      }
      this.adding.push(item);
    } else {
      this.modified();
    }
    if (isAnyMissing(object)) {
      this.trackAdding(item, related);
    } else {
      this.customizerModified(item, object, related);
    }
  }

  untrack(item: S, related?: R): void {
    let object: T;
    const initialIdx = this.initial.findIndex((i) => i === item);
    if (initialIdx > -1) {
      this.initial.splice(initialIdx, 1);
      return;
    }
    const addingIdx = this.adding.findIndex((a) => a === item);
    if (addingIdx > -1) {
      this.adding.splice(addingIdx, 1);
      return;
    }
    object = this.tracked.get(item);
    this.tracked.delete(item);
    if (isAnyMissing(object)) {
      return;
    }
    this.modified();
    this.customizerRemoved(item, object, related);
  }

  size(): number {
    return this.tracked.size;
  }

  isEmpty(): boolean {
    return this.size() === 0;
  }

  getCustomizedObject(item: S): T {
    return this.tracked.get(item);
  }

  copyKeys(list: S[]): S[] {
    return [...list, ...Array.from(this.tracked.keys())];
  }

  modified(): void {
    this.trackingCount++;
  }

  getTrackingCount(): number {
    return this.trackingCount;
  }

  copyEntries<M extends Map<S, T>>(map: M): M {
    this.tracked.forEach((value, key) => {
      map.set(key, value);
    });
    return map;
  }

  private trackAdding(item: S, related?: R): void {
    let object: T;
    let becameUntracked = false;
    try {
      object = this.customizerAdding(item, related);
    } finally {
      const idx = this.adding.findIndex((a) => a === item);
      if (idx > -1 && !this.closed) {
        this.adding.splice(idx, 1);
        if (object) {
          this.tracked.set(item, object);
          this.modified();
        }
      } else {
        becameUntracked = true;
      }
    }

    if (becameUntracked && object) {
      this.customizerRemoved(item, object, related);
    }
  }
}

class Tracked<S, T> extends AbstractTracked<ServiceReference<S>, T, ServiceEvent> implements ServiceListener {
  isSync = true;
  private tracker: ServiceTracker<S, T>;

  constructor(tracker: ServiceTracker<S, T>) {
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

  customizerAdding(item: ServiceReference<S>, related?: ServiceEvent): T {
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
  constructor(tracker: ServiceTracker<S, T>) {
    super(tracker);
  }
}
