import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BundleActivator, BundleConfiguration, BundleListener } from '../interfaces';
import type { BundleModule } from '../../types/bundle-metadata';
import { BUNDLE_STATES } from '../../types/constants';
import { OSGiFramework } from '../framework';

function createBundleModule(
  symbolicName: string = 'test.bundle',
  version: string = '1.0.0',
  options: {
    bundleName?: string;
    bundleDescription?: string;
    bundleManifestVersion?: string;
    [key: string]: any;
  } = {},
  activator: BundleActivator = {
    start: vi.fn(),
    stop: vi.fn(),
  },
): Promise<BundleModule> {
  return Promise.resolve({
    default: {
      headers: {
        bundleSymbolicName: symbolicName,
        bundleVersion: version,
        bundleName: options.bundleName,
        bundleDescription: options.bundleDescription,
        bundleManifestVersion: options.bundleManifestVersion,
        ...Object.entries(options)
          .filter(([key]) => !['bundleName', 'bundleDescription', 'bundleManifestVersion'].includes(key))
          .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {}),
      },
      activator,
    },
  });
}

describe('bundle lifecycle events', () => {
  let framework: OSGiFramework;

  beforeEach(async () => {
    framework = new OSGiFramework();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'debug').mockImplementation(() => {});
    await framework.start();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('idempotent transitions', () => {
    it('should treat start() on an ACTIVE bundle as a no-op', async () => {
      const activator: BundleActivator = { start: vi.fn(), stop: vi.fn() };
      const bundle = await framework.installBundle(createBundleModule('idempotent.start', '1.0.0', {}, activator));

      await bundle.start();
      expect(bundle.getState()).toBe(BUNDLE_STATES.ACTIVE);

      const events: number[] = [];
      framework.getBundleContext().addBundleListener({ bundleChanged: (e) => events.push(e.getType()) });

      await bundle.start(); // second start on ACTIVE

      expect(bundle.getState()).toBe(BUNDLE_STATES.ACTIVE);
      expect(activator.start).toHaveBeenCalledTimes(1); // not re-invoked
      expect(events).toEqual([]); // no additional bundle event emitted
    });

    it('should treat stop() on a non-ACTIVE bundle as a no-op', async () => {
      const activator: BundleActivator = { start: vi.fn(), stop: vi.fn() };
      // Installed & resolved but never started -> state is RESOLVED.
      const bundle = await framework.installBundle(createBundleModule('idempotent.stop', '1.0.0', {}, activator));
      expect(bundle.getState()).toBe(BUNDLE_STATES.RESOLVED);

      const events: number[] = [];
      framework.getBundleContext().addBundleListener({ bundleChanged: (e) => events.push(e.getType()) });

      await bundle.stop(); // stop on RESOLVED (non-ACTIVE)

      expect(bundle.getState()).toBe(BUNDLE_STATES.RESOLVED);
      expect(activator.stop).not.toHaveBeenCalled();
      expect(events).toEqual([]); // no bundle event emitted
    });

    it('should treat a second unregister() as a safe no-op', async () => {
      const context = framework.getBundleContext();
      const registration = context.registerService('DoubleUnregisterService', { test: true });

      registration.unregister();
      expect(context.getServiceReference('DoubleUnregisterService')).toBeNull();

      // Second unregister must not throw.
      expect(() => registration.unregister()).not.toThrow();
    });
  });

  describe('activator failures', () => {
    it('should revert to RESOLVED and propagate when activator start() throws', async () => {
      const activator: BundleActivator = {
        start: vi.fn().mockImplementation(() => {
          throw new Error('start boom');
        }),
        stop: vi.fn(),
      };
      const config: BundleConfiguration = { activator };
      const bundle = await framework.installBundle('test://start-throws', config);

      const events: number[] = [];
      framework.getBundleContext().addBundleListener({ bundleChanged: (e) => events.push(e.getType()) });

      await expect(bundle.start()).rejects.toThrow('start boom');

      expect(bundle.getState()).toBe(BUNDLE_STATES.RESOLVED); // reverted
      // No ACTIVE event should have been emitted for a failed start.
      expect(events).not.toContain(BUNDLE_STATES.ACTIVE);
    });

    it('should log and still reach RESOLVED when activator stop() throws', async () => {
      const activator: BundleActivator = {
        start: vi.fn(),
        stop: vi.fn().mockImplementation(() => {
          throw new Error('stop boom');
        }),
      };
      const config: BundleConfiguration = { activator };
      const bundle = await framework.installBundle('test://stop-throws', config);
      await bundle.start();
      expect(bundle.getState()).toBe(BUNDLE_STATES.ACTIVE);

      const errorSpy = vi.spyOn(framework.getLogger(), 'error');
      const events: number[] = [];
      framework.getBundleContext().addBundleListener({ bundleChanged: (e) => events.push(e.getType()) });

      // stop() swallows the activator error internally.
      await expect(bundle.stop()).resolves.toBeUndefined();

      expect(bundle.getState()).toBe(BUNDLE_STATES.RESOLVED); // still reaches RESOLVED
      expect(errorSpy).toHaveBeenCalledWith(
        'Error in activator stop',
        expect.any(Error),
        expect.objectContaining({ bundleId: bundle.getBundleId() }),
      );
      // The RESOLVED transition event is still emitted despite the stop error.
      expect(events).toContain(BUNDLE_STATES.RESOLVED);
    });
  });

  describe('emitted BundleEvent types', () => {
    it('should emit INSTALLED then RESOLVED during installBundle', async () => {
      const events: number[] = [];
      framework.getBundleContext().addBundleListener({ bundleChanged: (e) => events.push(e.getType()) });

      await framework.installBundle(createBundleModule('emit.install'));

      expect(events).toEqual([BUNDLE_STATES.INSTALLED, BUNDLE_STATES.RESOLVED]);
    });

    it('should emit ACTIVE on start and RESOLVED on stop', async () => {
      const bundle = await framework.installBundle(createBundleModule('emit.startstop'));

      const events: number[] = [];
      framework.getBundleContext().addBundleListener({ bundleChanged: (e) => events.push(e.getType()) });

      await bundle.start();
      await bundle.stop();

      // DIVERGENCE: OSGi fires STARTING before ACTIVE and STOPPING before the
      // stopped/RESOLVED event. Pandino sets the STARTING/STOPPING states
      // internally but never emits a BundleEvent for them, so only the terminal
      // ACTIVE/RESOLVED events are observable.
      expect(events).toEqual([BUNDLE_STATES.ACTIVE, BUNDLE_STATES.RESOLVED]);
      expect(events).not.toContain(BUNDLE_STATES.STARTING);
      expect(events).not.toContain(BUNDLE_STATES.STOPPING);
    });

    it('should emit UNINSTALLED on uninstall of a resolved bundle', async () => {
      const bundle = await framework.installBundle(createBundleModule('emit.uninstall'));

      const events: number[] = [];
      framework.getBundleContext().addBundleListener({ bundleChanged: (e) => events.push(e.getType()) });

      await bundle.uninstall();

      expect(events).toEqual([BUNDLE_STATES.UNINSTALLED]);
    });

    it('should emit the full ACTUAL sequence across a complete lifecycle', async () => {
      const events: number[] = [];
      framework.getBundleContext().addBundleListener({ bundleChanged: (e) => events.push(e.getType()) });

      const bundle = await framework.installBundle(createBundleModule('emit.full'));
      await bundle.start();
      await bundle.stop();
      await bundle.uninstall();

      // DIVERGENCE: STARTING (8) and STOPPING (16) are never emitted. The
      // observable sequence is INSTALLED, RESOLVED (from install), ACTIVE
      // (start), RESOLVED (stop), UNINSTALLED (uninstall). The bundle is already
      // RESOLVED when uninstall runs, so no extra stop event precedes UNINSTALLED.
      expect(events).toEqual([
        BUNDLE_STATES.INSTALLED,
        BUNDLE_STATES.RESOLVED,
        BUNDLE_STATES.ACTIVE,
        BUNDLE_STATES.RESOLVED,
        BUNDLE_STATES.UNINSTALLED,
      ]);
    });

    it('should emit RESOLVED (from implicit stop) then UNINSTALLED when uninstalling an ACTIVE bundle', async () => {
      const bundle = await framework.installBundle(createBundleModule('emit.uninstall.active'));
      await bundle.start();

      const events: number[] = [];
      framework.getBundleContext().addBundleListener({ bundleChanged: (e) => events.push(e.getType()) });

      await bundle.uninstall();

      // uninstall() calls stop() first (emitting RESOLVED), then emits UNINSTALLED.
      expect(events).toEqual([BUNDLE_STATES.RESOLVED, BUNDLE_STATES.UNINSTALLED]);
    });
  });

  describe('bundle listener robustness', () => {
    it('should still notify other listeners when one listener throws', async () => {
      const good1: BundleListener = { bundleChanged: vi.fn() };
      const throwing: BundleListener = {
        bundleChanged: vi.fn().mockImplementation(() => {
          throw new Error('listener boom');
        }),
      };
      const good2: BundleListener = { bundleChanged: vi.fn() };

      const context = framework.getBundleContext();
      context.addBundleListener(good1);
      context.addBundleListener(throwing);
      context.addBundleListener(good2);

      // Should not reject even though a listener throws (error is caught+logged).
      await expect(framework.installBundle(createBundleModule('listener.throws'))).resolves.toBeDefined();

      expect(throwing.bundleChanged).toHaveBeenCalled();
      expect(good1.bundleChanged).toHaveBeenCalled();
      expect(good2.bundleChanged).toHaveBeenCalled();
    });

    it('should treat removeBundleListener on a never-registered listener as a no-op', () => {
      const context = framework.getBundleContext();
      const neverRegistered: BundleListener = { bundleChanged: vi.fn() };

      expect(() => context.removeBundleListener(neverRegistered)).not.toThrow();
    });
  });
});
