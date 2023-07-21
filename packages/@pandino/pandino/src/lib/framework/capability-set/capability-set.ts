import { BundleCapabilityImpl } from '../wiring/bundle-capability-impl';
import { isAllPresent, isAnyMissing } from '../../utils/helpers';
import { BundleCapability } from '../wiring/bundle-capability';
import { Capability } from '../resource/capability';
import { SemVerImpl } from '../../utils/semver-impl';
import { equal, gte, lte } from '../../semver-lite/src';
import type { FilterNode, FilterOperator } from '@pandino/filters';
import { parseFilter } from '@pandino/filters';

export type CapabilityIndex = Record<any, Set<BundleCapability>>;

export class CapabilitySet {
  private readonly indices: Record<string, CapabilityIndex> = {};
  private readonly capSet: Set<Capability> = new Set<Capability>();

  constructor(indexProps: Array<string> = []) {
    for (const indexProp in indexProps) {
      this.indices[indexProp] = {};
    }
  }

  match(sf: FilterNode, obeyMandatory: boolean): Set<Capability> {
    const matches: Set<Capability> = this.matchCapSet(this.capSet, sf);
    return obeyMandatory ? CapabilitySet.matchMandatoryCapSet(matches, sf) : matches;
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

  static matches(cap: Capability, sf?: string): boolean {
    const node = parseFilter(sf);
    return CapabilitySet.matchesInternal(cap, node) && CapabilitySet.matchMandatory(cap, node);
  }

  static matchMandatory(cap: Capability, sf?: FilterNode): boolean {
    if (isAnyMissing(sf)) {
      return false;
    }
    const attrs = cap.getAttributes();
    for (const key of Object.keys(attrs)) {
      if ((cap as BundleCapabilityImpl).isAttributeMandatory(key) && !CapabilitySet.matchMandatoryAttribute(key, sf)) {
        return false;
      }
    }
    return true;
  }

  static matchMandatoryAttribute(attrName: string, sf?: FilterNode): boolean {
    if (!sf) {
      return false;
    }

    if (sf.attribute !== null && sf.attribute !== undefined && sf.attribute === attrName) {
      return true;
    } else if (sf.operator === 'and') {
      let list: any[] = sf.children;
      for (let i = 0; i < list.length; i++) {
        let sf2 = list[i] as FilterNode;
        if (sf2.attribute !== null && sf2.attribute !== undefined && sf2.attribute === attrName) {
          return true;
        }
      }
    }

    return false;
  }

  static compare(lhs: any, rhsUnknown: any, cmp: FilterOperator): boolean {
    if (isAnyMissing(lhs)) {
      return false;
    }

    if (cmp === 'eq' && rhsUnknown === '*') {
      return true;
    }

    const rhs = typeof rhsUnknown === 'string' ? rhsUnknown.trim() : rhsUnknown;

    if (typeof lhs === 'boolean') {
      switch (cmp) {
        case 'eq':
        case 'gte':
        case 'lte':
          return lhs === (rhs === 'true');
        default:
          throw new Error('Unsupported comparison operator: ' + cmp);
      }
    }

    if (typeof lhs === 'number') {
      switch (cmp) {
        case 'eq':
          return lhs === Number(rhs);
        case 'gte':
          return lhs >= Number(rhs);
        case 'lte':
          return lhs <= Number(rhs);
        default:
          throw new Error('Unsupported comparison operator: ' + cmp);
      }
    }

    if (lhs instanceof SemVerImpl) {
      switch (cmp) {
        case 'eq':
          return equal(lhs.toString(), rhs.toString());
        case 'not':
          return !equal(lhs.toString(), rhs.toString());
        case 'gte':
          return gte(lhs.toString(), rhs.toString());
        case 'lte':
          return lte(lhs.toString(), rhs.toString());
        default:
          throw new Error('Unsupported comparison operator: ' + cmp);
      }
    }

    if (typeof lhs === 'string') {
      switch (cmp) {
        case 'eq':
          return lhs === rhs;
        case 'not':
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

  private static matchMandatoryCapSet(caps: Set<Capability>, sf: FilterNode): Set<Capability> {
    for (const cap of caps) {
      if (!CapabilitySet.matchMandatory(cap, sf)) {
        caps.delete(cap);
      }
    }
    return caps;
  }

  private matchCapSet(caps: Set<Capability>, sf: FilterNode): Set<Capability> {
    let matches: Set<Capability> = new Set<Capability>();

    if (sf.expression === '*') {
      caps.forEach((c) => matches.add(c));
    } else if (sf.operator === 'eq' && sf.value === '*') {
      caps.forEach((c) => matches.add(c));
    } else if (sf.operator === 'and') {
      const sfs: Array<FilterNode> = sf.children;
      for (let i = 0; caps.size > 0 && i < sfs.length; i++) {
        matches = this.matchCapSet(caps, sfs[i]);
        caps = matches;
      }
    } else if (sf.operator === 'or') {
      const sfs: Array<FilterNode> = sf.children;
      for (let i = 0; i < sfs.length; i++) {
        this.matchCapSet(caps, sfs[i]).forEach((c) => matches.add(c));
      }
    } else if (sf.operator === 'not') {
      caps.forEach((c) => matches.add(c));
      const sfs: Array<FilterNode> = sf.children;
      for (let i = 0; i < sfs.length; i++) {
        const ms = this.matchCapSet(caps, sfs[i]);
        ms.forEach((c) => matches.delete(c));
      }
    } else {
      const index: Record<any, Set<BundleCapability>> = this.indices[sf.attribute];
      if (sf.operator === 'eq' && isAllPresent(index)) {
        const existingCaps: Set<BundleCapability> = index[sf.attribute];
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
          const lhs: any = cap.getAttributes()[sf.attribute];
          if (isAllPresent(lhs)) {
            if (CapabilitySet.compare(lhs, sf.value, sf.operator)) {
              matches.add(cap);
            }
          }
        }
      }
    }

    return matches;
  }

  private static matchesInternal(cap: Capability, sf?: FilterNode): boolean {
    let matched = true;

    if (isAnyMissing(sf)) {
      matched = false;
    } else if ((sf.operator === 'eq' && sf.value === '*') || sf.expression === '*') {
      matched = true;
    } else if (sf.operator === 'and') {
      const sfs = sf.children as FilterNode[];
      for (let i = 0; matched && i < sfs.length; i++) {
        matched = CapabilitySet.matchesInternal(cap, sfs[i]);
      }
    } else if (sf.operator === 'or') {
      matched = false;
      const sfs = sf.children as FilterNode[];
      for (let i = 0; !matched && i < sfs.length; i++) {
        matched = CapabilitySet.matchesInternal(cap, sfs[i]);
      }
    } else if (sf.operator === 'not') {
      const sfs = sf.children as FilterNode[];
      for (let i = 0; i < sfs.length; i++) {
        matched = !CapabilitySet.matchesInternal(cap, sfs[i]);
      }
    } else {
      matched = false;
      const lhs = cap.getAttributes()[sf.attribute];
      if (lhs !== null && lhs !== undefined) {
        matched = CapabilitySet.compare(lhs, sf.value, sf.operator);
      }
    }

    return matched;
  }
}
