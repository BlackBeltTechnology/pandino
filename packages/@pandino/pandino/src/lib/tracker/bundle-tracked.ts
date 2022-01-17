import { Bundle, BundleEvent, BundleListener } from '@pandino/pandino-api';
import { BundleTracker } from './bundle-tracker';
import { AbstractTracked } from './abstract-tracked';

export class BundleTracked<T> extends AbstractTracked<Bundle, T, BundleEvent> implements BundleListener {
  private bundleTracker: BundleTracker<T>;

  /**
   * This part is super important!
   */
  isSync = true;

  constructor(bundleTracker: BundleTracker<T>) {
    super();
    this.bundleTracker = bundleTracker;
  }

  customizerAdding(item: Bundle, related: BundleEvent): T {
    return this.bundleTracker.getCustomizer().addingBundle(item, related);
  }

  customizerModified(item: Bundle, related: BundleEvent, object: T): void {
    this.bundleTracker.getCustomizer().modifiedBundle(item, related, object);
  }

  customizerRemoved(item: Bundle, related: BundleEvent, object: T): void {
    this.bundleTracker.getCustomizer().removedBundle(item, related, object);
  }

  bundleChanged(event: BundleEvent): void {
    if (this.closed) {
      return;
    }
    const bundle = event.getBundle();
    const state = bundle.getState();

    if (this.bundleTracker.statesToMonitor.length === 0 || this.bundleTracker.statesToMonitor.includes(state)) {
      this.track(bundle, event);
    } else {
      this.untrack(bundle, event);
    }
  }
}
