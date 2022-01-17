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
export abstract class AbstractTracked<S, T, R> {
  private readonly tracked: Map<S, T> = new Map<S, T>();
  private trackingCount = 0;
  private readonly adding: Array<S> = [];
  protected closed = false;
  private readonly initial: Array<S> = [];

  /**
   * Set initial list of items into tracker before events begin to be received.
   *
   * This method must be called from Tracker's open method while synchronized on this object in the same synchronized
   * block as the add listener call.
   */
  setInitial(list: Array<S> = []): void {
    for (const item of list) {
      if (!item) {
        continue;
      }
      this.initial.push(item);
    }
  }

  /**
   * Track the initial list of items. This is called after events can begin to be received.
   *
   * This method must be called from Tracker's open method while not synchronized on this object after the add listener
   * call.
   *
   */
  trackInitial(): void {
    while (true) {
      let item: S;
      if (this.closed || this.initial.length === 0) {
        return;
      }
      item = this.initial.splice(0, 1)[0];
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

  track(item: S, related: R): void {
    let object: T;

    if (this.closed) {
      return;
    }

    object = this.tracked.get(item);

    if (!object) {
      if (this.adding.includes(item)) {
        return;
      }
      this.adding.push(item);
    } else {
      this.modified();
    }

    if (!object) {
      this.trackAdding(item, related);
    } else {
      this.customizerModified(item, related, object);
    }
  }

  /**
   * Common logic to add an item to the tracker used by track and trackInitial. The specified item must have been placed
   * in the adding list before calling this method.
   */
  private trackAdding(item: S, related: R): void {
    let object: T;
    let becameUntracked = false;
    try {
      object = this.customizerAdding(item, related);
    } finally {
      const idxToRem = this.adding.findIndex((a) => a === item);
      if (idxToRem > -1) {
        this.adding.splice(idxToRem, 1);
      }
      if (idxToRem > -1 && !this.closed) {
        if (object) {
          this.tracked.set(item, object);
          this.modified();
        }
      } else {
        becameUntracked = true;
      }
    }

    if (becameUntracked && object) {
      this.customizerRemoved(item, related, object);
    }
  }

  untrack(item: S, related: R): void {
    let object: T;

    const idxInitialToRemove = this.initial.findIndex((i) => i === item);

    if (idxInitialToRemove > -1) {
      this.initial.splice(idxInitialToRemove, 1);
      return;
    }

    const idxAddingToRemove = this.adding.findIndex((i) => i === item);

    if (idxAddingToRemove > -1) {
      this.adding.splice(idxAddingToRemove, 1);
      return;
    }

    object = this.tracked.get(item);
    this.tracked.delete(item);

    if (!object) {
      return;
    }

    this.modified();

    this.customizerRemoved(item, related, object);
  }

  size(): number {
    return this.tracked.size;
  }

  isEmpty(): boolean {
    return this.tracked.size === 0;
  }

  getCustomizedObject(item: S): T {
    return this.tracked.get(item);
  }

  copyKeys(list: Array<S>): Array<S> {
    list.push(...this.tracked.keys());
    return list;
  }

  modified(): void {
    this.trackingCount++;
  }

  /**
   * Returns the tracking count for this {@code ServiceTracker} object.
   *
   * The tracking count is initialized to 0 when this object is opened. Every time an item is added, modified or removed
   * from this object the tracking count is incremented.
   */
  getTrackingCount(): number {
    return this.trackingCount;
  }

  copyEntries(map: Map<S, T>): Map<S, T> {
    for (const [key, value] of this.tracked.entries()) {
      map.set(key, value);
    }
    return map;
  }

  abstract customizerAdding(item: S, related: R): T;

  abstract customizerModified(item: S, related: R, object: T): void;

  abstract customizerRemoved(item: S, related: R, object: T): void;
}
