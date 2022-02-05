import { MANDATORY_DIRECTIVE, USES_DIRECTIVE } from '@pandino/pandino-api';
import { ManifestParserImpl } from '../util/manifest-parser/manifest-parser-impl';
import { isAnyMissing } from '../../utils/helpers';
import { BundleCapability } from './bundle-capability';
import { BundleRevision } from '../bundle-revision';

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
      const names = ManifestParserImpl.parseDelimitedString(value, ',');
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
    if (
      this.revision.getVersion().compare(other.revision.getVersion()) === 0 &&
      this.getNamespace() === other.getNamespace()
    ) {
      return true;
    }
    return false;
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
}
