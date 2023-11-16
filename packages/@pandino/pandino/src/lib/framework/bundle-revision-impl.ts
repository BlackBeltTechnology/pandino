import type { ActivationPolicy, Bundle, BundleManifestHeaders } from '@pandino/pandino-api';
import { evaluateSemver } from '@pandino/filters';
import { BundleImpl } from './bundle-impl';
import { ManifestParserImpl } from './util/manifest-parser';
import type { ManifestParser } from './util/manifest-parser';
import type { Requirement, Capability, Resource } from './resource';
import type { BundleWiring } from './bundle-wiring';
import type { BundleRevision } from './bundle-revision';
import type { BundleRequirement } from './wiring/bundle-requirement';
import type { BundleCapability } from './wiring/bundle-capability';

export class BundleRevisionImpl implements BundleRevision, Resource {
  private readonly id: string;
  private readonly headerMap: Record<string, any>;
  private readonly manifestVersion: string;
  private readonly symbolicName: string;
  private readonly version: string;
  private readonly declaredCaps: Array<BundleCapability> = [];
  private readonly declaredReqs: Array<BundleRequirement> = [];

  private readonly bundle: BundleImpl;
  private readonly declaredActivationPolicy: ActivationPolicy;
  private wiring?: BundleWiring;

  constructor(bundle: BundleImpl, id: string, headerMap?: BundleManifestHeaders) {
    this.bundle = bundle;
    this.id = id;
    this.headerMap = headerMap ?? {};

    const mp: ManifestParser = new ManifestParserImpl(
      bundle.getFramework().getConfig(),
      this,
      this.headerMap as BundleManifestHeaders,
    );

    this.manifestVersion = mp.getManifestVersion();
    this.version = mp.getBundleVersion();
    this.declaredCaps = mp.getCapabilities();
    this.declaredReqs = mp.getRequirements();
    this.declaredActivationPolicy = mp.getActivationPolicy();
    this.symbolicName = mp.getSymbolicName();
  }

  getDeclaredActivationPolicy(): ActivationPolicy {
    return this.declaredActivationPolicy;
  }

  equals(other: any): boolean {
    if (other === undefined || other === null || !(other instanceof BundleRevisionImpl)) {
      return false;
    }
    return (
      this.getSymbolicName() === other.getSymbolicName() && evaluateSemver(this.getVersion(), 'eq', other.getVersion())
    );
  }

  getBundle(): Bundle {
    return this.bundle;
  }

  getCapabilities(namespace?: string): Capability[] {
    let result = this.declaredCaps;
    if (namespace) {
      result = this.declaredCaps.filter((cap) => cap.getNamespace() === namespace);
    }
    return result;
  }

  getDeclaredCapabilities(namespace?: string): BundleCapability[] {
    let result = this.declaredCaps;
    if (namespace) {
      result = this.declaredCaps.filter((cap) => cap.getNamespace() === namespace);
    }
    return result;
  }

  getDeclaredRequirements(namespace?: string): BundleRequirement[] {
    let result = this.declaredReqs;
    if (namespace) {
      result = this.declaredReqs.filter((req) => req.getNamespace() === namespace);
    }
    return result;
  }

  getRequirements(namespace?: string): Requirement[] {
    return this.getDeclaredRequirements(namespace);
  }

  getSymbolicName(): string {
    return this.symbolicName;
  }

  getVersion(): string {
    return this.version;
  }

  getWiring(): BundleWiring | undefined {
    return this.wiring;
  }

  getHeaders(): Record<string, any> {
    return { ...this.headerMap };
  }

  getManifestVersion(): string {
    return this.manifestVersion;
  }

  getId(): string {
    return this.id;
  }

  resolve(wiring?: BundleWiring): void {
    this.wiring = wiring;
  }

  toString(): string {
    return this.bundle + ' (R ' + this.id + ')';
  }
}
