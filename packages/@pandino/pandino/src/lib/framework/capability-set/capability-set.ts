import { BundleCapabilityImpl } from '../wiring/bundle-capability-impl';
import type { BundleCapability } from '../wiring/bundle-capability';
import type { Capability } from '../resource';
import type { FilterNode, FilterOperator } from '@pandino/filters';
import { evaluateSemver, isSemVer, parseFilter } from '@pandino/filters';

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

    for (const [key, _] of Object.entries(this.indices)) {
      let value = cap.getAttributes()[key];
      if (value !== null && value !== undefined) {
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
        if (value !== null && value !== undefined) {
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
    if (sf === undefined) {
      return false;
    }
    const node = parseFilter(sf);
    return CapabilitySet.matchesInternal(cap, node) && CapabilitySet.matchMandatory(cap, node);
  }

  static matchMandatory(cap: Capability, sf?: FilterNode): boolean {
    if (!sf) {
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
      let list: any[] = sf.children || [];
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
    if (!lhs) {
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

    if (isSemVer(lhs)) {
      switch (cmp) {
        case 'eq':
          return evaluateSemver(lhs, 'eq', rhs);
        case 'not':
          return !evaluateSemver(lhs, 'eq', rhs);
        case 'gte':
          return evaluateSemver(lhs, 'gte', rhs);
        case 'lte':
          return evaluateSemver(lhs, 'lte', rhs);
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
    const prevVal = index[capValue];
    if (!prevVal) {
      index[capValue] = caps;
    }
    if (prevVal) {
      caps = prevVal;
    }
    caps.add(cap);
  }

  private static deindexCapability(index: CapabilityIndex, cap: BundleCapability, value: any): void {
    let caps = index[value];

    if (caps) {
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
      const sfs: Array<FilterNode> = sf.children ?? [];
      for (let i = 0; caps.size > 0 && i < sfs.length; i++) {
        matches = this.matchCapSet(caps, sfs[i]);
        caps = matches;
      }
    } else if (sf.operator === 'or') {
      const sfs: Array<FilterNode> = sf.children ?? [];
      for (let i = 0; i < sfs.length; i++) {
        this.matchCapSet(caps, sfs[i]).forEach((c) => matches.add(c));
      }
    } else if (sf.operator === 'not') {
      caps.forEach((c) => matches.add(c));
      const sfs: Array<FilterNode> = sf.children ?? [];
      for (let i = 0; i < sfs.length; i++) {
        const ms = this.matchCapSet(caps, sfs[i]);
        ms.forEach((c) => matches.delete(c));
      }
    } else {
      const index: Record<any, Set<BundleCapability>> = sf.attribute ? this.indices[sf.attribute] : {};
      if (sf.operator === 'eq' && index) {
        const existingCaps = sf.attribute ? index[sf.attribute] : new Set<BundleCapability>();
        if (existingCaps) {
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
          const lhs: any = sf.attribute ? cap.getAttributes()[sf.attribute] : undefined;
          if (lhs && sf.operator) {
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

    if (!sf) {
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
      const lhs = sf.attribute ? cap.getAttributes()[sf.attribute] : undefined;
      if (lhs !== null && lhs !== undefined && sf.operator) {
        matched = CapabilitySet.compare(lhs, sf.value, sf.operator);
      }
    }

    return matched;
  }
}
