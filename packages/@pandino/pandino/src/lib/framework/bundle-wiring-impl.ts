import { EFFECTIVE_DIRECTIVE, EFFECTIVE_RESOLVE, HOST_NAMESPACE, PACKAGE_NAMESPACE, RESOLUTION_DIRECTIVE } from '@pandino/pandino-api';
import type { Bundle, BundleState } from '@pandino/pandino-api';
import { BundleRevisionImpl } from './bundle-revision-impl';
import { BundleImpl } from './bundle-impl';
import type { Requirement, Capability } from './resource';
import type { BundleWiring } from './bundle-wiring';
import type { BundleRevision } from './bundle-revision';
import type { BundleCapability } from './wiring/bundle-capability';
import type { BundleWire } from './wiring/bundle-wire';
import type { BundleRequirement } from './wiring/bundle-requirement';
import { StatefulResolver } from './stateful-resolver';

export class BundleWiringImpl implements BundleWiring {
  // @ts-ignore
  private readonly configMap: Record<string, any>;
  // @ts-ignore
  private readonly resolver: StatefulResolver;
  private readonly revision: BundleRevisionImpl;
  private readonly wires: Array<BundleWire> = [];
  private readonly resolvedCaps: Array<BundleCapability> = [];
  private readonly resolvedReqs: Array<BundleRequirement> = [];
  private isDisposed = false;

  constructor(configMap: Record<string, any>, resolver: StatefulResolver, revision: BundleRevisionImpl, wires: Array<BundleWire> = []) {
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

    for (const req of this.revision.getDeclaredRequirements(undefined)) {
      if (req.getNamespace() === PACKAGE_NAMESPACE) {
        const resolution: string = req.getDirectives()[RESOLUTION_DIRECTIVE];
        if (resolution && resolution === 'dynamic') {
          reqList.push(req);
        }
      }
    }

    this.resolvedReqs = [...reqList];

    const capList: Array<BundleCapability> = [];

    for (const cap of this.revision.getDeclaredCapabilities(undefined)) {
      if (cap.getNamespace() !== PACKAGE_NAMESPACE) {
        let effective: string = cap.getDirectives()[EFFECTIVE_DIRECTIVE];
        if (!effective || effective === EFFECTIVE_RESOLVE) {
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
    const current: BundleRevision | undefined = bundle.getState() === 'UNINSTALLED' ? undefined : (bundle as BundleImpl).getCurrentRevision();
    return current ? current.getWiring() === this : false;
  }

  isInUse(): boolean {
    return !this.isDisposed;
  }

  getResourceCapabilities(namespace: string): Capability[] {
    return this.getCapabilities(namespace);
  }

  getCapabilities(namespace?: string): BundleCapability[] {
    if (this.isInUse()) {
      let result: Array<BundleCapability> = this.resolvedCaps;
      if (namespace) {
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
    throw new Error('Method not yet implemented!');
  }

  getRequiredWires(namespace?: string): BundleWire[] {
    if (this.isInUse()) {
      let result: Array<BundleWire> = [...this.wires];
      if (namespace) {
        result = this.wires.filter((bw) => bw.getRequirement().getNamespace() === namespace);
      }
      return result;
    }
    return [];
  }

  getRequirements(namespace?: string): BundleRequirement[] {
    if (this.isInUse()) {
      let searchReqs: Array<BundleRequirement> = this.resolvedReqs;
      let result: Array<BundleRequirement> = this.resolvedReqs;

      if (namespace) {
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

  allWireProvidersInAnyState(states: BundleState[] = []): boolean {
    return this.wires.every((w) => !!w.getProvider().getBundle() && states.includes(w.getProvider().getBundle()!.getState()));
  }

  toString(): string {
    return this.revision.getBundle().toString();
  }
}
