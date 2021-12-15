import {
  Bundle,
  BundleCapability,
  BundleRevision,
  BundleWire,
  BundleWiring,
  BUNDLE_NAMESPACE,
  PACKAGE_NAMESPACE,
} from '@pandino/pandino-api';
import { isAnyMissing, isAllPresent } from '../utils/helpers';
import { BundleImpl } from './bundle-impl';

export class BundleRevisionDependencies {
  private readonly dependentsMap: Map<BundleRevision, Map<BundleCapability, Set<BundleWire>>> = new Map<
    BundleRevision,
    Map<BundleCapability, Set<BundleWire>>
  >();

  addDependent(bw: BundleWire): void {
    const provider: BundleRevision = bw.getProvider();
    let caps: Map<BundleCapability, Set<BundleWire>> = this.dependentsMap.get(provider);
    if (isAnyMissing(caps)) {
      caps = new Map<BundleCapability, Set<BundleWire>>();
      this.dependentsMap.set(provider, caps);
    }
    let dependents: Set<BundleWire> = caps.get(bw.getCapability());
    if (isAnyMissing(dependents)) {
      dependents = new Set<BundleWire>();
      caps.set(bw.getCapability(), dependents);
    }
    dependents.add(bw);
  }

  removeDependents(provider: BundleRevision): void {
    this.dependentsMap.delete(provider);
  }

  getDependents(provider: BundleRevision): Map<BundleCapability, Set<BundleWire>> {
    return this.dependentsMap.get(provider);
  }

  hasRevisionDependents(revision: BundleRevision): boolean {
    return this.dependentsMap.has(revision);
  }

  hasBundleDependents(bundle: Bundle): boolean {
    const rev: BundleImpl = bundle.getState() === 'UNINSTALLED' ? null : (bundle as BundleImpl);
    const revisions: Array<BundleRevision> = rev.getRevisions();
    for (const revision of revisions) {
      if (this.hasRevisionDependents(revision)) {
        return true;
      }
    }
    return false;
  }

  getProvidedWires(revision: BundleRevision, namespace: string): Array<BundleWire> {
    const providedWires: Array<BundleWire> = [];

    const providedCaps: Map<BundleCapability, Set<BundleWire>> = this.dependentsMap.get(revision);
    if (isAllPresent(providedCaps)) {
      const wiring = revision.getWiring();
      if (isAllPresent(wiring)) {
        const resolvedCaps: Array<BundleCapability> = wiring.getCapabilities(namespace);
        for (const resolvedCap of resolvedCaps) {
          const dependentWires: Set<BundleWire> = providedCaps.get(resolvedCap);
          if (isAllPresent(dependentWires)) {
            providedWires.push(...dependentWires);
          }
        }
      }
    }

    return providedWires;
  }

  getDependentBundles(bundle: Bundle): Set<Bundle> {
    const result: Set<Bundle> = new Set<Bundle>();

    const rev: BundleImpl = bundle.getState() === 'UNINSTALLED' ? null : (bundle as BundleImpl);
    const revisions: Array<BundleRevision> = rev.getRevisions();
    for (const revision of revisions) {
      const caps: Map<BundleCapability, Set<BundleWire>> = this.dependentsMap.get(revision);
      if (isAllPresent(caps)) {
        for (const wires of caps.values()) {
          for (const dependentWire of wires.values()) {
            result.add(dependentWire.getRequirer().getBundle());
          }
        }
      }
    }

    return result;
  }

  getImportingBundles(exporter: Bundle, exportCap: BundleCapability): Set<Bundle> {
    const result: Set<Bundle> = new Set<Bundle>();

    const pkgName: string = exportCap.getAttributes()[PACKAGE_NAMESPACE];
    const bndImpl: BundleImpl = exporter.getState() === 'UNINSTALLED' ? null : (exporter as BundleImpl);

    for (const revision of bndImpl.getRevisions()) {
      const caps: Map<BundleCapability, Set<BundleWire>> = this.dependentsMap.get(revision);
      if (isAllPresent(caps)) {
        for (const [cap, wires] of caps.entries()) {
          if (
            (cap.getNamespace() === PACKAGE_NAMESPACE && cap.getAttributes()[PACKAGE_NAMESPACE] === pkgName) ||
            cap.getNamespace() === BUNDLE_NAMESPACE
          ) {
            for (const dependentWire of wires) {
              result.add(dependentWire.getRequirer().getBundle());
            }
          }
        }
      }
    }

    // Return the results.
    return result;
  }

  getRequiringBundles(bundle: Bundle): Set<Bundle> {
    const result: Set<Bundle> = new Set<Bundle>();
    const bndImpl: BundleImpl = bundle.getState() === 'UNINSTALLED' ? null : (bundle as BundleImpl);

    for (const revision of bndImpl.getRevisions()) {
      const caps: Map<BundleCapability, Set<BundleWire>> = this.dependentsMap.get(revision);
      if (isAllPresent(caps)) {
        for (const [cap, wires] of caps.entries()) {
          if (cap.getNamespace() === BUNDLE_NAMESPACE) {
            for (const dependentWire of wires) {
              result.add(dependentWire.getRequirer().getBundle());
            }
          }
        }
      }
    }

    return result;
  }

  removeDependencies(bundle: Bundle): void {
    const bndImpl: BundleImpl = bundle.getState() === 'UNINSTALLED' ? null : (bundle as BundleImpl);
    const revs: Array<BundleRevision> = bndImpl.getRevisions();
    for (const rev of revs) {
      const wiring: BundleWiring = rev.getWiring();
      if (isAllPresent(wiring)) {
        for (const bw of wiring.getRequiredWires(null)) {
          const caps: Map<BundleCapability, Set<BundleWire>> = this.dependentsMap.get(bw.getProvider());
          if (isAllPresent(caps)) {
            const bundleCaps: Array<BundleCapability> = [];
            for (const [cap, wires] of caps.entries()) {
              wires.delete(bw);
              if (wires.size === 0) {
                bundleCaps.push(cap);
              }
            }
            for (const cap of bundleCaps) {
              caps.delete(cap);
            }
            if (caps.size === 0) {
              this.dependentsMap.delete(bw.getProvider());
            }
          }
        }
      }
    }
  }
}
