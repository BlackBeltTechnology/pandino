import {
  SERVICE_DEFAULT_RANK,
  SERVICE_ID,
  SERVICE_RANKING,
  PACKAGE_NAMESPACE,
  OBJECTCLASS,
} from '@pandino/pandino-api';
import type { Bundle, ServiceProperties, ServiceReference } from '@pandino/pandino-api';
import { ServiceRegistrationImpl } from './service-registration-impl';
import { BundleCapabilityImpl } from './wiring/bundle-capability-impl';
import { BundleImpl } from './bundle-impl';
import type { BundleRevision } from './bundle-revision';
import type { BundleCapability } from './wiring/bundle-capability';
import type { BundleWire } from './wiring/bundle-wire';

export const PACKAGE_SEPARATOR = '.';

export class ServiceReferenceImpl extends BundleCapabilityImpl implements ServiceReference<any> {
  private readonly reg: ServiceRegistrationImpl;
  private readonly bundle: Bundle;

  constructor(reg: ServiceRegistrationImpl, bundle: Bundle) {
    super(undefined, undefined, {}, {});
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
    return {
      ...this.getRegistration().getProperties(),
    };
  }

  getUses(): string[] {
    return [];
  }

  getBundle(): Bundle | undefined {
    if (this.reg.isValid()) {
      return this.bundle;
    }
    return undefined;
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

    if (!requesterWire && !providerWire) {
      allow = true;
    } else if (!requesterWire && providerWire) {
      if (requesterCap) {
        const wiring = providerRevision.getWiring();
        allow = wiring ? wiring.getRevision().equals(requesterRevision) : false;
      } else {
        allow = true;
      }
    } else if (requesterWire && !providerWire) {
      if (providerCap) {
        allow = requesterWire.getProvider().equals(providerRevision);
      } else {
        allow = true;
      }
    } else {
      allow = providerWire!.getProvider().equals(requesterWire!.getProvider());
    }

    return allow;
  }

  hasObjectClass(objectClass: string): boolean {
    const classOrArray = this.getProperty(OBJECTCLASS);
    return Array.isArray(classOrArray) ? classOrArray.includes(objectClass) : classOrArray === objectClass;
  }

  private static getClassPackage(className?: string): string {
    if (!className) {
      return '';
    }
    return className.substring(0, className.lastIndexOf(PACKAGE_SEPARATOR));
  }

  private static getWire(br: BundleRevision, name: string): BundleWire | undefined {
    const wiring = br.getWiring();
    if (wiring) {
      const wires = wiring.getRequiredWires(undefined);
      if (Array.isArray(wires)) {
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
    return undefined;
  }

  private static getPackageCapability(br: BundleRevision, name: string): BundleCapability | undefined {
    const wiring = br.getWiring();
    if (wiring) {
      const capabilities = wiring.getCapabilities(undefined);
      if (Array.isArray(capabilities)) {
        for (const c of capabilities) {
          if (c.getNamespace() === PACKAGE_NAMESPACE && c.getAttributes()[PACKAGE_NAMESPACE] === name) {
            return c;
          }
        }
      }
    }
    return undefined;
  }
}
