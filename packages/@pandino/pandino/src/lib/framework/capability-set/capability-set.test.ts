import { BUNDLE_SYMBOLICNAME, BUNDLE_VERSION, BundleManifestHeaders, MANDATORY_DIRECTIVE } from '@pandino/pandino-api';
import { parseFilter } from '@pandino/filters';
import { CapabilitySet } from './capability-set';
import { BundleCapabilityImpl } from '../wiring/bundle-capability-impl';
import { BundleRevisionImpl } from '../bundle-revision-impl';
import { BundleImpl } from '../bundle-impl';
import { MuteLogger } from '../../../__mocks__/mute-logger';
import { Pandino } from '../../../pandino';
import { BundleRevision } from '../bundle-revision';
import { BundleCapability } from '../wiring/bundle-capability';

describe('capability-set', () => {
  let capabilitySet: CapabilitySet;
  let rev1: BundleRevision;
  let cap1: BundleCapability;

  beforeEach(() => {
    capabilitySet = new CapabilitySet();
    rev1 = createRevision('@test/bundle', '1.0.0', 1, '1.0');
    cap1 = new BundleCapabilityImpl(
      rev1,
      'ns.one',
      {},
      {
        attr1: 'val1',
        attr2: 2,
        attr3: true,
      },
    );
  });

  it('static matches without filter', () => {
    expect(CapabilitySet.matches(cap1)).toEqual(false);
  });

  it('static matches with filter', () => {
    expect(CapabilitySet.matches(cap1, '(*)')).toEqual(true);
    expect(CapabilitySet.matches(cap1, '(&(attr1=val1)(attr2>=3))')).toEqual(false);
    expect(CapabilitySet.matches(cap1, '(&(attr1=val1)(attr2<=2))')).toEqual(true);
    expect(CapabilitySet.matches(cap1, '(|(attr1=val2)(attr2<=2))')).toEqual(true);
    expect(CapabilitySet.matches(cap1, '(!(attr1=val2))')).toEqual(true);
  });

  it('static matches mandatory attribute', () => {
    const cap1 = new BundleCapabilityImpl(
      rev1,
      'ns.one',
      {
        [MANDATORY_DIRECTIVE]: 'attr2',
      },
      {
        attr1: 'val1',
        attr2: 2,
      },
    );

    expect(CapabilitySet.matches(cap1, '(&(attr2>=0)(attr2<=3))')).toEqual(true);
    expect(CapabilitySet.matchMandatory(cap1)).toEqual(false);
  });

  it('static matchMandatoryAttribute', () => {
    expect(CapabilitySet.matchMandatoryAttribute('attr2')).toEqual(false);
    expect(CapabilitySet.matchMandatoryAttribute('attr2', parseFilter('(attr2="yayy")'))).toEqual(true);
    expect(CapabilitySet.matchMandatoryAttribute('attr2', parseFilter('(|(attr1="yayy")(nope=true))'))).toEqual(false);
  });

  it('instance matches with filter (add and remove)', () => {
    const cap2 = new BundleCapabilityImpl(
      rev1,
      'ns.two',
      {},
      {
        attr1: 'val2',
        attr2: 3,
        attr3: false,
      },
    );
    capabilitySet.addCapability(cap1);
    capabilitySet.addCapability(cap2);

    expect(capabilitySet.match(parseFilter('(*)'), false)).toEqual(new Set([cap1, cap2]));
    expect(capabilitySet.match(parseFilter('(|(attr1=val1)(attr1=val2))'), true)).toEqual(new Set([cap1, cap2]));
    expect(capabilitySet.match(parseFilter('(&(attr1=val1)(attr2<=3))'), true)).toEqual(new Set([cap1]));
    expect(capabilitySet.match(parseFilter('(&(attr2<=3)(!(attr1=val1)))'), true)).toEqual(new Set([cap2]));
    expect(capabilitySet.match(parseFilter('attr2<=3'), true)).toEqual(new Set([cap1, cap2]));

    capabilitySet.removeCapability(cap1);

    expect(capabilitySet.match(parseFilter('attr2<=3'), true)).toEqual(new Set([cap2]));
  });

  describe('compare()', () => {
    it('LHS missing always results in false', () => {
      expect(CapabilitySet.compare(undefined, undefined, 'eq')).toEqual(false);
    });

    it('FilterComp.PRESENT always returns true if LHS is present', () => {
      expect(CapabilitySet.compare('some value', '*', 'eq')).toEqual(true);
    });

    it('strings type', () => {
      expect(CapabilitySet.compare('abc', 'abc', 'eq')).toEqual(true);
      expect(CapabilitySet.compare('abc', '  abc  ', 'eq')).toEqual(true);
      expect(CapabilitySet.compare('abc', '2', 'eq')).toEqual(false);

      expect(CapabilitySet.compare('abc', 'bbb', 'not')).toEqual(true);
      expect(CapabilitySet.compare('abc', 'abc', 'not')).toEqual(false);
      expect(CapabilitySet.compare('abc', '  bbb  ', 'not')).toEqual(true);
      expect(CapabilitySet.compare('abc', '  abc  ', 'not')).toEqual(false);

      expect(() => {
        CapabilitySet.compare('abc', 'abc', 'gte');
      }).toThrow();
    });

    it('boolean type uses FilterComp.EQ, FilterComp.GTE, FilterComp.LTE the same way', () => {
      expect(CapabilitySet.compare(true, 'true', 'eq')).toEqual(true);

      expect(CapabilitySet.compare(true, 'true', 'gte')).toEqual(true);

      expect(CapabilitySet.compare(true, 'true', 'lte')).toEqual(true);

      expect(() => {
        CapabilitySet.compare(true, 'true', 'not');
      }).toThrow();
    });

    it('boolean type', () => {
      expect(CapabilitySet.compare(true, 'false', 'eq')).toEqual(false);
      expect(CapabilitySet.compare(true, undefined, 'eq')).toEqual(false);
      expect(CapabilitySet.compare(true, null, 'eq')).toEqual(false);
      expect(CapabilitySet.compare(true, 'true', 'eq')).toEqual(true);
      expect(CapabilitySet.compare(true, '1', 'eq')).toEqual(false);
    });

    it('number type', () => {
      expect(CapabilitySet.compare(1, undefined, 'eq')).toEqual(false);
      expect(CapabilitySet.compare(1, null, 'eq')).toEqual(false);
      expect(CapabilitySet.compare(1, '1', 'eq')).toEqual(true);
      expect(CapabilitySet.compare(1, '2', 'eq')).toEqual(false);
      expect(CapabilitySet.compare(1, '-1', 'eq')).toEqual(false);
      expect(CapabilitySet.compare(-1, '-1', 'eq')).toEqual(true);

      expect(() => {
        CapabilitySet.compare(1, '1', 'not');
      }).toThrow();
    });

    it('SemVer type', () => {
      const version1 = '1.0.0';
      expect(() => {
        CapabilitySet.compare(version1, undefined, 'eq');
      }).toThrow();
      expect(() => {
        CapabilitySet.compare(version1, null, 'eq');
      }).toThrow();

      expect(CapabilitySet.compare(version1, '1.0.0', 'eq')).toEqual(true);
      expect(CapabilitySet.compare(version1, '1.1.1', 'eq')).toEqual(false);

      expect(CapabilitySet.compare(version1, '1.1.1', 'not')).toEqual(true);
      expect(CapabilitySet.compare(version1, '1.0.0', 'not')).toEqual(false);

      expect(CapabilitySet.compare(version1, '1.1.1', 'gte')).toEqual(false);
      expect(CapabilitySet.compare(version1, '1.0.0', 'gte')).toEqual(true);
      expect(CapabilitySet.compare(version1, '0.1.0', 'gte')).toEqual(true);

      expect(CapabilitySet.compare(version1, '1.1.1', 'lte')).toEqual(true);
      expect(CapabilitySet.compare(version1, '1.0.0', 'lte')).toEqual(true);
      expect(CapabilitySet.compare(version1, '0.1.0', 'lte')).toEqual(false);
    });
  });

  function createRevision(bsn: string, bv: string, bid: number, revId: string) {
    const headers1: BundleManifestHeaders = {
      [BUNDLE_SYMBOLICNAME]: bsn,
      [BUNDLE_VERSION]: bv,
    };
    const framework = {
      getResolver: () => ({
        addRevision: () => {},
      }),
      getConfig: () => ({}),
      getBundles: () => [] as any[],
    } as unknown as Pandino;
    const bundle1 = new BundleImpl(new MuteLogger(), bid, headers1, 'root', 'location', framework);
    return new BundleRevisionImpl(bundle1, revId, {
      [BUNDLE_SYMBOLICNAME]: '@test/test',
    });
  }
});
