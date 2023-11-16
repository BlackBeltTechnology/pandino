import { describe, expect, it } from 'vitest';
import { StatefulResolver } from './stateful-resolver';
import type { BundleRevision } from './bundle-revision';
import type { BundleCapability, BundleWire, BundleRequirement } from './wiring';
import { BundleRequirementImpl, BundleCapabilityImpl } from './wiring';
import { FILTER_DIRECTIVE } from '@pandino/pandino-api';

describe('StatefulResolver', () => {
  describe('static getResolvableWires()', () => {
    it('only includes matching wires', () => {
      const filter = '(type=dom)';
      const requirement1: Partial<BundleRequirementImpl> = {
        getNamespace: () => 'req-space',
        getDirectives: () => ({
          [FILTER_DIRECTIVE]: filter,
        }),
        getFilter: () => filter,
        getResource: () => undefined,
      };
      const requirements: BundleRequirement[] = [requirement1 as BundleRequirement];
      const revision: Partial<BundleRevision> = {
        getDeclaredRequirements: () => requirements,
      };
      const capability1: Partial<BundleCapability & BundleCapabilityImpl> = {
        getNamespace: () => 'other-space',
        getAttributes: () => ({
          type: 'dom',
        }),
        isAttributeMandatory: () => false,
        getResource: () => undefined,
      };
      const capability2: Partial<BundleCapability & BundleCapabilityImpl> = {
        getNamespace: () => 'req-space',
        getAttributes: () => ({
          type: 'other',
        }),
        isAttributeMandatory: () => false,
        getResource: () => undefined,
      };
      const capability3: Partial<BundleCapability & BundleCapabilityImpl> = {
        getNamespace: () => 'req-space',
        getAttributes: () => ({
          type: 'dom',
        }),
        isAttributeMandatory: () => false,
        getResource: () => undefined,
      };
      const allProvidedCapabilities: BundleCapability[] = [
        capability1 as BundleCapability,
        capability2 as BundleCapability,
        capability3 as BundleCapability,
      ];
      const result: BundleWire[] = StatefulResolver.getResolvableWires(
        revision as BundleRevision,
        allProvidedCapabilities,
      );

      expect(result.length).toEqual(1);

      const req1 = result[0].getRequirement();
      const cap1 = result[0].getCapability();

      expect(req1.getNamespace()).toEqual('req-space');
      expect(req1.getDirectives()[FILTER_DIRECTIVE]).toEqual(filter);
      expect(cap1.getNamespace()).toEqual('req-space');
      expect(cap1.getAttributes()['type']).toEqual('dom');
    });
  });
});
