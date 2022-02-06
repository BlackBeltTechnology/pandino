import {
  Bundle,
  EFFECTIVE_DIRECTIVE,
  EFFECTIVE_RESOLVE,
  HOST_NAMESPACE,
  PACKAGE_NAMESPACE,
  RESOLUTION_DIRECTIVE,
} from '@pandino/pandino-api';
import { BundleRevisionImpl } from './bundle-revision-impl';
import { StatefulResolver } from './stateful-resolver';
import { isAnyMissing, isAllPresent } from '../utils/helpers';
import { BundleImpl } from './bundle-impl';
import { Requirement } from './resource/requirement';
import { Capability } from './resource/capability';
import { BundleWiring } from './bundle-wiring';
import { BundleRevision } from './bundle-revision';
import { BundleCapability } from './wiring/bundle-capability';
import { BundleWire } from './wiring/bundle-wire';
import { BundleRequirement } from './wiring/bundle-requirement';

export class BundleWiringImpl implements BundleWiring {
  private readonly configMap: Record<string, any> = {};
  private readonly resolver: StatefulResolver;
  private readonly revision: BundleRevisionImpl;
  private readonly wires: Array<BundleWire> = [];
  private readonly resolvedCaps: Array<BundleCapability> = [];
  private readonly resolvedReqs: Array<BundleRequirement> = [];
  private isDisposed = false;

  constructor(
    configMap: Record<string, any>,
    resolver: StatefulResolver,
    revision: BundleRevisionImpl,
    wires: Array<BundleWire> = [],
  ) {
    this.configMap = configMap;
    this.resolver = resolver;
    this.revision = revision;
    this.wires = [...wires];

    const reqList: Array<BundleRequirement> = [];

    for (const bw of wires) {
      if (bw.getRequirement().getNamespace() !== HOST_NAMESPACE || !reqList.includes(bw.getRequirement())) {
        reqList.push(bw.getRequirement());
      }
    }

    for (const req of this.revision.getDeclaredRequirements(null)) {
      if (req.getNamespace() === PACKAGE_NAMESPACE) {
        const resolution: string = req.getDirectives()[RESOLUTION_DIRECTIVE];
        if (isAllPresent(resolution) && resolution === 'dynamic') {
          reqList.push(req);
        }
      }
    }

    this.resolvedReqs = [...reqList];

    const capList: Array<BundleCapability> = [];

    for (const cap of this.revision.getDeclaredCapabilities(null)) {
      if (cap.getNamespace() !== PACKAGE_NAMESPACE) {
        let effective: string = cap.getDirectives()[EFFECTIVE_DIRECTIVE];
        if (isAnyMissing(effective) || effective === EFFECTIVE_RESOLVE) {
          capList.push(cap);
        }
      }
    }

    this.resolvedCaps = [...capList];
  }

  dispose(): void {
    this.isDisposed = true;
  }

  getBundle(): Bundle {
    return this.revision.getBundle();
  }

  isCurrent(): boolean {
    const bundle = this.getBundle();
    const current: BundleRevision =
      bundle.getState() === 'UNINSTALLED' ? null : (bundle as BundleImpl).getCurrentRevision();
    return isAllPresent(current) && current.getWiring() === this;
  }

  isInUse(): boolean {
    return !this.isDisposed;
  }

  getResourceCapabilities(namespace: string): Capability[] {
    return this.getCapabilities(namespace);
  }

  getCapabilities(namespace: string): BundleCapability[] {
    if (this.isInUse()) {
      let result: Array<BundleCapability> = this.resolvedCaps;
      if (isAllPresent(namespace)) {
        result = [];
        for (const cap of this.resolvedCaps) {
          if (cap.getNamespace() === namespace) {
            result.push(cap);
          }
        }
      }
      return result;
    }
    return [];
  }

  getProvidedWires(namespace: string): BundleWire[] {
    if (this.isInUse()) {
      return (this.revision.getBundle() as BundleImpl)
        .getFramework()
        .getDependencies()
        .getProvidedWires(this.revision, namespace);
    }
    return [];
  }

  getRequiredWires(namespace: string): BundleWire[] {
    if (this.isInUse()) {
      let result: Array<BundleWire> = [...this.wires];
      if (isAllPresent(namespace)) {
        result = this.wires.filter((bw) => bw.getRequirement().getNamespace() === namespace);
      }
      return result;
    }
    return [];
  }

  getRequirements(namespace: string): BundleRequirement[] {
    if (this.isInUse()) {
      let searchReqs: Array<BundleRequirement> = this.resolvedReqs;
      let result: Array<BundleRequirement> = this.resolvedReqs;

      if (isAllPresent(namespace)) {
        result = [];
        for (const req of searchReqs) {
          if (req.getNamespace() === namespace) {
            result.push(req);
          }
        }
      }
      return result;
    }
    return [];
  }

  getResource(): BundleRevision {
    return this.revision;
  }

  getResourceRequirements(namespace: string): Requirement[] {
    return this.getRequirements(namespace);
  }

  getRevision(): BundleRevision {
    return this.revision;
  }

  toString(): string {
    return this.revision.getBundle().toString();
  }
}
