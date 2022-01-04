import { SemVer, eq as semverEq, lte as semverLte, gte as semverGte, neq as semverNeq } from 'semver';
import { BundleCapabilityImpl } from '../wiring/bundle-capability-impl';
import Filter, { FilterComp } from '../../filter/filter';
import { isAllPresent, isAnyMissing } from '../../utils/helpers';
import { BundleCapability } from '../wiring/bundle-capability';
import { Capability } from '../resource/capability';

export type CapabilityIndex = Record<any, Set<BundleCapability>>;

export class CapabilitySet {
  private readonly indices: Record<string, CapabilityIndex> = {};
  private readonly capSet: Set<Capability> = new Set<Capability>();

  constructor(indexProps: Array<string> = []) {
    for (const indexProp in indexProps) {
      this.indices[indexProp] = {};
    }
  }

  match(sf: Filter, obeyMandatory: boolean): Set<Capability> {
    const matches: Set<Capability> = this.matchCapSet(this.capSet, sf);
    return obeyMandatory ? this.matchMandatoryCapSet(matches, sf) : matches;
  }

  addCapability(cap: BundleCapability): void {
    this.capSet.add(cap);

    for (const [key, value] of Object.entries(this.indices)) {
      let value = cap.getAttributes()[key];
      if (isAllPresent(value)) {
        const index: CapabilityIndex = value;

        if (Array.isArray(value)) {
          const c: any[] = value;
          for (const o of c) {
            CapabilitySet.indexCapability(index, cap, o);
          }
        } else {
          CapabilitySet.indexCapability(index, cap, value);
        }
      }
    }
  }

  removeCapability(cap: BundleCapability): void {
    const hadCap = this.capSet.has(cap);
    this.capSet.delete(cap);
    if (hadCap) {
      for (const [key, eValue] of Object.entries(this.indices)) {
        let value = cap.getAttributes()[key];
        if (isAllPresent(value)) {
          const index: Record<any, Set<BundleCapability>> = eValue;

          if (Array.isArray(value)) {
            const c: any[] = value;
            for (const o of c) {
              CapabilitySet.deindexCapability(index, cap, o);
            }
          } else {
            CapabilitySet.deindexCapability(index, cap, value);
          }
        }
      }
    }
  }

  private static indexCapability(index: CapabilityIndex, cap: BundleCapability, capValue: any): void {
    let caps: Set<BundleCapability> = new Set<BundleCapability>();
    const prevVal: Set<BundleCapability> = index[capValue];
    if (!prevVal) {
      index[capValue] = caps;
    }
    if (isAllPresent(prevVal)) {
      caps = prevVal;
    }
    caps.add(cap);
  }

  private static deindexCapability(index: CapabilityIndex, cap: BundleCapability, value: any): void {
    let caps: Set<BundleCapability> = index[value];

    if (isAllPresent(caps)) {
      caps.delete(cap);
      if (caps.size === 0) {
        delete index[value];
      }
    }
  }

  private matchMandatoryCapSet(caps: Set<Capability>, sf: Filter): Set<Capability> {
    for (const cap of caps) {
      if (!CapabilitySet.matchMandatory(cap, sf)) {
        caps.delete(cap);
      }
    }
    return caps;
  }

  private matchCapSet(caps: Set<Capability>, sf: Filter): Set<Capability> {
    let matches: Set<Capability> = new Set<Capability>();

    if (sf.comp === FilterComp.MATCH_ALL) {
      caps.forEach((c) => matches.add(c));
    } else if (sf.comp === FilterComp.AND) {
      const sfs: Array<Filter> = sf.value;
      for (let i = 0; caps.size > 0 && i < sfs.length; i++) {
        matches = this.matchCapSet(caps, sfs[i]);
        caps = matches;
      }
    } else if (sf.comp === FilterComp.OR) {
      const sfs: Array<Filter> = sf.value;
      for (let i = 0; i < sfs.length; i++) {
        this.matchCapSet(caps, sfs[i]).forEach((c) => matches.add(c));
      }
    } else if (sf.comp === FilterComp.NOT) {
      caps.forEach((c) => matches.add(c));
      const sfs: Array<Filter> = sf.value;
      for (let i = 0; i < sfs.length; i++) {
        const ms = this.matchCapSet(caps, sfs[i]);
        ms.forEach((c) => matches.delete(c));
      }
    } else {
      const index: Record<any, Set<BundleCapability>> = this.indices[sf.attrib];
      if (sf.comp === FilterComp.EQ && isAllPresent(index)) {
        const existingCaps: Set<BundleCapability> = index[sf.attrib];
        if (isAllPresent(existingCaps)) {
          existingCaps.forEach((c) => matches.add(c));
          if (caps !== this.capSet) {
            caps.forEach((c) => {
              if (!matches.has(c)) {
                matches.delete(c);
              }
            });
          }
        }
      } else {
        for (const cap of caps) {
          const lhs: any = cap.getAttributes()[sf.attrib];
          if (isAllPresent(lhs)) {
            if (CapabilitySet.compare(lhs, sf.value, sf.comp)) {
              matches.add(cap);
            }
          }
        }
      }
    }

    return matches;
  }

