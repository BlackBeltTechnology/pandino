import {
  BundleCapability,
  BundleRevision,
  BundleWire,
  BundleWiring,
  ServiceRegistry,
  Logger,
  SYSTEM_BUNDLE_SYMBOLICNAME,
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

  async resolveOne(revision: BundleRevision): Promise<void> {
    const bundleWiring = this.resolve(revision as BundleRevisionImpl, this.getEligibleCapabilities());
    if (bundleWiring) {
      this.logger.debug(
        `Bundle Wiring created for Revision: ${revision.getSymbolicName()}: ${revision.getVersion().toString()}`,
      );

      const bundle = bundleWiring.getRevision().getBundle();
      this.pandino.setBundleStateAndNotify(bundle as BundleImpl, 'RESOLVED');
      this.pandino.fireBundleEvent('RESOLVED', bundle);

      try {
        await this.pandino.startBundle(bundle as BundleImpl);
        const unresolvedRevs = this.revisions.filter((r) => isAnyMissing(r.getWiring()));
        const revsToReRun = unresolvedRevs.filter((r) => {
          const wires = this.getResolvableWires(r, this.getEligibleCapabilities());
          return r.getSymbolicName() !== SYSTEM_BUNDLE_SYMBOLICNAME && StatefulResolver.canBundleBeResolved(r, wires);
        });
        for (const rev of revsToReRun) {
          // On paper, we are not required to await for recursive calls, time will tell...
          this.resolveOne(rev);
        }
      } catch (err) {
        this.logger.error(err);
      }
    }
  }

  getActiveRequirers(bundle: BundleImpl): BundleImpl[] {
    const bundles: BundleImpl[] = [];
    // rev.getWiring().getRequiredWires(null)
    const wirings = this.revisions
      .filter((rev) => !!rev.getWiring())
      .map((rev) => rev.getWiring())
      .filter((wiring) => wiring.isInUse());
    for (const wiring of wirings) {
      const wire = wiring
        .getRequiredWires(null)
        .find((wire: BundleWire) => wire.getProvider().equals(bundle.getCurrentRevision()));
      if (wire) {
        bundles.push(wire.getRequirer().getBundle() as BundleImpl);
      }
    }
    return bundles;
  }

  /**
   * Currently in the resolving process, we only take ACTIVE Bundles into consideration. Intentionally skipping RESOLVED
   * ones, given we are expecting all Bundles to have at least a start() being called from A {@link BundleActivator}.
   *
   * TODO: investigate whether bundles should be returned instead, and resolution would only succeed if a single bundle provides all the necessary capabilities instead of the full list.
   *
   * @private
   */
  private getEligibleCapabilities(): BundleCapability[] {
    const caps: BundleCapability[] = [];
    const activeRevisions: BundleRevision[] = this.revisions.filter((rev) => rev.getBundle().getState() === 'ACTIVE');
    for (const rev of activeRevisions) {
      caps.push(...rev.getDeclaredCapabilities(null));
    }
    return caps;
  }

  private resolve(rev: BundleRevisionImpl, allProvidedCapabilities: BundleCapability[]): BundleWiring | undefined {
    const wires = this.getResolvableWires(rev, allProvidedCapabilities);

    if (StatefulResolver.canBundleBeResolved(rev, wires)) {
      const bundleWiring = new BundleWiringImpl(rev.getHeaders(), this, rev, wires);
      rev.resolve(bundleWiring);
      return bundleWiring;
    }
  }

  private static canBundleBeResolved(rev: BundleRevision, wires: Array<BundleWire>): boolean {
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
