import { BUNDLE_SYMBOLICNAME, BUNDLE_VERSION, BundleManifestHeaders, MANDATORY_DIRECTIVE } from '@pandino/pandino-api';
import { CapabilitySet } from './capability-set';
import { BundleCapabilityImpl } from '../wiring/bundle-capability-impl';
import { BundleRevisionImpl } from '../bundle-revision-impl';
import { BundleImpl } from '../bundle-impl';
import { MuteLogger } from '../../../__mocks__/mute-logger';
import { Pandino } from '../../../pandino';
import { FilterComp } from '../../filter';
import { BundleRevision } from '../bundle-revision';
import { BundleCapability } from '../wiring/bundle-capability';
import { SemVerImpl } from '../../utils/semver-impl';
import { parse } from '../../filter';

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
    expect(CapabilitySet.matches(cap1, parse('(*)'))).toEqual(true);
    expect(CapabilitySet.matches(cap1, parse('(&(attr1=val1)(attr2>=3))'))).toEqual(false);
    expect(CapabilitySet.matches(cap1, parse('(&(attr1=val1)(attr2<=2))'))).toEqual(true);
    expect(CapabilitySet.matches(cap1, parse('(|(attr1=val2)(attr2<=2))'))).toEqual(true);
    expect(CapabilitySet.matches(cap1, parse('(!(attr1=val2))'))).toEqual(true);
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

    expect(CapabilitySet.matches(cap1, parse('(&(attr2>=0)(attr2<=3))'))).toEqual(true);
    expect(CapabilitySet.matchMandatory(cap1)).toEqual(false);
  });

  it('static matchMandatoryAttribute', () => {
    expect(CapabilitySet.matchMandatoryAttribute('attr2')).toEqual(false);
    expect(CapabilitySet.matchMandatoryAttribute('attr2', parse('(attr2="yayy")'))).toEqual(true);
    expect(CapabilitySet.matchMandatoryAttribute('attr2', parse('(|(attr1="yayy")(nope=true))'))).toEqual(false);
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

    expect(capabilitySet.match(parse('(*)'), false)).toEqual(new Set([cap1, cap2]));
    expect(capabilitySet.match(parse('(|(attr1=val1)(attr1=val2))'), true)).toEqual(new Set([cap1, cap2]));
    expect(capabilitySet.match(parse('(&(attr1=val1)(attr2<=3))'), true)).toEqual(new Set([cap1]));
    expect(capabilitySet.match(parse('(&(attr2<=3)(!(attr1=val1)))'), true)).toEqual(new Set([cap2]));
    expect(capabilitySet.match(parse('attr2<=3'), true)).toEqual(new Set([cap1, cap2]));

    capabilitySet.removeCapability(cap1);

    expect(capabilitySet.match(parse('attr2<=3'), true)).toEqual(new Set([cap2]));
  });

  describe('compare()', () => {
    it('LHS missing always results in false', () => {
      expect(CapabilitySet.compare(undefined, undefined, FilterComp.PRESENT)).toEqual(false);
    });

    it("FilterComp.PRESENT always returns true if LHS is present, doesn't care about RHS", () => {
      expect(CapabilitySet.compare('some value', undefined, FilterComp.PRESENT)).toEqual(true);
    });

    it('strings type', () => {
      expect(CapabilitySet.compare('abc', 'abc', FilterComp.EQ)).toEqual(true);
      expect(CapabilitySet.compare('abc', '  abc  ', FilterComp.EQ)).toEqual(true);
      expect(CapabilitySet.compare('abc', '2', FilterComp.EQ)).toEqual(false);

      expect(CapabilitySet.compare('abc', 'bbb', FilterComp.NOT)).toEqual(true);
      expect(CapabilitySet.compare('abc', 'abc', FilterComp.NOT)).toEqual(false);
      expect(CapabilitySet.compare('abc', '  bbb  ', FilterComp.NOT)).toEqual(true);
      expect(CapabilitySet.compare('abc', '  abc  ', FilterComp.NOT)).toEqual(false);

      expect(() => {
        CapabilitySet.compare('abc', 'abc', FilterComp.GTE);
      }).toThrow();
    });

    it('boolean type uses FilterComp.EQ, FilterComp.GTE, FilterComp.LTE the same way', () => {
      expect(CapabilitySet.compare(true, 'true', FilterComp.EQ)).toEqual(true);

      expect(CapabilitySet.compare(true, 'true', FilterComp.GTE)).toEqual(true);

      expect(CapabilitySet.compare(true, 'true', FilterComp.LTE)).toEqual(true);

      expect(() => {
        CapabilitySet.compare(true, 'true', FilterComp.NOT);
      }).toThrow();
    });

    it('boolean type', () => {
      expect(CapabilitySet.compare(true, 'false', FilterComp.EQ)).toEqual(false);
      expect(CapabilitySet.compare(true, undefined, FilterComp.EQ)).toEqual(false);
      expect(CapabilitySet.compare(true, null, FilterComp.EQ)).toEqual(false);
      expect(CapabilitySet.compare(true, 'true', FilterComp.EQ)).toEqual(true);
      expect(CapabilitySet.compare(true, '1', FilterComp.EQ)).toEqual(false);
    });

    it('number type', () => {
      expect(CapabilitySet.compare(1, undefined, FilterComp.EQ)).toEqual(false);
      expect(CapabilitySet.compare(1, null, FilterComp.EQ)).toEqual(false);
      expect(CapabilitySet.compare(1, '1', FilterComp.EQ)).toEqual(true);
      expect(CapabilitySet.compare(1, '2', FilterComp.EQ)).toEqual(false);
      expect(CapabilitySet.compare(1, '-1', FilterComp.EQ)).toEqual(false);
      expect(CapabilitySet.compare(-1, '-1', FilterComp.EQ)).toEqual(true);

      expect(() => {
        CapabilitySet.compare(1, '1', FilterComp.NOT);
      }).toThrow();
    });

    it('SemVer type', () => {
      const version1 = new SemVerImpl('1.0.0');
      expect(() => {
        CapabilitySet.compare(version1, undefined, FilterComp.EQ);
      }).toThrow();
      expect(() => {
        CapabilitySet.compare(version1, null, FilterComp.EQ);
      }).toThrow();
      expect(() => {
        CapabilitySet.compare(version1, '1.0.0', FilterComp.APPROX);
      }).toThrow();

      expect(CapabilitySet.compare(version1, '1.0.0', FilterComp.EQ)).toEqual(true);
      expect(CapabilitySet.compare(version1, '1.1.1', FilterComp.EQ)).toEqual(false);

      expect(CapabilitySet.compare(version1, '1.1.1', FilterComp.NOT)).toEqual(true);
      expect(CapabilitySet.compare(version1, '1.0.0', FilterComp.NOT)).toEqual(false);

      expect(CapabilitySet.compare(version1, '1.1.1', FilterComp.GTE)).toEqual(false);
      expect(CapabilitySet.compare(version1, '1.0.0', FilterComp.GTE)).toEqual(true);
      expect(CapabilitySet.compare(version1, '0.1.0', FilterComp.GTE)).toEqual(true);

      expect(CapabilitySet.compare(version1, '1.1.1', FilterComp.LTE)).toEqual(true);
      expect(CapabilitySet.compare(version1, '1.0.0', FilterComp.LTE)).toEqual(true);
      expect(CapabilitySet.compare(version1, '0.1.0', FilterComp.LTE)).toEqual(false);
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
