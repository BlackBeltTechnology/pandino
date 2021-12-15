import { Bundle, BundleEvent, BundleEventType, FrameworkEventType } from '@pandino/pandino-api';

export class BundleEventImpl implements BundleEvent {
  constructor(
    private readonly bundle: Bundle,
    private readonly type: BundleEventType | FrameworkEventType,
    private readonly origin?: Bundle,
  ) {}

  getBundle(): Bundle {
    return this.bundle;
  }

  getOrigin(): Bundle {
    return this.origin;
  }

  getType(): BundleEventType | FrameworkEventType {
    return this.type;
  }

  toString(): string {
    return `${this.bundle.getUniqueIdentifier()} changed state to: ${this.type}.`;
  }
}
