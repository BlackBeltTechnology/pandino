import { BundleRevision } from '../bundle-revision';
import { BundleCapability } from './bundle-capability';
import { BundleWire } from './bundle-wire';
import { BundleRequirement } from './bundle-requirement';
import { isAnyMissing } from '../../utils/helpers';

export class BundleWireImpl implements BundleWire {
  private readonly requirer: BundleRevision;
  private readonly req: BundleRequirement;
  private readonly provider: BundleRevision;
  private readonly cap: BundleCapability;

  constructor(requirer: BundleRevision, req: BundleRequirement, provider: BundleRevision, cap: BundleCapability) {
    this.requirer = requirer;
    this.req = req;
    this.provider = provider;
    this.cap = cap;
  }

  equals(other: any): boolean {
    if (isAnyMissing(other) || !(other instanceof BundleWireImpl)) {
      return false;
    }
    return this.getRequirement() === other.getRequirement() && this.getCapability() === other.getCapability();
  }

  public getRequirer(): BundleRevision {
    return this.requirer;
  }

  public getRequirement(): BundleRequirement {
    return this.req;
  }

  public getProvider(): BundleRevision {
    return this.provider;
  }

  public getCapability(): BundleCapability {
    return this.cap;
  }

  public toString(): string {
    return this.req + ' -> ' + '[' + this.provider + ']';
  }
}
