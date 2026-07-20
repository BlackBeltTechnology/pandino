import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OSGiFramework } from '../../../../framework/framework';
import type { BundleContext, ServiceEvent, ServiceReference } from '../../../../framework/interfaces';
import { SERVICE_EVENT_TYPES } from '../../../../types/constants';
import { ServiceComponentRuntime } from '../../scr';
import { Activate, Component, Reference } from '@pandino/decorators';

/**
 * Group 1 — serialized, re-entrancy-safe service-event delivery.
 * The framework emits service events synchronously, so an SCR reaction that
 * re-emits must enqueue (FIFO) rather than process nested.
 */
describe('SCR service-event queue', () => {
  let framework: OSGiFramework;
  let scr: ServiceComponentRuntime;
  let bundleContext: BundleContext;
  let bundleId: number;

  const refFor = (id: string): ServiceReference<any> =>
    ({
      getProperty: vi.fn((key: string) => {
        if (key === 'objectClass') return 'S';
        if (key === 'service.id') return id;
        return undefined;
      }),
      getPropertyKeys: vi.fn().mockReturnValue(['objectClass', 'service.id']),
      getBundle: vi.fn(),
      isAssignableTo: vi.fn().mockReturnValue(true),
    }) as unknown as ServiceReference<any>;

  const eventFor = (type: number, ref: ServiceReference<any>): ServiceEvent =>
    ({ getType: () => type, getServiceReference: () => ref }) as unknown as ServiceEvent;

  const flush = () => new Promise((resolve) => setTimeout(resolve, 10));

  beforeEach(async () => {
    framework = new OSGiFramework();
    await framework.start();
    bundleContext = framework.getBundleContext();
    scr = new ServiceComponentRuntime(framework, bundleContext);
    bundleId = bundleContext.getBundle().getBundleId();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('processes a re-entrant emit serially (FIFO), never nested', async () => {
    const order: string[] = [];
    let reentered = false;

    const r1 = refFor('s1');
    const r2 = refFor('s2');
    const s1 = { id: 's1' };
    const s2 = { id: 's2' };
    const registry = new Map<any, any>([
      [r1, s1],
      [r2, s2],
    ]);

    @Component({ name: 'reentrant', immediate: true })
    class C {
      @Reference({ interface: 'S', cardinality: '0..n', policy: 'dynamic', bind: 'bindS' })
      private list: any[] = [];
      bindS(s: any) {
        order.push(`start:${s.id}`);
        if (s.id === 's1' && !reentered) {
          reentered = true;
          // Re-emit synchronously from within the reaction (simulates the
          // framework emitting during an SCR-driven registration).
          scr.handleServiceEvent(eventFor(SERVICE_EVENT_TYPES.REGISTERED, r2));
        }
        order.push(`end:${s.id}`);
      }
      @Activate
      activate() {}
    }

    bundleContext.getServiceReferences = vi.fn().mockReturnValue([]);
    bundleContext.getService = vi.fn().mockImplementation((r: any) => registry.get(r) ?? null);

    await scr.registerComponent(C, bundleId);
    await scr.activateComponent(bundleId, 'reentrant');

    scr.handleServiceEvent(eventFor(SERVICE_EVENT_TYPES.REGISTERED, r1));
    await flush();

    // Serialized: s1 fully completes before s2 begins.
    expect(order).toEqual(['start:s1', 'end:s1', 'start:s2', 'end:s2']);
  });

  it('isolates errors: a throwing event does not stop the next', async () => {
    const bound: string[] = [];

    const r1 = refFor('s1');
    const r2 = refFor('s2');
    const s1 = { id: 's1' };
    const s2 = { id: 's2' };
    const registry = new Map<any, any>([
      [r1, s1],
      [r2, s2],
    ]);

    @Component({ name: 'thrower', immediate: true })
    class C {
      @Reference({ interface: 'S', cardinality: '0..n', policy: 'dynamic', bind: 'bindS' })
      private list: any[] = [];
      bindS(s: any) {
        if (s.id === 's1') throw new Error('boom');
        bound.push(s.id);
      }
      @Activate
      activate() {}
    }

    bundleContext.getServiceReferences = vi.fn().mockReturnValue([]);
    bundleContext.getService = vi.fn().mockImplementation((r: any) => registry.get(r) ?? null);

    await scr.registerComponent(C, bundleId);
    await scr.activateComponent(bundleId, 'thrower');

    scr.handleServiceEvent(eventFor(SERVICE_EVENT_TYPES.REGISTERED, r1));
    scr.handleServiceEvent(eventFor(SERVICE_EVENT_TYPES.REGISTERED, r2));
    await flush();

    expect(bound).toEqual(['s2']);
  });

  it('does not permanently lock out a component whose activation failed once (SEV-1)', async () => {
    let failFirst = true;

    @Component({ name: 'flaky', immediate: false })
    class C {
      @Activate
      activate() {
        if (failFirst) {
          failFirst = false;
          throw new Error('first activation fails');
        }
      }
    }

    bundleContext.getServiceReferences = vi.fn().mockReturnValue([]);
    bundleContext.getService = vi.fn().mockReturnValue(null);

    await scr.registerComponent(C, bundleId);

    // First activation throws and must clean up the activation chain.
    await expect(scr.activateComponent(bundleId, 'flaky')).rejects.toThrow('first activation fails');

    // Retry must actually activate — NOT a false "circular reference" caused by a
    // leaked activation-chain entry.
    await scr.activateComponent(bundleId, 'flaky');
    expect(scr.getComponent(bundleId, 'flaky')?.instance).toBeTruthy();
  });

  it('ignores unknown service event types', async () => {
    const r1 = refFor('s1');
    bundleContext.getServiceReferences = vi.fn().mockReturnValue([]);
    bundleContext.getService = vi.fn().mockReturnValue(null);

    // 0 is not a known SERVICE_EVENT_TYPES value.
    expect(() => scr.handleServiceEvent(eventFor(0, r1))).not.toThrow();
    await flush();
  });
});
