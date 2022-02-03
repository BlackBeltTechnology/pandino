import { SemVer } from 'semver';
import { Bundle, SemverFactory, ServiceReference } from '@pandino/pandino-api';
import { MockBundleContext } from '../__mocks__/mock-bundle-context';
import { MockBundle } from '../__mocks__/mock-bundle';
import { MockServiceReference } from '../__mocks__/mock-service-reference';
import { TargetedPID } from './targeted-pid';

describe('TargetedPid', () => {
  const semverFactory: SemverFactory = (version) => new SemVer(version);

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

    const p1 = new TargetedPID(pid, semverFactory);

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

    const p1 = new TargetedPID(`${pid}|${symbolicName}`, semverFactory);

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

    const p1 = new TargetedPID(`${pid}|${symbolicName}|${version}`, semverFactory);

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

    const p1 = new TargetedPID(`${pid}|${symbolicName}|${version}|${location}`, semverFactory);

    expect(p1.matchesTarget(r1)).toEqual(true);
    expect(p1.matchesTarget(rn)).toEqual(false);
    expect(p1.matchesTarget(rv)).toEqual(false);
    expect(p1.matchesTarget(rl)).toEqual(false);
    expect(p1.matchesTarget(rnone)).toEqual(false);
  });

  it('equals', () => {
    const p1 = new TargetedPID(`my.pid|@scope/bundle|1.2.3|some.location`, semverFactory);
    const p2 = new TargetedPID(`my.pid`, semverFactory);
    const p3 = new TargetedPID(`my.pid.other`, semverFactory);
    const p4 = new TargetedPID(`my.pid.other`, semverFactory);
    const p5 = 'my.pid|@scope/bundle2|3.3.3|some.other.location';

    expect(p1.equals(p1)).toEqual(true);
    expect(p1.equals(p2)).toEqual(false);
    expect(p1.equals(undefined)).toEqual(false);
    expect(p1.equals(null)).toEqual(false);
    expect(p2.equals(undefined)).toEqual(false);
    expect(p2.equals(null)).toEqual(false);
    expect(p3.equals(p4)).toEqual(true);
    expect(p1.equals(p5)).toEqual(false);
  });

  it('different representations', () => {
    const p1 = new TargetedPID(`my.pid|@scope/bundle|1.2.3|some.location`, semverFactory);

    expect(p1.toString()).toEqual('my.pid|@scope/bundle|1.2.3|some.location');
    expect(p1.getServicePid()).toEqual('my.pid');
    expect(p1.getRawPid()).toEqual('my.pid|@scope/bundle|1.2.3|some.location');
  });

  it('bindsStronger', () => {
    const p1 = new TargetedPID(`my.pid|@scope/bundle|1.2.3|some.location`, semverFactory);
    const p2 = new TargetedPID(`my.pid|@scope/bundle|1.2.3`, semverFactory);
    const p3 = new TargetedPID(`my.pid|@scope/bundle`, semverFactory);
    const p4 = new TargetedPID(`my.pid`, semverFactory);

    expect(p1.bindsStronger(p2)).toEqual(true);
    expect(p2.bindsStronger(p3)).toEqual(true);
    expect(p3.bindsStronger(p4)).toEqual(true);

    expect(p4.bindsStronger(p3)).toEqual(false);
    expect(p3.bindsStronger(p2)).toEqual(false);
    expect(p2.bindsStronger(p1)).toEqual(false);
  });

  function createBundle(symbolicName: string, version: SemVer, location: string): Bundle {
    const ctx = new MockBundleContext();
    return new MockBundle(ctx, location, symbolicName, version);
  }

  function createServiceReference(bundle: Bundle, pids: any): ServiceReference<any> {
    return new MockServiceReference(bundle, pids);
  }
});
