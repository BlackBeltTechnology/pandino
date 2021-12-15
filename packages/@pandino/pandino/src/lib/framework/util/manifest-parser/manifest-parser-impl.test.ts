import { SemVer } from 'semver';
import {
  BundleCapability,
  BundleManifestHeaders,
  BundleRequirement,
  BUNDLE_COPYRIGHT,
  BUNDLE_DESCRIPTION,
  BUNDLE_MANIFESTVERSION,
  BUNDLE_SYMBOLICNAME,
  BUNDLE_VERSION,
  CAPABILITY_COPYRIGHT_ATTRIBUTE,
  CAPABILITY_DESCRIPTION_ATTRIBUTE,
  CAPABILITY_SINGLETON_DIRECTIVE,
  CAPABILITY_TAGS_ATTRIBUTE,
  CAPABILITY_TYPE_ATTRIBUTE,
  CAPABILITY_VERSION_ATTRIBUTE,
  IDENTITY_NAMESPACE,
  PROVIDE_CAPABILITY,
  REQUIRE_CAPABILITY,
  TYPE_BUNDLE,
} from '@pandino/pandino-api';
import { ManifestParserImpl } from './manifest-parser-impl';
import { BundleRevisionImpl } from '../../bundle-revision-impl';
import Filter from '../../../filter/filter';

describe('ManifestParderImp', () => {
  it('testIdentityCapabilityMinimal', () => {
    const headers: BundleManifestHeaders = {
      [BUNDLE_MANIFESTVERSION]: '2',
      [BUNDLE_SYMBOLICNAME]: 'foo.bar',
      [BUNDLE_VERSION]: '1.2.3',
    };
    const mp: ManifestParserImpl = new ManifestParserImpl(null, null, headers);
    const ic = findCapability(mp.getCapabilities(), IDENTITY_NAMESPACE);

    expect(ic.getAttributes()[IDENTITY_NAMESPACE]).toEqual('foo.bar');
    expect(ic.getAttributes()[CAPABILITY_TYPE_ATTRIBUTE]).toEqual(TYPE_BUNDLE);
    expect(Object.keys(ic.getDirectives()).length).toEqual(0);
  });

  it('testIdentityCapabilityFull', () => {
    const headers: BundleManifestHeaders = {
      [BUNDLE_MANIFESTVERSION]: '2',
      [BUNDLE_SYMBOLICNAME]: 'abc;singleton:=true;foo=bar;' + CAPABILITY_TAGS_ATTRIBUTE + '=test',
      [BUNDLE_VERSION]: '1.2.3-something',
      [BUNDLE_COPYRIGHT]: '(c) 2021 BlackBelt Technology Ltd.',
      [BUNDLE_DESCRIPTION]: 'A bundle description',
    };
    const mockBundleRevision: any = jest.fn();
    const mp: ManifestParserImpl = new ManifestParserImpl(null, mockBundleRevision, headers);
    const ic = findCapability(mp.getCapabilities(), IDENTITY_NAMESPACE);

    expect(ic.getAttributes()[IDENTITY_NAMESPACE]).toEqual('abc');
    expect(ic.getAttributes()[CAPABILITY_VERSION_ATTRIBUTE]).toEqual(new SemVer('1.2.3-something'));
    expect(ic.getAttributes()[CAPABILITY_TYPE_ATTRIBUTE]).toEqual(TYPE_BUNDLE);
    expect(ic.getAttributes()[CAPABILITY_COPYRIGHT_ATTRIBUTE]).toEqual('(c) 2021 BlackBelt Technology Ltd.');
    expect(ic.getAttributes()[CAPABILITY_DESCRIPTION_ATTRIBUTE]).toEqual('A bundle description');
    expect(ic.getAttributes()['foo']).toEqual('bar');

    expect(Object.keys(ic.getDirectives()).length).toEqual(1);
    expect(ic.getDirectives()[CAPABILITY_SINGLETON_DIRECTIVE]).toEqual('true');
  });

  it('testAttributes', () => {
    const headers: BundleManifestHeaders = {
      [BUNDLE_MANIFESTVERSION]: '2',
      [BUNDLE_SYMBOLICNAME]: 'com.example.test.sample',
      [PROVIDE_CAPABILITY]:
        'com.example;theArray:Array<string>="red,green,blue";theNumber:number=111;version:SemVer=1.2.3',
      [REQUIRE_CAPABILITY]:
        'com.example.other;theArray:Array<number>="1,2,3";theNumber:number=999;com.example.other.bla="str"',
    };
    const mockBundleRevision = {
      getSymbolicName: jest.fn().mockReturnValue('com.example.test.sample'),
    } as unknown as BundleRevisionImpl;
    const mp: ManifestParserImpl = new ManifestParserImpl(null, mockBundleRevision, headers);
    const bc: BundleCapability = findCapability(mp.getCapabilities(), 'com.example');

    expect(bc.getAttributes()['theNumber']).toEqual(111);
    expect(bc.getAttributes()['theArray']).toEqual(['red', 'green', 'blue']);
    expect(bc.getAttributes()['version']).toEqual(new SemVer('1.2.3'));

    const br: BundleRequirement = findRequirement(mp.getRequirements(), 'com.example.other');

    expect(br.getAttributes()['theNumber']).toEqual(999);
    expect(br.getAttributes()['theArray']).toEqual([1, 2, 3]);
    expect(br.getAttributes()['com.example.other.bla']).toEqual('str');
  });

  it('testFilters', () => {
    const headers: BundleManifestHeaders = {
      [BUNDLE_MANIFESTVERSION]: '2',
      [BUNDLE_SYMBOLICNAME]: 'com.example',
      [REQUIRE_CAPABILITY]: 'com.one;filter:="(&(type=cat)(rate<=20))"',
    };
    const mockBundleRevision = {
      getSymbolicName: jest.fn().mockReturnValue('com.example'),
    } as unknown as BundleRevisionImpl;
    const mp: ManifestParserImpl = new ManifestParserImpl(null, mockBundleRevision, headers);
    const rc1: BundleRequirement = findRequirement(mp.getRequirements(), 'com.one');
    const expected = Filter.AND([Filter.attribute('type').equalTo('cat'), Filter.attribute('rate').lte(20)]);

    expect(Filter.parse(rc1.getDirectives()['filter']).toString()).toEqual(expected.toString());
  });
});

function findCapability(capabilities: BundleCapability[], namespace: string): BundleCapability {
  return capabilities.find((c) => c.getNamespace() === namespace);
}

function findRequirement(requirements: BundleRequirement[], namespace: string): BundleRequirement {
  return requirements.find((r) => r.getNamespace() === namespace);
}
