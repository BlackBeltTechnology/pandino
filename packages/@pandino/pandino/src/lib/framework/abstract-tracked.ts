import { isAnyMissing } from '../utils/helpers';

export /**
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
  abstract customizerAdding(item: S, related?: R): T | undefined;

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