  static matches(cap: Capability, sf?: Filter): boolean {
    return CapabilitySet.matchesInternal(cap, sf) && CapabilitySet.matchMandatory(cap, sf);
  }

  private static matchesInternal(cap: Capability, sf?: Filter): boolean {
    let matched = true;

    if (sf.comp === FilterComp.MATCH_ALL) {
      matched = true;
    } else if (sf.comp === FilterComp.AND) {
      const sfs = sf.filters as Filter[];
      for (let i = 0; matched && i < sfs.length; i++) {
        matched = CapabilitySet.matchesInternal(cap, sfs[i]);
      }
    } else if (sf.comp === FilterComp.OR) {
      matched = false;
      const sfs = sf.filters as Filter[];
      for (let i = 0; !matched && i < sfs.length; i++) {
        matched = CapabilitySet.matchesInternal(cap, sfs[i]);
      }
    } else if (sf.comp === FilterComp.NOT) {
      const sfs = sf.filters as Filter[];
      for (let i = 0; i < sfs.length; i++) {
        matched = !CapabilitySet.matchesInternal(cap, sfs[i]);
      }
    } else {
      matched = false;
      const lhs = cap.getAttributes()[sf.attrib];
      if (lhs !== null && lhs !== undefined) {
        matched = CapabilitySet.compare(lhs, sf.value, sf.comp);
      }
    }

    return matched;
  }

  private static matchMandatory(cap: Capability, sf?: Filter): boolean {
    const attrs = cap.getAttributes();
    for (const key of Object.keys(attrs)) {
      if ((cap as BundleCapabilityImpl).isAttributeMandatory(key) && !CapabilitySet.matchMandatoryAttribute(key, sf)) {
        return false;
      }
    }
    return true;
  }

  private static matchMandatoryAttribute(attrName: string, sf?: Filter): boolean {
    if (!sf) {
      return false;
    }

    if (sf.attrib !== null && sf.attrib !== undefined && sf.attrib === attrName) {
      return true;
    } else if (sf.comp === FilterComp.AND) {
      let list: any[] = sf.value;
      for (let i = 0; i < list.length; i++) {
        let sf2 = list[i] as Filter;
        if (sf2.attrib !== null && sf.attrib !== undefined && sf2.attrib === attrName) {
          return true;
        }
      }
    }

    return false;
  }

  private static compare(lhs: any, rhsUnknown: any, cmp: FilterComp): boolean {
    if (isAnyMissing(lhs)) {
      return false;
    }

    if (cmp === FilterComp.PRESENT) {
      return true;
    }

    const rhs = typeof rhsUnknown === 'string' ? rhsUnknown.trim() : rhsUnknown;

    if (typeof lhs === 'boolean') {
      switch (cmp) {
        case FilterComp.EQ:
        case FilterComp.GTE:
        case FilterComp.LTE:
          return lhs === (rhs === 'true');
        default:
          throw new Error('Unsupported comparison operator: ' + cmp);
      }
    }

    if (typeof lhs === 'number') {
      switch (cmp) {
        case FilterComp.EQ:
          return lhs === Number(rhs);
        case FilterComp.GTE:
          return lhs >= Number(rhs);
        case FilterComp.LTE:
          return lhs <= Number(rhs);
        default:
          throw new Error('Unsupported comparison operator: ' + cmp);
      }
    }

    if (lhs instanceof SemVer) {
      switch (cmp) {
        case FilterComp.EQ:
          return semverEq(lhs, rhs as string);
        case FilterComp.NOT:
          return semverNeq(lhs, rhs as string);
        case FilterComp.GTE:
          return semverGte(lhs, rhs as string);
        case FilterComp.LTE:
          return semverLte(lhs, rhs as string);
        default:
          throw new Error('Unsupported comparison operator: ' + cmp);
      }
    }

    if (typeof lhs === 'string') {
      switch (cmp) {
        case FilterComp.EQ:
          return lhs === rhs;
        case FilterComp.NOT:
          return lhs !== rhs;
        default:
          throw new Error('Unsupported comparison operator: ' + cmp);
      }
    }

    if (Array.isArray(lhs)) {
      for (let a of lhs) {
        if (CapabilitySet.compare(a, rhsUnknown, cmp)) {
          return true;
        }
      }

      return false;
    }

    return false;
  }
}
