import { describe, expect, it } from 'vitest';
import { BUNDLE_ACTIVATIONPOLICY, BUNDLE_SYMBOLICNAME, BUNDLE_VERSION, PROVIDE_CAPABILITY, REQUIRE_CAPABILITY } from '@pandino/pandino-api';
import type { ActivationPolicy, BundleManifestHeaders } from '@pandino/pandino-api';
import { BundleRevisionImpl } from './bundle-revision-impl';
import { BundleCapabilityImpl } from './wiring';

describe('BundleRevisionImpl', () => {
  let mockConfig: Record<string, any> = {};
  let mockFramework: any = {
    getConfig: () => mockConfig,
  };
  let mockBundle: any = {
    getFramework: () => mockFramework,
  };
  let mockId = 'test-id';
  const cap1 = 'test.capability;attr1=1;attr2=hello';
  const cap2 = 'other.capability;attr1=yayy';
  const req1 = 'test.requirement;attr1=2;attr2=something';
  const req2 = 'other.requirement;attr1=ding';

  it('getDeclaredActivationPolicy()', () => {
    const bundleRevision = createBundleRevision('@test/bundle', '0.0.1');

    expect(bundleRevision.getDeclaredActivationPolicy()).toEqual('EAGER_ACTIVATION');
  });

  it('getManifestVersion()', () => {
    const bundleRevision = createBundleRevision('@test/bundle', '0.0.1');

    expect(bundleRevision.getManifestVersion()).toEqual('1');
  });

  it('getId()', () => {
    const bundleRevision = createBundleRevision('@test/bundle', '0.0.1');

    expect(bundleRevision.getId()).toEqual(mockId);
  });

  it('equals()', () => {
    const bundleRevision = createBundleRevision('@test/bundle', '0.0.1');

    expect(bundleRevision.equals(undefined)).toEqual(false);
    expect(bundleRevision.equals(null)).toEqual(false);
    expect(bundleRevision.equals(1)).toEqual(false);
    expect(bundleRevision.equals('something')).toEqual(false);
    expect(bundleRevision.equals({})).toEqual(false);
    expect(bundleRevision.equals(createBundleRevision('@test/bundle', '0.0.2'))).toEqual(false);
    expect(bundleRevision.equals(createBundleRevision('@test/bundle', '0.0.1'))).toEqual(true);
    expect(bundleRevision.equals(bundleRevision)).toEqual(true);
  });

  it('getCapabilities() for no capabilities returns defaults', () => {
    const revision = createBundleRevision('@test/bundle', '0.0.1');
    const caps = revision.getCapabilities();

    expect(caps.length).toEqual(2);
    expect(caps[0].getNamespace()).toEqual('pandino.wiring.bundle');
    expect((caps[0] as BundleCapabilityImpl).getRevision().getVersion().toString()).toEqual('0.0.1');
    expect(caps[1].getNamespace()).toEqual('pandino.identity');
    expect((caps[1] as BundleCapabilityImpl).getRevision().getVersion().toString()).toEqual('0.0.1');
  });

  it('getCapabilities() with a single capability', () => {
    const revision = createBundleRevision('@test/bundle', '0.0.1', 'EAGER_ACTIVATION', [], [cap1]);
    const caps = revision.getCapabilities();

    expect(caps.length).toEqual(3);

    const testCapability = caps.find((c) => c.getNamespace() === 'test.capability');

    expect(testCapability.getAttributes()).toEqual({ attr1: '1', attr2: 'hello' });
  });

  it('getCapabilities() with multiple capabilities', () => {
    const revision = createBundleRevision('@test/bundle', '0.0.1', 'EAGER_ACTIVATION', [], [cap1, cap2]);
    const caps = revision.getCapabilities();

    expect(caps.length).toEqual(4);

    const testCapability1 = caps.find((c) => c.getNamespace() === 'test.capability');

    expect(testCapability1.getAttributes()).toEqual({ attr1: '1', attr2: 'hello' });

    const testCapability2 = caps.find((c) => c.getNamespace() === 'other.capability');

    expect(testCapability2.getAttributes()).toEqual({ attr1: 'yayy' });
  });

  it('getCapabilities() filtered with a single capability', () => {
    const revision = createBundleRevision('@test/bundle', '0.0.1', 'EAGER_ACTIVATION', [], [cap1]);
    const caps = revision.getCapabilities('test.capability');

    expect(caps.length).toEqual(1);

    const testCapability = caps.find((c) => c.getNamespace() === 'test.capability');

    expect(testCapability.getAttributes()).toEqual({ attr1: '1', attr2: 'hello' });
  });

  it('getCapabilities() filtered with multiple capabilities', () => {
    const revision = createBundleRevision('@test/bundle', '0.0.1', 'EAGER_ACTIVATION', [], [cap1, cap2]);
    const caps = revision.getCapabilities('other.capability');

    expect(caps.length).toEqual(1);

    const testCapability2 = caps.find((c) => c.getNamespace() === 'other.capability');

    expect(testCapability2.getAttributes()).toEqual({ attr1: 'yayy' });
  });

  it('getDeclaredCapabilities() filtered with a single capability', () => {
    const revision = createBundleRevision('@test/bundle', '0.0.1', 'EAGER_ACTIVATION', [], [cap1]);
    const caps = revision.getDeclaredCapabilities('test.capability');

    expect(caps.length).toEqual(1);

    const testCapability = caps.find((c) => c.getNamespace() === 'test.capability');

    expect(testCapability.getAttributes()).toEqual({ attr1: '1', attr2: 'hello' });
  });

  it('getRequirements() for no requirements returns empty list', () => {
    const revision = createBundleRevision('@test/bundle', '0.0.1');
    const reqs = revision.getRequirements();

    expect(reqs.length).toEqual(0);
  });

  it('getRequirements() with a single requirement', () => {
    const revision = createBundleRevision('@test/bundle', '0.0.1', 'EAGER_ACTIVATION', [req1], []);
    const reqs = revision.getRequirements();

    expect(reqs.length).toEqual(1);

    const testRequirement = reqs.find((r) => r.getNamespace() === 'test.requirement');

    expect(testRequirement.getAttributes()).toEqual({ attr1: '2', attr2: 'something' });
  });

  it('getRequirements() with multiple getRequirements', () => {
    const revision = createBundleRevision('@test/bundle', '0.0.1', 'EAGER_ACTIVATION', [req1, req2], []);
    const reqs = revision.getRequirements();

    expect(reqs.length).toEqual(2);

    const testRequirement1 = reqs.find((r) => r.getNamespace() === 'test.requirement');

    expect(testRequirement1.getAttributes()).toEqual({ attr1: '2', attr2: 'something' });

    const testRequirement2 = reqs.find((r) => r.getNamespace() === 'other.requirement');

    expect(testRequirement2.getAttributes()).toEqual({ attr1: 'ding' });
  });

  it('getRequirements() filtered with a single getRequirement', () => {
    const revision = createBundleRevision('@test/bundle', '0.0.1', 'EAGER_ACTIVATION', [req1], []);
    const reqs = revision.getRequirements('test.requirement');

    expect(reqs.length).toEqual(1);

    const testRequirement = reqs.find((r) => r.getNamespace() === 'test.requirement');

    expect(testRequirement.getAttributes()).toEqual({ attr1: '2', attr2: 'something' });
  });

  it('getRequirements() filtered with multiple getRequirements', () => {
    const revision = createBundleRevision('@test/bundle', '0.0.1', 'EAGER_ACTIVATION', [req1, req2], []);
    const reqs = revision.getRequirements('other.requirement');

    expect(reqs.length).toEqual(1);

    const testRequirement2 = reqs.find((r) => r.getNamespace() === 'other.requirement');

    expect(testRequirement2.getAttributes()).toEqual({ attr1: 'ding' });
  });

  it('getDeclaredRequirements() filtered with a single requirement', () => {
    const revision = createBundleRevision('@test/bundle', '0.0.1', 'EAGER_ACTIVATION', [req1], []);
    const reqs = revision.getDeclaredRequirements('test.requirement');

    expect(reqs.length).toEqual(1);

    const testRequirement = reqs.find((r) => r.getNamespace() === 'test.requirement');

    expect(testRequirement.getAttributes()).toEqual({ attr1: '2', attr2: 'something' });
  });

  function createBundleRevision(
    symbolicName: string,
    version: string,
    ap: ActivationPolicy = 'EAGER_ACTIVATION',
    reqs: string[] = [],
    provides: string[] = [],
  ) {
    const headerMap: BundleManifestHeaders = {
      [BUNDLE_SYMBOLICNAME]: symbolicName,
      [BUNDLE_VERSION]: version,
      [BUNDLE_ACTIVATIONPOLICY]: ap,
      [REQUIRE_CAPABILITY]: reqs,
      [PROVIDE_CAPABILITY]: provides,
    };
    return new BundleRevisionImpl(mockBundle, mockId, headerMap);
  }
});
