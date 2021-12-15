import { FrameworkEvent, FrameworkEventType, Bundle } from '@pandino/pandino-api';

export class FrameworkEventImpl implements FrameworkEvent {
  constructor(
    private readonly type: FrameworkEventType,
    private readonly bundle?: Bundle,
    private readonly error?: Error,
  ) {}

  getBundle(): Bundle {
    return this.bundle;
  }

  getType(): FrameworkEventType {
    return this.type;
  }

  getError(): Error {
    return this.error;
  }

  toString(): string {
    return `${this.bundle.getUniqueIdentifier()} changed state to: ${this.type}.`;
  }
}
