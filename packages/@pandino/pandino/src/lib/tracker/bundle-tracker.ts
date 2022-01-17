import { Bundle, BundleContext, BundleEvent, BundleState, BundleTrackerCustomizer } from '@pandino/pandino-api';
import { BundleTracked } from './bundle-tracked';

/**
 * The purpose of the Bundle Tracker is to simplify tracking bundles.
 *
 * A popular example where bundles need to be tracked is the extender pattern. An extender uses information in other
 * bundles to provide its function.
 */
export class BundleTracker<T> implements BundleTrackerCustomizer<T> {
  protected readonly context: BundleContext;
  protected customizer: BundleTrackerCustomizer<T>;
  private _tracked: BundleTracked<T>;
  statesToMonitor: BundleState[];

  /**
   * @param {BundleContext} context
   * @param {Array<BundleState>} statesToMonitor If empty, will monitor all
   * @param {BundleTrackerCustomizer<T>} [customizer]
   */
  constructor(context: BundleContext, statesToMonitor: BundleState[], customizer?: BundleTrackerCustomizer<T>) {
    this.context = context;
    this.statesToMonitor = statesToMonitor;
    this.customizer = customizer || this;
  }

  tracked(): BundleTracked<T> {
    return this._tracked;
  }

  open(): void {
    let t: BundleTracked<T>;

    if (this.tracked()) {
      return;
    }

    t = new BundleTracked(this);

    this.context.addBundleListener(t);
    const bundles = this.context.getBundles();
    if (Array.isArray(bundles)) {
      const length = bundles.length;
      for (let i = 0; i < length; i++) {
        const state = bundles[i].getState();
        if (this.statesToMonitor.length > 0 && !this.statesToMonitor.includes(state)) {
          /* null out bundles whose states are not interesting */
          bundles.splice(i, 1);
        }
      }
      t.setInitial(bundles);
    }

    this._tracked = t;

    t.trackInitial();
  }

  close(): void {
    let bundles: Bundle[];
    let outgoing: BundleTracked<T>;

    outgoing = this._tracked;

    if (!outgoing) {
      return;
    }

    outgoing.close();
    bundles = this.getBundles();
    this._tracked = undefined;
    try {
      this.context.removeBundleListener(outgoing);
    } catch (e) {}
    if (Array.isArray(bundles)) {
      for (let i = 0; i < bundles.length; i++) {
        outgoing.untrack(bundles[i], undefined);
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
    let t = this.tracked();
    if (!t) {
      return [];
    }
    if (t.isEmpty()) {
      return [];
    }
    return t.copyKeys([]);
  }

  getObject(bundle: Bundle): T | undefined {
    const t = this.tracked();
    if (!t) {
      return undefined;
    }
    return t.getCustomizedObject(bundle);
  }

  remove(bundle: Bundle): void {
    const t = this.tracked();
    if (!t) {
      return;
    }
    t.untrack(bundle, undefined);
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

  getTracked(): Map<Bundle, T> {
    const map: Map<Bundle, T> = new Map<Bundle, T>();
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

  getCustomizer(): BundleTrackerCustomizer<T> {
    return this.customizer;
  }
}
