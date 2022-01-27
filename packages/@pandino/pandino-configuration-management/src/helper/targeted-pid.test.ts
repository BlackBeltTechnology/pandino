import { SemVer } from 'semver';
import { Bundle, ServiceReference } from '@pandino/pandino-api';
import { MockBundleContext } from '../__mocks__/mock-bundle-context';
import { MockBundle } from '../__mocks__/mock-bundle';
import { MockServiceReference } from '../__mocks__/mock-service-reference';
import { TargetedPID } from './targeted-pid';

describe('TargetedPid', () => {
  it('matchesTarget no target', () => {
    const pid = 'a.b.c';
    const symbolicName = 'b1';
    const version = new SemVer('1.0.0');
    const location = 'loc:' + symbolicName;

    const b1 = createBundle(symbolicName, version, location);
    const r1 = createServiceReference(b1, pid);

    const rn = createServiceReference(createBundle(symbolicName + '_', version, location), pid);
    const rv = createServiceReference(createBundle(symbolicName, new SemVer('0.2.0'), location), pid);
    const rl = createServiceReference(createBundle(symbolicName, version, location + '_'), pid);
    const rnone = createServiceReference(null, pid);

    const p1 = new TargetedPID(pid);

    expect(p1.matchesTarget(r1)).toEqual(true);
    expect(p1.matchesTarget(rn)).toEqual(true);
    expect(p1.matchesTarget(rv)).toEqual(true);
    expect(p1.matchesTarget(rl)).toEqual(true);
    expect(p1.matchesTarget(rnone)).toEqual(false);
  });

  it('matchesTarget name', () => {
    const pid = 'a.b.c';
    const symbolicName = 'b1';
    const version = new SemVer('1.0.0');
    const location = 'loc:' + symbolicName;

    const b1 = createBundle(symbolicName, version, location);
    const r1 = createServiceReference(b1, pid);

    const rn = createServiceReference(createBundle(symbolicName + '_', version, location), pid);
    const rv = createServiceReference(createBundle(symbolicName, new SemVer('0.2.0'), location), pid);
    const rl = createServiceReference(createBundle(symbolicName, version, location + '_'), pid);
    const rnone = createServiceReference(null, pid);

    const p1 = new TargetedPID(`${pid}|${symbolicName}`);

    expect(p1.matchesTarget(r1)).toEqual(true);
    expect(p1.matchesTarget(rn)).toEqual(false);
    expect(p1.matchesTarget(rv)).toEqual(true);
    expect(p1.matchesTarget(rl)).toEqual(true);
    expect(p1.matchesTarget(rnone)).toEqual(false);
  });

  it('matchesTarget name version', () => {
    const pid = 'a.b.c';
    const symbolicName = 'b1';
    const version = new SemVer('1.0.0');
    const location = 'loc:' + symbolicName;

    const b1 = createBundle(symbolicName, version, location);
    const r1 = createServiceReference(b1, pid);

    const rn = createServiceReference(createBundle(symbolicName + '_', version, location), pid);
    const rv = createServiceReference(createBundle(symbolicName, new SemVer('0.2.0'), location), pid);
    const rl = createServiceReference(createBundle(symbolicName, version, location + '_'), pid);
    const rnone = createServiceReference(null, pid);

    const p1 = new TargetedPID(`${pid}|${symbolicName}|${version}`);

    expect(p1.matchesTarget(r1)).toEqual(true);
    expect(p1.matchesTarget(rn)).toEqual(false);
    expect(p1.matchesTarget(rv)).toEqual(false);
    expect(p1.matchesTarget(rl)).toEqual(true);
    expect(p1.matchesTarget(rnone)).toEqual(false);
  });

  it('matchesTarget name version location', () => {
    const pid = 'a.b.c';
    const symbolicName = 'b1';
    const version = new SemVer('1.0.0');
    const location = 'loc:' + symbolicName;

    const b1 = createBundle(symbolicName, version, location);
    const r1 = createServiceReference(b1, pid);

    const rn = createServiceReference(createBundle(symbolicName + '_', version, location), pid);
    const rv = createServiceReference(createBundle(symbolicName, new SemVer('0.2.0'), location), pid);
    const rl = createServiceReference(createBundle(symbolicName, version, location + '_'), pid);
    const rnone = createServiceReference(null, pid);

    const p1 = new TargetedPID(`${pid}|${symbolicName}|${version}|${location}`);

    expect(p1.matchesTarget(r1)).toEqual(true);
    expect(p1.matchesTarget(rn)).toEqual(false);
    expect(p1.matchesTarget(rv)).toEqual(false);
    expect(p1.matchesTarget(rl)).toEqual(false);
    expect(p1.matchesTarget(rnone)).toEqual(false);
  });

  function createBundle(symbolicName: string, version: SemVer, location: string): Bundle {
    const ctx = new MockBundleContext();
    return new MockBundle(ctx, location, symbolicName, version);
  }

  function createServiceReference(bundle: Bundle, pids: any): ServiceReference<any> {
    return new MockServiceReference(bundle, pids);
  }
});
