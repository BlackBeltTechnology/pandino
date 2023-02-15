import { RESOLUTION_DIRECTIVE, RESOLUTION_OPTIONAL } from '@pandino/pandino-api';
import { CapabilitySet } from '../capability-set/capability-set';
import Filter from '../../filter/filter';
import { BundleRevision } from '../bundle-revision';
import { BundleCapability } from './bundle-capability';
import { BundleRequirement } from './bundle-requirement';
import { convert } from '../../filter';

export class BundleRequirementImpl implements BundleRequirement {
  private readonly revision: BundleRevision;
  private readonly namespace: string;
  private readonly filter?: Filter;
  private readonly optional: boolean;
  private readonly dirs: Record<string, string> = {};
  private readonly attrs: Record<string, any> = {};

  constructor(
    revision: BundleRevision,
    namespace: string,
    dirs: Record<string, string> = {},
    attrs: Record<string, any> = {},
    filter?: Filter,
  ) {
    this.revision = revision;
    this.namespace = namespace;
    this.dirs = dirs;
    this.attrs = attrs;
    this.filter = filter || convert(this.attrs);
    this.optional =
      this.dirs.hasOwnProperty(RESOLUTION_DIRECTIVE) && this.dirs[RESOLUTION_DIRECTIVE] === RESOLUTION_OPTIONAL;
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

  matches(capability: BundleCapability): boolean {
    return CapabilitySet.matches(capability, this.getFilter());
  }

  isOptional(): boolean {
    return this.optional;
  }

  getFilter?(): Filter {
    return this.filter;
  }

  toString(): string {
    return '[' + this.revision + '] ' + this.namespace + '; ' + this.getFilter()?.toString();
  }
}
