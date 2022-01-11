import { CapabilitySet } from './capability-set';
import { BundleCapabilityImpl } from '../wiring/bundle-capability-impl';
import { BundleRevisionImpl } from '../bundle-revision-impl';
import { BundleImpl } from '../bundle-impl';
import { MuteLogger } from '../../../__mocks__/mute-logger';
import { BUNDLE_SYMBOLICNAME, BUNDLE_VERSION, BundleManifestHeaders } from '@pandino/pandino-api';
import Pandino from '../../../pandino';
import Filter from '../../filter/filter';

describe('capability-set', () => {
  let capabilitySet: CapabilitySet;

  beforeEach(() => {
    capabilitySet = new CapabilitySet();
  });

  it('static matches without filter', () => {
    const rev1 = createRevision('test/bundle', '1.0.0', 1, '1.0');
    const cap1 = new BundleCapabilityImpl(
      rev1,
      'ns.one',
      {},
      {
        attr1: 'val1',
        attr2: 2,
        attr3: true,
      },
    );

    expect(CapabilitySet.matches(cap1)).toEqual(false);
  });

  it('static matches with filter', () => {
    const rev1 = createRevision('test/bundle', '1.0.0', 1, '1.0');
    const cap1 = new BundleCapabilityImpl(
      rev1,
      'ns.one',
      {},
      {
        attr1: 'val1',
        attr2: 2,
        attr3: true,
      },
    );

    expect(CapabilitySet.matches(cap1, Filter.parse('(&(attr1=val1)(attr2>=3))'))).toEqual(false);
    expect(CapabilitySet.matches(cap1, Filter.parse('(&(attr1=val1)(attr2<=2))'))).toEqual(true);
    expect(CapabilitySet.matches(cap1, Filter.parse('(|(attr1=val2)(attr2<=2))'))).toEqual(true);
    expect(CapabilitySet.matches(cap1, Filter.parse('(!(attr1=val2))'))).toEqual(true);
  });

  it('instance matches without filter', () => {
    const capSet = new CapabilitySet();
    const rev1 = createRevision('test/bundle', '1.0.0', 1, '1.0');
    const cap1 = new BundleCapabilityImpl(
      rev1,
      'ns.one',
      {},
      {
        attr1: 'val1',
        attr2: 2,
        attr3: true,
      },
    );
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
    capSet.addCapability(cap1);
    capSet.addCapability(cap2);

    expect(capSet.match(Filter.parse('(&(attr1=val1)(attr2<=3))'), true)).toEqual(new Set([cap1]));
    expect(capSet.match(Filter.parse('(&(attr2<=3)(!(attr1=val1)))'), true)).toEqual(new Set([cap2]));
    expect(capSet.match(Filter.parse('attr2<=3'), true)).toEqual(new Set([cap1, cap2]));
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
    return new BundleRevisionImpl(bundle1, revId, {});
  }
});
