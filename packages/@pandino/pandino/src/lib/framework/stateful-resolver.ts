import {
  BundleCapability,
  BundleRevision,
  BundleWire,
  BundleWiring,
  ServiceRegistry,
  Logger,
} from '@pandino/pandino-api';
import Pandino from '../../pandino';
import { CapabilitySet } from './capability-set/capability-set';
import { BundleRevisionImpl } from './bundle-revision-impl';
import { BundleRequirementImpl } from './wiring/bundle-requirement-impl';
import { isAnyMissing } from '../utils/helpers';
import { BundleWireImpl } from './wiring/bundle-wire-impl';
import { BundleWiringImpl } from './bundle-wiring-impl';
import { BundleImpl } from './bundle-impl';

export class StatefulResolver {
  private readonly pandino: Pandino;
  private readonly revisions: Array<BundleRevision> = [];
  private readonly registry: ServiceRegistry;
  private readonly logger: Logger;

  constructor(logger: Logger, pandino: Pandino, registry: ServiceRegistry) {
    this.logger = logger;
    this.pandino = pandino;
    this.registry = registry;
  }

  async resolveAll(): Promise<void> {
    this.logger.debug('Start Resolve...');
    const allProvidedCapabilities: BundleCapability[] = [];
    for (const rev of this.revisions) {
      allProvidedCapabilities.push(...rev.getDeclaredCapabilities(null));
    }

    const unresolvedRevs = this.revisions.filter((r) => isAnyMissing(r.getWiring()));
    for (const rev of unresolvedRevs) {
      const bundleWiring = await this.resolve(rev as BundleRevisionImpl, allProvidedCapabilities);
      if (bundleWiring) {
        this.logger.debug(
          `Bundle Wiring created for Revision: ${rev.getSymbolicName()}: ${rev.getVersion().toString()}`,
        );
        const bundle = bundleWiring.getRevision().getBundle();
        this.pandino.setBundleStateAndNotify(bundle as BundleImpl, 'RESOLVED');
        this.pandino.fireBundleEvent('RESOLVED', bundle);
        const resolvedIdx = unresolvedRevs.findIndex((r) => r.equals(rev));
        unresolvedRevs.splice(resolvedIdx, 1);

        try {
          await this.pandino.startBundle(bundle as BundleImpl);
        } catch (err) {
          this.logger.error(err);
        }
      }
    }

    const revsToReRun = unresolvedRevs.filter((r) => {
      const wires = this.getResolvableWires(r, allProvidedCapabilities);
      return this.canBundleBeResolved(r, wires);
    });

    if (revsToReRun.length) {
      await this.resolveAll();
    }

    return Promise.resolve();
  }

  getActiveRequirers(bundle: BundleImpl): BundleImpl[] {
    const bundles: BundleImpl[] = [];
    // rev.getWiring().getRequiredWires(null)
    const wirings = this.revisions.map((rev) => rev.getWiring()).filter((wiring) => wiring.isInUse());
    for (const wiring of wirings) {
      const wire = wiring.getRequiredWires(null).find((wire) => wire.getProvider().equals(bundle.getCurrentRevision()));
      if (wire) {
        bundles.push(wire.getRequirer().getBundle() as BundleImpl);
      }
    }
    return bundles;
  }

  private async resolve(
    rev: BundleRevisionImpl,
    allProvidedCapabilities: BundleCapability[],
  ): Promise<BundleWiring | undefined> {
    const wires = this.getResolvableWires(rev, allProvidedCapabilities);

    if (this.canBundleBeResolved(rev, wires)) {
      const bundleWiring = new BundleWiringImpl(rev.getHeaders(), this, rev, wires);
      rev.resolve(bundleWiring);
      return Promise.resolve(bundleWiring);
    }
    return Promise.resolve(undefined);
  }

  private canBundleBeResolved(rev: BundleRevision, wires: Array<BundleWire>): boolean {
    const requirements = rev.getDeclaredRequirements(null);

    return requirements.length === 0 || wires.length === requirements.length;
  }

  private getResolvableWires(rev: BundleRevision, allProvidedCapabilities: BundleCapability[]): Array<BundleWire> {
    const requirements = rev.getDeclaredRequirements(null);
    const wires: Array<BundleWire> = [];
    for (const req of requirements) {
      const filter = (req as BundleRequirementImpl).getFilter();
      const providedCap = allProvidedCapabilities.find((p) => CapabilitySet.matches(p, filter));
      if (providedCap) {
        const wire = new BundleWireImpl(req.getResource(), req, providedCap?.getResource(), providedCap);
        wires.push(wire);
      }
    }
    return wires;
  }

  addRevision(br: BundleRevision): void {
    this.removeRevision(br);
    this.revisions.push(br);
  }

  removeRevision(br: BundleRevision): void {
    const idx = this.revisions.findIndex((r) => r.equals(br));
    if (idx > 0) {
      this.revisions.splice(idx, 1);
    }
  }
}
