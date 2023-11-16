import { describe, beforeEach, expect, it, vi } from 'vitest';
import { BundleRequirementImpl } from './bundle-requirement-impl';
import { BundleRevisionImpl } from '../bundle-revision-impl';
import type { BundleRevision } from '../bundle-revision';
import { BundleImpl } from '../bundle-impl';
import { BUNDLE_SYMBOLICNAME, FILTER_DIRECTIVE } from '@pandino/pandino-api';
import type { BundleCapability } from './bundle-capability';
import { BundleCapabilityImpl } from './bundle-capability-impl';

describe('BundleRequirementImpl', () => {
  let revision: BundleRevision;
  let req: BundleRequirementImpl;
  let bundle: BundleImpl;
  let mockGetConfig = vi.fn();
  const mockConfig = {};

  beforeEach(() => {
    mockGetConfig.mockClear();
    mockGetConfig.mockImplementation(() => mockConfig);
    bundle = {
      getFramework: () => ({
        getConfig: mockGetConfig,
      }),
      toString: () => '@mock/symbolic-name: 0.0.0',
    } as any;
    revision = new BundleRevisionImpl(bundle, '1', {
      [BUNDLE_SYMBOLICNAME]: '@scope/bundle1',
    });

    req = new BundleRequirementImpl(
      revision,
      'my.namespace',
      {
        [FILTER_DIRECTIVE]: '(age<5)',
      },
      {
        attr2: 'power=SuperSaiyan',
      },
    );
  });

  it('basic test', () => {
    expect(req).toBeDefined();
  });

  it('methods', () => {
    expect(req.getAttributes()).toEqual({ attr2: 'power=SuperSaiyan' });
    expect(req.getDirectives()).toEqual({ filter: '(age<5)' });
    expect(req.getNamespace()).toEqual('my.namespace');
    expect(req.getResource().getSymbolicName()).toEqual('@scope/bundle1');
    expect(req.getResource().getVersion().toString()).toEqual('0.0.0');
    expect(req.getRevision().getSymbolicName()).toEqual('@scope/bundle1');
    expect(req.getRevision().getVersion().toString()).toEqual('0.0.0');
    expect(req.isOptional()).toEqual(false);
    expect(req.getFilter()).toEqual('(power=SuperSaiyan)');
    expect(req.toString()).toEqual('[@mock/symbolic-name: 0.0.0 (R 1)] my.namespace; (power=SuperSaiyan)');
  });

  it('matches()', () => {
    const revision2 = new BundleRevisionImpl(bundle, '2', {
      [BUNDLE_SYMBOLICNAME]: '@scope/bundle2',
    });
    const revision3 = new BundleRevisionImpl(bundle, '3', {
      [BUNDLE_SYMBOLICNAME]: '@scope/bundle2',
    });
    const capability2: BundleCapability = new BundleCapabilityImpl(revision2, 'namespace.two');
    const capability3: BundleCapability = new BundleCapabilityImpl(
      revision3,
      'my.namespace',
      {},
      {
        power: 'SuperSaiyan',
      },
    );

    expect(req.matches(capability2)).toEqual(false);
    expect(req.matches(capability3)).toEqual(true);
  });
});
