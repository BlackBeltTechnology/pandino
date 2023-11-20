import { describe, beforeEach, expect, it, vi } from 'vitest';
import { BundleWireImpl } from './bundle-wire-impl';
import { BundleCapabilityImpl } from './bundle-capability-impl';
import { BundleRevisionImpl } from '../bundle-revision-impl';
import { BundleImpl } from '../bundle-impl';
import { BUNDLE_SYMBOLICNAME, FILTER_DIRECTIVE } from '@pandino/pandino-api';
import type { BundleRevision } from '../bundle-revision';
import type { BundleRequirement } from './bundle-requirement';
import type { BundleCapability } from './bundle-capability';
import { BundleRequirementImpl } from './bundle-requirement-impl';

describe('BundleWireImpl', () => {
  let requirer: BundleRevision;
  let req: BundleRequirement;
  let provider: BundleRevision;
  let cap: BundleCapability;
  let wire: BundleWireImpl;
  let mockGetConfig = vi.fn();
  const mockConfig = {};

  beforeEach(() => {
    mockGetConfig.mockClear();
    mockGetConfig.mockImplementation(() => mockConfig);
    const bundle: BundleImpl = {
      getFramework: () => ({
        getConfig: mockGetConfig,
      }),
      toString: () => '@mock/symbolic-name: 0.0.0',
    } as any;
    requirer = new BundleRevisionImpl(bundle, '1', {
      [BUNDLE_SYMBOLICNAME]: '@scope/bundle1',
    });
    req = new BundleRequirementImpl(
      requirer,
      'ns.one',
      {
        [FILTER_DIRECTIVE]: '(isOkay=true)',
      },
      {
        power: 'power=SuperSaiyan',
      },
    );
    provider = new BundleRevisionImpl(bundle, '2', {
      [BUNDLE_SYMBOLICNAME]: '@scope/bundle2',
    });
    cap = new BundleCapabilityImpl(
      provider,
      'ns.one',
      {},
      {
        isOkay: 'isOkay=true',
      },
    );
    wire = new BundleWireImpl(requirer, req, provider, cap);
  });

  it('is defined', () => {
    expect(wire).toBeDefined();
  });

  it('methods', () => {
    expect(wire.getCapability()).toEqual(cap);
    expect(wire.getProvider()).toEqual(provider);
    expect(wire.getRequirement()).toEqual(req);
    expect(wire.getRequirer()).toEqual(requirer);
    expect(wire.toString()).toEqual('[@mock/symbolic-name: 0.0.0 (R 1)] ns.one; (power=SuperSaiyan) -> [@mock/symbolic-name: 0.0.0 (R 2)]');
    expect(wire.equals(wire)).toEqual(true);
    expect(wire.equals(undefined)).toEqual(false);
    expect(wire.equals(null)).toEqual(false);
  });
});
