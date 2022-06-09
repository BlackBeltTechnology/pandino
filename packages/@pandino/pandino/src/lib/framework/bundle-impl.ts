import { eq, SemVer } from 'semver';
import {
  Bundle,
  BundleActivator,
  BundleContext,
  BundleManifestHeaders,
  BundleState,
  Logger,
  BUNDLE_ACTIVATOR,
  ServiceReference,
} from '@pandino/pandino-api';
import { Pandino } from '../../pandino';
import { BundleRevisionImpl } from './bundle-revision-impl';
import { isAllPresent, isAnyMissing } from '../utils/helpers';
import { BundleRevision } from './bundle-revision';

export class BundleImpl implements Bundle {
  private readonly id: number;
  private readonly manifestLocation: string;
  private readonly deploymentRoot?: string;
  private readonly headers: BundleManifestHeaders;
  private readonly pandino?: Pandino;
  private readonly installingBundle?: Bundle;
  private readonly useDeclaredActivationPolicy: boolean;
  private activator: BundleActivator;
  private context: BundleContext;
  private state: BundleState;
  private readonly revisions: BundleRevisionImpl[] = [];
  private currentRevision: BundleRevisionImpl;
  protected readonly logger: Logger;

  constructor(
    logger: Logger,
    id: number,
    headers: BundleManifestHeaders,
    manifestLocation: string,
    deploymentRoot?: string,
    pandino?: Pandino,
    installingBundle?: Bundle,
  ) {
    this.logger = logger;
    this.id = id;
    this.deploymentRoot = deploymentRoot;
    this.manifestLocation = manifestLocation;
    this.useDeclaredActivationPolicy = false;
    this.state = 'INSTALLED';
    this.headers = headers;
    this.pandino = pandino;
    this.installingBundle = installingBundle;
    if (
      isAllPresent(headers[BUNDLE_ACTIVATOR]) &&
      typeof (headers[BUNDLE_ACTIVATOR] as BundleActivator).start === 'function'
    ) {
      this.activator = headers[BUNDLE_ACTIVATOR] as BundleActivator;
    }
    if (isAllPresent(pandino)) {
      const revision = this.createRevision();
      this.addRevision(revision);
    }
  }

  getRegisteredServices(): ServiceReference<any>[] {
    return this.getFramework().getBundleRegisteredServices(this);
  }

  getServicesInUse(): ServiceReference<any>[] {
    throw new Error('Method not implemented.');
  }

  getBundleId(): number {
    return this.id;
  }

  getBundleContext(): BundleContext {
    return this.context;
  }

  setBundleContext(context: BundleContext): void {
    this.context = context;
  }

  getHeaders(): BundleManifestHeaders {
    return this.headers;
  }

  getState(): BundleState {
    return this.state;
  }

  setState(state: BundleState): void {
    this.state = state;
  }

  getSymbolicName(): string {
    return this.getCurrentRevision().getSymbolicName();
  }

  getVersion(): SemVer {
    return this.getCurrentRevision().getVersion();
  }

  async start(options?: BundleState): Promise<void> {
    await this.getFramework().startBundle(this);
  }

  async stop(options?: BundleState): Promise<void> {
    await this.getFramework().stopBundle(this);
  }

  async uninstall(): Promise<void> {
    return this.getFramework().uninstallBundle(this);
  }

  async update(headers: BundleManifestHeaders, bundle?: Bundle): Promise<void> {
    await this.getFramework().updateBundle(this, headers, bundle);
  }

  getUniqueIdentifier(): string {
    return this.getSymbolicName() + '-' + this.getVersion().toString();
  }

  getActivator(): BundleActivator {
    return this.activator;
  }

  setActivator(activator: BundleActivator): void {
    this.activator = activator;
  }

  getDeploymentRoot(): string | undefined {
    return this.deploymentRoot;
  }

  revise(headers: BundleManifestHeaders): void {
    const updatedRevision = this.createRevision(headers);
    this.addRevision(updatedRevision);
  }

  async refresh(): Promise<void> {
    const current = this.getCurrentRevision();

    if (this.isRemovalPending()) {
      this.closeRevisions();
    } else {
      this.getFramework().getResolver().removeRevision(current);
      current.resolve(null);
    }

    this.revisions.length = 0;
    this.addRevision(current);
    this.state = 'INSTALLED';
  }

  private createRevision(headers?: BundleManifestHeaders): BundleRevisionImpl {
    const revision = new BundleRevisionImpl(
      this,
      this.getBundleId() + '.' + this.revisions.length,
      headers || this.headers,
    );

    let bundleVersion = revision.getVersion();
    bundleVersion = isAnyMissing(bundleVersion) ? new SemVer('0.0.0') : bundleVersion;
    const symName = revision.getSymbolicName();

    const collisionCandidates: Array<Bundle> = [];
    const bundles = this.getFramework().getBundles();
    for (let i = 0; Array.isArray(bundles) && i < bundles.length; i++) {
      const id = (bundles[i] as BundleImpl).getBundleId();
      if (id !== this.getBundleId()) {
        if (symName === bundles[i].getSymbolicName() && eq(bundleVersion, bundles[i].getVersion())) {
          collisionCandidates.push(bundles[i]);
        }
      }
    }
    if (collisionCandidates.length && isAllPresent(this.installingBundle)) {
      throw new Error('Bundle symbolic name and version are not unique: ' + symName + ':' + bundleVersion);
    }

    return revision;
  }

  private closeRevisions(): void {
    for (const br of this.revisions) {
      this.getFramework().getResolver().removeRevision(br);
    }
  }

  isRemovalPending(): boolean {
    return this.state === 'UNINSTALLED' || this.revisions.length > 1;
  }

  addRevision(revision: BundleRevisionImpl): void {
    this.revisions.unshift(revision);
    this.currentRevision = revision;

    this.getFramework().getResolver().addRevision(revision);
  }

  getFramework(): Pandino {
    return this.pandino;
  }

  getCurrentRevision(): BundleRevisionImpl {
    return this.currentRevision;
  }

  getRevisions(): BundleRevision[] {
    return this.revisions;
  }

  getLocation(): string {
    return this.manifestLocation;
  }

  toString(): string {
    return `${this.getSymbolicName()}: ${this.getVersion().toString()}`;
  }
}
