import {
  Bundle,
  ServiceProperties,
  ServiceReference,
  SERVICE_DEFAULT_RANK,
  SERVICE_ID,
  SERVICE_RANKING,
  BundleRevision,
} from '@pandino/pandino-api';
import { ServiceRegistrationImpl } from './service-registration-impl';
import { BundleCapabilityImpl } from './wiring/bundle-capability-impl';

export class ServiceReferenceImpl extends BundleCapabilityImpl implements ServiceReference<any> {
  private readonly reg: ServiceRegistrationImpl;
  private readonly bundle: Bundle;

  constructor(reg: ServiceRegistrationImpl, bundle: Bundle) {
    super(null, null, {}, {});
    this.reg = reg;
    this.bundle = bundle;
  }

  compareTo(other: ServiceReference<any>): number {
    const id: string = this.getProperty(SERVICE_ID);
    const otherId: string = other.getProperty(SERVICE_ID);

    if (id === otherId) {
      return 0;
    }

    const rankObj = this.getProperty(SERVICE_RANKING);
    const otherRankObj = other.getProperty(SERVICE_RANKING);

    const rank = !rankObj ? SERVICE_DEFAULT_RANK : Number(rankObj);
    const otherRank = !otherRankObj ? SERVICE_DEFAULT_RANK : Number(otherRankObj);

    if (rank - otherRank < 0) {
      return -1;
    } else if (rank - otherRank > 0) {
      return 1;
    }

    // If ranks are equal, then sort by service id in descending order.
    return id.localeCompare(otherId) < 0 ? 1 : -1;
  }

  getRegistration(): ServiceRegistrationImpl {
    return this.reg;
  }

  getRevision(): BundleRevision {
    throw new Error('Not supported yet.');
  }

  getNamespace(): string {
    return 'service-reference';
  }

  getDirectives(): Record<string, string> {
    return {};
  }

  getUses(): string[] {
    return [];
  }

  getBundle(): Bundle {
    if (this.reg.isValid()) {
      return this.bundle;
    }
  }

  getProperties(): ServiceProperties {
    return this.reg.getProperties();
  }

  getProperty(key: string): any {
    return this.reg.getProperty(key);
  }

  getPropertyKeys(): Array<string> {
    return this.reg.getPropertyKeys();
  }

  getUsingBundles(): Bundle[] {
    return this.reg.getUsingBundles(this);
  }
}
