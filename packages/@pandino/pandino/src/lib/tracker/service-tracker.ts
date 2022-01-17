import {
  BundleContext,
  FilterApi,
  OBJECTCLASS,
  SERVICE_ID,
  SERVICE_RANKING,
  ServiceReference,
  ServiceTrackerCustomizer,
} from '@pandino/pandino-api';
import { ServiceTracked } from './service-tracked';

type OneOfArgs<S> = {
  reference?: ServiceReference<S>;
  clazz?: string;
  filter?: FilterApi;
};

export class ServiceTracker<S, T> implements ServiceTrackerCustomizer<S, T> {
  protected readonly context: BundleContext;
  protected readonly filter: FilterApi;
  private readonly customizer: ServiceTrackerCustomizer<S, T>;
  private readonly trackReference?: ServiceReference<S>;
  private readonly trackClass?: string;
  private _tracked: ServiceTracked<S, T>;
  private cachedReference: ServiceReference<S>;
  private cachedService: T;

  constructor(context: BundleContext, customizer?: ServiceTrackerCustomizer<S, T>, identification: OneOfArgs<S> = {}) {
    this.context = context;
    this.trackReference = identification?.reference;
    this.trackClass = identification?.clazz;
    this.customizer = !customizer ? (this as any) : customizer;
    const listenerFilter = identification.clazz
      ? '(' + OBJECTCLASS + '=' + identification.clazz + ')'
      : '(' +
        SERVICE_ID +
        '=' +
        (identification.reference ? identification.reference.getProperty(SERVICE_ID).toString() : '*') +
        ')';
    this.filter = identification?.filter ? identification!.filter : context.createFilter(listenerFilter);
    if (!this.context || !this.filter) {
      throw new Error('Missing context or filter while instantiating ServiceTracker!');
    }
  }

  private tracked(): ServiceTracked<S, T> {
    return this._tracked;
  }

  open(): void {
    let t: ServiceTracked<S, T>;
    if (this.tracked()) {
      return;
    }
    t = new ServiceTracked<S, T>(this);
    try {
      this.context.addServiceListener(t, this.filter.toString());
      let references: ServiceReference<S>[] = [];
      if (this.trackClass) {
        references = this.getInitialReferences(this.trackClass);
      } else {
        if (this.trackReference) {
          if (this.trackReference.getBundle()) {
            references = [this.trackReference];
          }
        } else {
          references = this.getInitialReferences(undefined, this.filter.toString());
        }
      }
      t.setInitial(references);
    } catch (e) {
      throw new Error(e);
    }
    this._tracked = t;
    t.trackInitial();
  }

  close(): void {
    let outgoing: ServiceTracked<S, T>;
    let references: ServiceReference<S>[] = [];
    outgoing = this._tracked;
    if (!outgoing) {
      return;
    }
    outgoing.close();
    references = this.getServiceReferences();
    this._tracked = undefined;
    try {
      this.context.removeServiceListener(outgoing);
    } catch (e) {}
    this.modified();
    if (references) {
      for (let i = 0; i < references.length; i++) {
        outgoing.untrack(references[i], undefined);
      }
    }
  }

  addingService(reference: ServiceReference<S>): T {
    return this.context.getService(reference) as unknown as T;
  }

  modifiedService(reference: ServiceReference<S>, service: T): void {}

  removedService(reference: ServiceReference<S>, service: T): void {
    this.context.ungetService(reference);
  }

  getServiceReferences(): ServiceReference<S>[] {
    let t = this.tracked();
    if (!t) {
      return [];
    }
    if (t.isEmpty()) {
      return [];
    }
    return t.copyKeys([]);
  }

  getServiceReference(): ServiceReference<S> | undefined {
    let reference: ServiceReference<S> = this.cachedReference;
    if (reference) {
      return reference;
    }
    const references = this.getServiceReferences();
    const length = references.length;
    if (length === 0) {
      return undefined;
    }
    let index = 0;
    if (length > 1) {
      let rankings: number[] = [];
      let count = 0;
      let maxRanking = Number.MIN_VALUE;
      for (let i = 0; i < length; i++) {
        const property = references[i].getProperty(SERVICE_RANKING);
        const ranking = property !== null && property !== undefined ? Number(property) : 0;
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
            let id = Number(references[i].getProperty(SERVICE_ID) || 0);
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

  getService(reference?: ServiceReference<S>): T | undefined {
    if (reference) {
      const t = this.tracked();
      if (!t) {
        return undefined;
      }
      return t.getCustomizedObject(reference);
    }

    let service = this.cachedService;
    if (service) {
      return service;
    }
    const internalReference = this.getServiceReference();
    if (!internalReference) {
      return undefined;
    }
    return (this.cachedService = this.getService(internalReference));
  }

  getServices(): T[] {
    const t = this.tracked();
    if (!t) {
      return [];
    }
    const references = this.getServiceReferences();
    let length = !Array.isArray(references) ? 0 : references.length;
    if (length === 0) {
      return [];
    }
    const objects: any[] = [];
    for (let i = 0; i < length; i++) {
      objects[i] = this.getService(references[i]);
    }
    return objects;
  }

  remove(reference: ServiceReference<S>): void {
    const t = this.tracked();
    if (!t) {
      return;
    }
    t.untrack(reference, undefined);
  }

  size(): number {
    const t = this.tracked();
    if (!t) {
      return 0;
    }
    return t.size();
  }

  getTrackingCount(): number {
    const t = this.tracked();
    if (!t) {
      return -1;
    }
    return t.getTrackingCount();
  }

  modified(): void {
    this.cachedReference = undefined;
    this.cachedService = undefined;
  }

  getTracked(): Map<ServiceReference<S>, T> {
    const map: Map<ServiceReference<S>, T> = new Map<ServiceReference<S>, T>();
    const t = this.tracked();
    if (!t) {
      return map;
    }
    return t.copyEntries(map);
  }

  isEmpty(): boolean {
    const t = this.tracked();
    if (!t) {
      return true;
    }
    return t.isEmpty();
  }

  private getInitialReferences(className: string, filterString?: string): ServiceReference<S>[] {
    return this.context.getServiceReferences(className, filterString);
  }

  getCustomizer(): ServiceTrackerCustomizer<S, T> {
    return this.customizer;
  }
}
