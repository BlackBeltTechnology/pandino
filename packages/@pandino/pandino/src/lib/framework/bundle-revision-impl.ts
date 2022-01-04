import { SemVer } from 'semver';
import { ActivationPolicy, Bundle } from '@pandino/pandino-api';
import { BundleImpl } from './bundle-impl';
import { ManifestParserImpl } from './util/manifest-parser/manifest-parser-impl';
import { isAllPresent, isAnyMissing } from '../utils/helpers';
import { Requirement } from './resource/requirement';
import { ManifestParser } from './util/manifest-parser/manifest-parser';
import { Capability } from './resource/capability';
import { BundleWiring } from './bundle-wiring';
import { BundleRevision } from './bundle-revision';
import { Resource } from './resource/resource';
import { BundleCapability } from './wiring/bundle-capability';
import { BundleRequirement } from './wiring/bundle-requirement';

export class BundleRevisionImpl implements BundleRevision, Resource {
  private readonly id: string;
  private readonly headerMap: Record<string, any>;
  private readonly manifestVersion: string;
  private readonly symbolicName: string;
  private readonly version: SemVer;
  private readonly declaredCaps: Array<BundleCapability> = [];
  private readonly declaredReqs: Array<BundleRequirement> = [];

  private readonly bundle: BundleImpl;
  private wiring: BundleWiring;
  private declaredActivationPolicy: ActivationPolicy;

  constructor(bundle: BundleImpl, id: string, headerMap?: Record<string, any>) {
    this.bundle = bundle;
    this.id = id;
    this.headerMap = headerMap;

    const mp: ManifestParser = new ManifestParserImpl(bundle.getFramework().getConfig(), this, headerMap);

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
    if (isAnyMissing(other) || !(other instanceof BundleRevisionImpl)) {
      return false;
    }
    return this.getSymbolicName() === other.getSymbolicName() && this.getVersion().compare(other.getVersion()) === 0;
  }

  getBundle(): Bundle {
    return this.bundle;
  }

  getCapabilities(namespace: string): Capability[] {
    let result = this.declaredCaps;
    if (!isAnyMissing(namespace)) {
      result = this.declaredCaps.filter((cap) => cap.getNamespace() === namespace);
    }
    return result;
  }

  getDeclaredCapabilities(namespace: string): BundleCapability[] {
    let result = this.declaredCaps;
    if (!isAnyMissing(namespace)) {
      result = this.declaredCaps.filter((cap) => cap.getNamespace() === namespace);
    }
    return result;
  }

  getDeclaredRequirements(namespace: string): BundleRequirement[] {
    let result = this.declaredReqs;
    if (isAllPresent(namespace)) {
      result = this.declaredReqs.filter((req) => req.getNamespace() === namespace);
    }
    return result;
  }

  getRequirements(namespace: string): Requirement[] {
    return this.getDeclaredRequirements(namespace);
  }

  getSymbolicName(): string {
    return this.symbolicName;
  }

  getVersion(): SemVer {
    return this.version;
  }

  getWiring(): BundleWiring {
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

  resolve(wiring: BundleWiring): void {
    if (isAllPresent(this.wiring)) {
      this.wiring = null;
    }

    if (isAllPresent(wiring)) {
      this.wiring = wiring;
    }
  }

  toString(): string {
    return this.bundle.toString() + '(R ' + this.id + ')';
  }
}
