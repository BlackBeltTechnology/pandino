import {
  BUNDLE_COPYRIGHT,
  BUNDLE_DESCRIPTION,
  BUNDLE_NAMESPACE,
  BUNDLE_VERSION_ATTRIBUTE,
  BundleConfigMap,
  CAPABILITY_COPYRIGHT_ATTRIBUTE,
  CAPABILITY_DESCRIPTION_ATTRIBUTE,
  CAPABILITY_SINGLETON_DIRECTIVE,
  CAPABILITY_TYPE_ATTRIBUTE,
  CAPABILITY_VERSION_ATTRIBUTE,
  FRAGMENT_HOST,
  IDENTITY_NAMESPACE,
  MANDATORY_DIRECTIVE,
  SINGLETON_DIRECTIVE,
  TYPE_BUNDLE,
  TYPE_FRAGMENT,
  USES_DIRECTIVE,
} from '@pandino/pandino-api';
import { evaluateSemver } from '@pandino/filters';
import { isAnyMissing } from '../../utils/helpers';
import { BundleCapability } from './bundle-capability';
import { BundleRevision } from '../bundle-revision';
import { parseDelimitedString } from '../util/manifest-parser/utils';

export class BundleCapabilityImpl implements BundleCapability {
  private readonly revision: BundleRevision;
  private readonly namespace: string;
  private readonly dirs: Record<string, string> = {};
  private readonly attrs: Record<string, any> = {};
  private readonly uses: string[] = [];
  private readonly mandatory: Set<string> = new Set<string>();

  constructor(
    revision: BundleRevision,
    namespace: string,
    dirs: Record<string, string> = {},
    attrs: Record<string, any> = {},
  ) {
    this.revision = revision;
    this.namespace = namespace;
    this.dirs = dirs;
    this.attrs = attrs;

    let value = this.dirs[USES_DIRECTIVE];
    if (value !== null && value !== undefined) {
      const uses: string[] = value.split(',').map((i) => i.trim());
      for (const u of uses) {
        this.uses.push(u);
      }
    }

    let mandatory: Set<string> = new Set<string>();
    value = this.dirs[MANDATORY_DIRECTIVE];
    if (value !== null && value !== undefined) {
      const names = parseDelimitedString(value, ',');
      for (let name of names) {
        if (this.attrs.hasOwnProperty(name)) {
          mandatory.add(name);
        } else {
          throw new Error("Mandatory attribute '" + name + "' does not exist.");
        }
      }
    }
    this.mandatory = mandatory;
  }

  equals(other: any): boolean {
    if (isAnyMissing(other) || !(other instanceof BundleCapabilityImpl)) {
      return false;
    }

    return (
      evaluateSemver(this.revision.getVersion(), 'eq', other.revision.getVersion()) &&
      this.getNamespace() === other.getNamespace()
    );
  }

  getAttributes(): Record<string, any> {
    return this.attrs;
  }

  getDirectives(): Record<string, string> {
    return this.dirs;
  }

  getNamespace(): string {
    return this.namespace;
  }

  getResource(): BundleRevision {
    return this.revision;
  }

  getRevision(): BundleRevision {
    return this.revision;
  }

  isAttributeMandatory(name: string): boolean {
    return this.mandatory.size > 0 && this.mandatory.has(name);
  }

  getUses(): string[] {
    return this.uses;
  }

  toString(): string {
    if (isAnyMissing(this.revision)) {
      return this.stringifyAttributes();
    }
    return '[' + this.revision + '] ' + this.namespace + '; ' + this.stringifyAttributes();
  }

  private stringifyAttributes(): string {
    const list: string[] = Object.keys(this.attrs).map((key) => `${key}=${this.attrs[key]}`);
    return `${list.join('; ')}`;
  }

  public static addIdentityCapability(
    owner: BundleRevision,
    headerMap: BundleConfigMap,
    bundleCap: BundleCapability,
  ): BundleCapability {
    const attrs: BundleConfigMap = { ...bundleCap.getAttributes() };

    attrs[IDENTITY_NAMESPACE] = bundleCap.getAttributes()[BUNDLE_NAMESPACE];
    attrs[CAPABILITY_TYPE_ATTRIBUTE] = !headerMap[FRAGMENT_HOST] ? TYPE_BUNDLE : TYPE_FRAGMENT;
    attrs[CAPABILITY_VERSION_ATTRIBUTE] = bundleCap.getAttributes()[BUNDLE_VERSION_ATTRIBUTE];

    if (headerMap[BUNDLE_COPYRIGHT]) {
      attrs[CAPABILITY_COPYRIGHT_ATTRIBUTE] = headerMap[BUNDLE_COPYRIGHT];
    }

    if (headerMap[BUNDLE_DESCRIPTION]) {
      attrs[CAPABILITY_DESCRIPTION_ATTRIBUTE] = headerMap[BUNDLE_DESCRIPTION];
    }

    let dirs: Record<string, any>;
    if (bundleCap.getDirectives()[SINGLETON_DIRECTIVE]) {
      dirs = { [CAPABILITY_SINGLETON_DIRECTIVE]: bundleCap.getDirectives()[SINGLETON_DIRECTIVE] };
    } else {
      dirs = {};
    }
    return new BundleCapabilityImpl(owner, IDENTITY_NAMESPACE, dirs, attrs);
  }
}
