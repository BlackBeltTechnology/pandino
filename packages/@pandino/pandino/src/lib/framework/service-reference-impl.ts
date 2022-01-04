import {
  Bundle,
  ServiceProperties,
  ServiceReference,
  SERVICE_DEFAULT_RANK,
  SERVICE_ID,
  SERVICE_RANKING,
  PACKAGE_NAMESPACE,
} from '@pandino/pandino-api';
import { ServiceRegistrationImpl } from './service-registration-impl';
import { BundleCapabilityImpl } from './wiring/bundle-capability-impl';
import { BundleImpl } from './bundle-impl';
import { isAllPresent, isAnyMissing } from '../utils/helpers';
import { BundleRevision } from './bundle-revision';
import { BundleCapability } from './wiring/bundle-capability';
import { BundleWire } from './wiring/bundle-wire';

export const PACKAGE_SEPARATOR = '.';

export class ServiceReferenceImpl extends BundleCapabilityImpl implements ServiceReference<any> {
  private readonly reg: ServiceRegistrationImpl;
  private readonly bundle: Bundle;

  constructor(reg: ServiceRegistrationImpl, bundle: Bundle) {
    super(null, null, {}, {});
    this.reg = reg;
    this.bundle = bundle;
  }

  compareTo(other: ServiceReference<any>): number {
    const id: number = Number(this.getProperty(SERVICE_ID));
    const otherId: number = Number(other.getProperty(SERVICE_ID));

    if (id === otherId) {
      return 0;
    }

    const rankObj: number = Number(this.getProperty(SERVICE_RANKING));
    const otherRankObj: number = Number(other.getProperty(SERVICE_RANKING));

    const rank = !rankObj ? SERVICE_DEFAULT_RANK : rankObj;
    const otherRank = !otherRankObj ? SERVICE_DEFAULT_RANK : otherRankObj;

    if (rank - otherRank < 0) {
      return -1;
    } else if (rank - otherRank > 0) {
      return 1;
    }

    // If ranks are equal, then sort by service id in descending order.
    return otherId - id;
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

  getAttributes(): Record<string, any> {
    // TODO: this does not adhere to the reference implementation, should double check later
    return {
      ...this.getRegistration().getProperties(),
    };
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

  isAssignableTo(bundle: Bundle, className: string): boolean {
    if (bundle === this.bundle) {
      return true;
    }

    let allow: boolean;
    const pkgName = ServiceReferenceImpl.getClassPackage(className);

    const requesterRevision = (bundle as BundleImpl).getCurrentRevision();
    const requesterWire = ServiceReferenceImpl.getWire(requesterRevision, pkgName);
    const requesterCap = ServiceReferenceImpl.getPackageCapability(requesterRevision, pkgName);

    const providerRevision = (this.bundle as BundleImpl).getCurrentRevision();
    const providerWire = ServiceReferenceImpl.getWire(providerRevision, pkgName);
    const providerCap = ServiceReferenceImpl.getPackageCapability(providerRevision, pkgName);

    if (isAnyMissing(requesterWire) && isAnyMissing(providerWire)) {
      allow = true;
    } else if (isAnyMissing(requesterWire) && isAllPresent(providerWire)) {
      if (isAllPresent(requesterCap)) {
        allow = providerRevision.getWiring().getRevision().equals(requesterRevision);
      } else {
        allow = true;
      }
    } else if (requesterWire != null && providerWire == null) {
      if (isAllPresent(providerCap)) {
        allow = requesterWire.getProvider().equals(providerRevision);
      } else {
        allow = true;
      }
    } else {
      allow = providerWire.getProvider().equals(requesterWire.getProvider());
    }

    return allow;
  }

  private static getClassName(className?: string): string {
    if (isAnyMissing(className)) {
      return '';
    }
    return className.substring(className.lastIndexOf(PACKAGE_SEPARATOR), className.length - 1);
  }

  private static getClassPackage(className?: string): string {
    if (isAnyMissing(className)) {
      return '';
    }
    return className.substring(0, className.lastIndexOf(PACKAGE_SEPARATOR));
  }

  private static getWire(br: BundleRevision, name: string): BundleWire {
    if (isAllPresent(br.getWiring())) {
      const wires = br.getWiring().getRequiredWires(null);
      if (isAllPresent(wires)) {
        for (const w of wires) {
          if (
            w.getCapability().getNamespace() === PACKAGE_NAMESPACE &&
            w.getCapability().getAttributes()[PACKAGE_NAMESPACE] === name
          ) {
            return w;
          }
        }
      }
    }
    return null;
  }

  private static getPackageCapability(br: BundleRevision, name: string): BundleCapability {
    if (isAllPresent(br.getWiring())) {
      const capabilities = br.getWiring().getCapabilities(null);
      if (isAllPresent(capabilities)) {
        for (const c of capabilities) {
          if (c.getNamespace() === PACKAGE_NAMESPACE && c.getAttributes()[PACKAGE_NAMESPACE] === name) {
            return c;
          }
        }
      }
    }
    return null;
  }
}
