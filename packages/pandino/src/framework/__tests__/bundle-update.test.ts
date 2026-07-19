import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { BundleActivator, BundleEvent, BundleListener } from '../interfaces';
import type { BundleModule } from '../../types/bundle-metadata';
import { BUNDLE_EVENT_TYPES, BUNDLE_STATES } from '../../types/constants';
import { OSGiFramework } from '../framework';

function moduleOf(symbolicName: string, version: string, activator: BundleActivator): Promise<BundleModule> {
  return Promise.resolve({
    default: {
      headers: { bundleSymbolicName: symbolicName, bundleVersion: version },
      activator,
    },
  });
}

describe('Bundle.update()', () => {
  let framework: OSGiFramework;

  beforeEach(async () => {
    framework = new OSGiFramework();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'debug').mockImplementation(() => {});
    await framework.start();
  });

  it('should swap headers and version when updated with a new module', async () => {
    const bundle = await framework.installBundle(moduleOf('test.bundle', '1.0.0', { start: vi.fn(), stop: vi.fn() }));

    await bundle.update(moduleOf('test.bundle', '2.0.0', { start: vi.fn(), stop: vi.fn() }));

    expect(bundle.getVersion()).toBe('2.0.0');
  });

  it('should stop the old activator and start the new one when active', async () => {
    const oldActivator = { start: vi.fn(), stop: vi.fn() };
    const newActivator = { start: vi.fn(), stop: vi.fn() };
    const bundle = await framework.installBundle(moduleOf('test.bundle', '1.0.0', oldActivator));
    await bundle.start();

    await bundle.update(moduleOf('test.bundle', '2.0.0', newActivator));

    expect(oldActivator.stop).toHaveBeenCalledTimes(1);
    expect(newActivator.start).toHaveBeenCalledTimes(1);
    expect(bundle.getState()).toBe(BUNDLE_STATES.ACTIVE);
  });

  it('should leave a non-active bundle in RESOLVED after update', async () => {
    const bundle = await framework.installBundle(moduleOf('test.bundle', '1.0.0', { start: vi.fn(), stop: vi.fn() }));

    await bundle.update(moduleOf('test.bundle', '2.0.0', { start: vi.fn(), stop: vi.fn() }));

    expect(bundle.getState()).toBe(BUNDLE_STATES.RESOLVED);
  });

  it('should fire an UPDATED bundle event', async () => {
    const bundle = await framework.installBundle(moduleOf('test.bundle', '1.0.0', { start: vi.fn(), stop: vi.fn() }));
    const events: number[] = [];
    const listener: BundleListener = { bundleChanged: (e: BundleEvent) => events.push(e.getType()) };
    framework.getBundleContext().addBundleListener(listener);

    await bundle.update(moduleOf('test.bundle', '2.0.0', { start: vi.fn(), stop: vi.fn() }));

    expect(events).toContain(BUNDLE_EVENT_TYPES.UPDATED);
  });

  it('should throw when updating an uninstalled bundle', async () => {
    const bundle = await framework.installBundle(moduleOf('test.bundle', '1.0.0', { start: vi.fn(), stop: vi.fn() }));
    await bundle.uninstall();

    await expect(bundle.update(moduleOf('test.bundle', '2.0.0', { start: vi.fn(), stop: vi.fn() }))).rejects.toThrow(
      /uninstalled/,
    );
  });

  it('should not stop a running bundle when the new module fails to resolve', async () => {
    const activator = { start: vi.fn(), stop: vi.fn() };
    const bundle = await framework.installBundle(moduleOf('test.bundle', '1.0.0', activator));
    await bundle.start();
    activator.stop.mockClear();

    await expect(bundle.update(Promise.reject(new Error('bad module')))).rejects.toThrow('bad module');

    // The running bundle must be left intact, not torn down.
    expect(bundle.getState()).toBe(BUNDLE_STATES.ACTIVE);
    expect(activator.stop).not.toHaveBeenCalled();
    expect(bundle.getVersion()).toBe('1.0.0');
  });

  it('should perform a stop/start cycle when updated without a new module', async () => {
    const activator = { start: vi.fn(), stop: vi.fn() };
    const bundle = await framework.installBundle(moduleOf('test.bundle', '1.0.0', activator));
    await bundle.start();
    activator.start.mockClear();
    activator.stop.mockClear();

    await bundle.update();

    expect(activator.stop).toHaveBeenCalledTimes(1);
    expect(activator.start).toHaveBeenCalledTimes(1);
    expect(bundle.getState()).toBe(BUNDLE_STATES.ACTIVE);
  });
});
