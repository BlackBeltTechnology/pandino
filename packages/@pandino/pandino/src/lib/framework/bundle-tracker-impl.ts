import type {
  Bundle,
  BundleContext,
  BundleEvent,
  BundleListener,
  BundleState,
  BundleTracker,
  BundleTrackerCustomizer,
} from '@pandino/pandino-api';
import { AbstractTracked } from './abstract-tracked';

export class BundleTrackerImpl<T> implements BundleTracker<T> {
  readonly customizer: BundleTrackerCustomizer<T>;
  private readonly context: BundleContext;
  private readonly trackedStates: BundleState[] = [];
  private tracked?: Tracked<T>;

  constructor(context: BundleContext, trackedStates: BundleState[], customizer?: BundleTrackerCustomizer<T>) {
    this.context = context;
    this.trackedStates = trackedStates;
    this.customizer = customizer || this;
  }

  open(): void {
    if (this.tracked) {
      return;
    }

    const t: Tracked<T> = new Tracked(this);

    this.context.addBundleListener(t);

    const bundles: Array<Bundle | undefined> = this.context.getBundles();

    if (bundles && bundles.length) {
      const length = bundles.length;
      for (let i = 0; i < length; i++) {
        const state = bundles[i]!.getState();
        if (this.getTrackedStates().includes(state)) {
          /* undefined out bundles whose states are not interesting */
          bundles[i] = undefined;
        }
      }
      /* set tracked with the initial bundles */
      t.setInitial(bundles);
    }

    this.tracked = t;

    t.trackInitial();
  }

  close(): void {
    const outgoing = this.tracked;
    let bundles: Bundle[];

    if (!outgoing) {
      return;
    }

    outgoing.close();
    bundles = this.getBundles();

    this.tracked = undefined;

    try {
      this.context.removeBundleListener(outgoing);
    } catch (_) {
      /* In case the context was stopped. */
    }

    if (Array.isArray(bundles)) {
      for (const bundle of bundles) {
        outgoing.untrack(bundle, undefined);
      }
    }
  }

  addingBundle(bundle: Bundle, event: BundleEvent): T {
    return bundle as unknown as T;
  }

  modifiedBundle(bundle: Bundle, event: BundleEvent, object: T): void {
    /* do nothing */
  }

  removedBundle(bundle: Bundle, event: BundleEvent, object: T): void {
    /* do nothing */
  }

  getBundles(): Bundle[] {
    if (!this.tracked) {
      return [];
    }
    if (this.tracked?.isEmpty()) {
      return [];
    }
    return this.tracked ? this.tracked.copyKeys([]) : [];
  }

  getObject(bundle: Bundle): T | undefined {
    if (!this.tracked) {
      return undefined;
    }
    return this.tracked.getCustomizedObject(bundle);
  }

  remove(bundle: Bundle): void {
    if (!this.tracked) {
      return;
    }
    this.tracked.untrack(bundle, undefined);
  }

  size(): number {
    if (!this.tracked) {
      return 0;
    }
    return this.tracked.size();
  }

  getTrackingCount(): number {
    if (!this.tracked) {
      return -1;
    }
    return this.tracked.getTrackingCount();
  }

  isEmpty(): boolean {
    if (!this.tracked) {
      return true;
    }
    return this.tracked.isEmpty();
  }

  getTrackedStates(): BundleState[] {
    return this.trackedStates;
  }
}

class Tracked<T> extends AbstractTracked<Bundle, T, BundleEvent> implements BundleListener {
  isSync = true;

  private tracker: BundleTracker<T>;

  constructor(tracker: BundleTracker<T>) {
    super();
    this.tracker = tracker;
  }

  customizerAdding(item: Bundle, related: BundleEvent | undefined): T | undefined {
    return (this.tracker as BundleTrackerImpl<T>).customizer.addingBundle(item, related);
  }

  customizerModified(item: Bundle, object: T, related: BundleEvent | undefined): void {
    (this.tracker as BundleTrackerImpl<T>).customizer.modifiedBundle(item, related, object);
  }

  customizerRemoved(item: Bundle, object: T, related: BundleEvent | undefined): void {
    (this.tracker as BundleTrackerImpl<T>).customizer.removedBundle(item, related, object);
  }

  bundleChanged(event: BundleEvent): void {
    if (this.closed) {
      return;
    }
    const bundle = event.getBundle();
    const state = bundle.getState();

    if ((this.tracker as BundleTrackerImpl<T>).getTrackedStates().includes(state)) {
      this.track(bundle, event);
      /*
       * If the customizer throws an unchecked exception, it is safe
       * to let it propagate
       */
    } else {
      this.untrack(bundle, event);
      /*
       * If the customizer throws an unchecked exception, it is safe
       * to let it propagate
       */
    }
  }
}
