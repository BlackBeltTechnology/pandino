import { BundleState, Logger, SYSTEM_BUNDLE_SYMBOLICNAME } from '@pandino/pandino-api';
import { Pandino } from '../../pandino';
import { CapabilitySet } from './capability-set/capability-set';
import { BundleRevisionImpl } from './bundle-revision-impl';
import { BundleRequirementImpl } from './wiring/bundle-requirement-impl';
import { BundleWireImpl } from './wiring/bundle-wire-impl';
import { BundleWiringImpl } from './bundle-wiring-impl';
import { BundleImpl } from './bundle-impl';
import type { BundleWiring } from './bundle-wiring';
import type { BundleRevision } from './bundle-revision';
import type { ServiceRegistry } from './service-registry';
import type { BundleCapability } from './wiring/bundle-capability';
import type { BundleWire } from './wiring/bundle-wire';

export class StatefulResolver {
  private readonly pandino: Pandino;
  private readonly revisions: Array<BundleRevision> = [];
  // private readonly registry: ServiceRegistry;
  private readonly logger: Logger;

  constructor(logger: Logger, pandino: Pandino, registry: ServiceRegistry) {
    this.logger = logger;
    this.pandino = pandino;
    // this.registry = registry;
  }

  async resolveOne(revision: BundleRevision): Promise<void> {
    if (revision.getBundle() && ['ACTIVE', 'STARTING'].includes(revision.getBundle()!.getState())) {
      return;
    }

    const bundleWiring = this.resolve(revision as BundleRevisionImpl);
    if (bundleWiring) {
      this.logger.debug(`Bundle Wiring created for Revision: ${revision.getSymbolicName()}: ${revision.getVersion().toString()}`);

      const bundle = bundleWiring.getRevision().getBundle();
      if (bundle) {
        this.pandino.fireBundleEvent('RESOLVED', bundle);

        try {
          await this.pandino.startBundle(bundle as BundleImpl);
          await this.resolveRemaining();
        } catch (err) {
          this.logger.error(err);
        }
      } else {
        this.logger.debug(`Bundle not found in Revision: ${revision.getSymbolicName()}: ${revision.getVersion().toString()}`);
      }
    } else {
      this.logger.debug(`No Wiring found for Revision: ${revision.getSymbolicName()}: ${revision.getVersion().toString()}`);
    }
  }

  async resolveRemaining(): Promise<void> {
    const revsToReRun = this.revisions.filter((r) => {
      const wires = StatefulResolver.getResolvableWires(r, this.getEligibleCapabilities());
      return r.getSymbolicName() !== SYSTEM_BUNDLE_SYMBOLICNAME && StatefulResolver.canBundleBeResolved(r, wires);
    });
    for (const rev of revsToReRun) {
      await this.resolveOne(rev);
    }
  }

  getActiveRequirers(bundle: BundleImpl): BundleImpl[] {
    const bundles: BundleImpl[] = [];
    // rev.getWiring().getRequiredWires(null)
    const wirings = this.revisions
      .filter((rev) => !!rev.getWiring())
      .map((rev) => rev.getWiring()!)
      .filter((wiring) => wiring.isInUse());
    for (const wiring of wirings) {
      const wire = wiring.getRequiredWires(undefined).find((wire: BundleWire) => wire.getProvider().equals(bundle.getCurrentRevision()));
      if (wire) {
        bundles.push(wire.getRequirer().getBundle() as BundleImpl);
      }
    }
    return bundles;
  }

  /**
   * Currently in the resolving process, we only take ACTIVE Bundles into consideration. Given we are expecting all
   * Bundles to have at least a start() being called from A {@link BundleActivator}.
   */
  private getEligibleCapabilities(): BundleCapability[] {
    const caps: BundleCapability[] = [];
    const activeRevisions: BundleRevision[] = this.revisions.filter((rev) => rev.getBundle()?.getState() === 'ACTIVE');
    for (const rev of activeRevisions) {
      caps.push(...rev.getDeclaredCapabilities(undefined));
    }
    return caps;
  }

  private resolve(rev: BundleRevisionImpl): BundleWiring | undefined {
    const wiring = this.createWiringForRevision(rev);

    rev.resolve(wiring);
    return wiring;
  }

  private static canBundleBeResolved(rev: BundleRevision, wires: Array<BundleWire>): boolean {
    const validStates: BundleState[] = ['INSTALLED', 'STARTING', 'ACTIVE'];
    if (!rev.getBundle() || !validStates.includes(rev.getBundle()!.getState())) {
      return false;
    }
    const requirements = rev.getDeclaredRequirements(undefined);
    const reqs = requirements.map((r) => r.getNamespace());
    const wireCaps = wires.map((w) => w.getCapability().getNamespace());

    return requirements.length === 0 || reqs.every((r) => wireCaps.includes(r));
  }

  static getResolvableWires(rev: BundleRevision, allProvidedCapabilities: BundleCapability[]): Array<BundleWire> {
    const requirements = rev.getDeclaredRequirements(undefined);
    const wires: Array<BundleWire> = [];
    for (const req of requirements) {
      const filter = (req as BundleRequirementImpl).getFilter();
      const providedCap = allProvidedCapabilities.find((p) => p.getNamespace() === req.getNamespace() && (filter ? CapabilitySet.matches(p, filter) : true));
      if (providedCap) {
        const wire = new BundleWireImpl(req.getResource(), req, providedCap?.getResource()!, providedCap);
        wires.push(wire);
      }
    }
    return wires;
  }

  createWiringForRevision(revision: BundleRevision): BundleWiring | undefined {
    const wires = StatefulResolver.getResolvableWires(revision, this.getEligibleCapabilities());

    if (StatefulResolver.canBundleBeResolved(revision, wires)) {
      const impl = revision as BundleRevisionImpl;
      return new BundleWiringImpl(impl.getHeaders(), this, impl, wires);
    }
    return undefined;
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
