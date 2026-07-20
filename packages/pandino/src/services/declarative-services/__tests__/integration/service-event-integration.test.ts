import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OSGiFramework } from '../../../../framework/framework';
import type { BundleContext } from '../../../../framework/interfaces';
import { Activate, Component, Deactivate, Reference } from '@pandino/decorators';
import { ServiceComponentRuntimeBundleActivator } from '../../bundle';
import type { ServiceComponentRuntime } from '../../scr';

/**
 * Group 4 — the SCR reference state machine driven by REAL framework service
 * events through the wired activator (addServiceListener) + serialized queue.
 * These prove the previously-dormant dynamic behavior now runs at runtime.
 */
describe('SCR runtime service-event integration', () => {
  let framework: OSGiFramework;
  let bundleContext: BundleContext;
  let activator: ServiceComponentRuntimeBundleActivator;
  let bundleId: number;

  const getSCR = (): ServiceComponentRuntime => {
    const ref = bundleContext.getServiceReference('ServiceComponentRuntime')!;
    return bundleContext.getService(ref) as any;
  };

  const flush = () => new Promise((resolve) => setTimeout(resolve, 20));

  beforeEach(async () => {
    framework = new OSGiFramework();
    await framework.start();
    bundleContext = framework.getBundleContext();
    bundleId = bundleContext.getBundle().getBundleId();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    activator = new ServiceComponentRuntimeBundleActivator();
    await activator.start(bundleContext);
  });

  afterEach(async () => {
    try {
      await activator.stop(bundleContext);
    } catch {
      /* ignore */
    }
    await framework.stop();
  });

  it('binds a service registered AFTER the component is active', async () => {
    const scr = getSCR();
    const bound: any[] = [];

    @Component({ name: 'rt.consumer', immediate: true })
    class Consumer {
      @Reference({ interface: 'RuntimeService', cardinality: '0..n', policy: 'dynamic', bind: 'bindRt' })
      private list: any[] = [];
      bindRt(s: any) {
        bound.push(s);
      }
      @Activate
      activate() {}
    }

    await scr.registerComponent(Consumer, bundleId);
    await scr.activateComponent(bundleId, 'rt.consumer');
    expect(bound).toEqual([]);

    const svc = { id: 'rt1' };
    bundleContext.registerService('RuntimeService', svc);
    await flush();

    expect(bound).toEqual([svc]);
  });

  it('unbinds a dynamic service when it is unregistered at runtime', async () => {
    const scr = getSCR();
    const events: string[] = [];

    @Component({ name: 'rt.unbind', immediate: true })
    class Consumer {
      @Reference({ interface: 'RuntimeService', cardinality: '0..n', policy: 'dynamic', bind: 'bindRt', unbind: 'unbindRt' })
      private list: any[] = [];
      bindRt(s: any) {
        events.push(`bind:${s.id}`);
      }
      unbindRt(s: any) {
        events.push(`unbind:${s?.id}`);
      }
      @Activate
      activate() {}
    }

    await scr.registerComponent(Consumer, bundleId);
    await scr.activateComponent(bundleId, 'rt.unbind');

    const reg = bundleContext.registerService('RuntimeService', { id: 'rt1' });
    await flush();
    expect(events).toEqual(['bind:rt1']);

    reg.unregister();
    await flush();
    expect(events).toEqual(['bind:rt1', 'unbind:rt1']);
  });

  it('reactivates a greedy static component onto a higher-ranked service (SP-GRD-01 live)', async () => {
    const scr = getSCR();
    const events: string[] = [];

    @Component({ name: 'rt.greedy', immediate: true })
    class C {
      @Reference({
        interface: 'RankedService',
        cardinality: '1..1',
        policy: 'static',
        policyOption: 'greedy',
        bind: 'bindS',
        unbind: 'unbindS',
      })
      private s?: any;
      bindS(s: any) {
        events.push(`bind:${s.id}`);
      }
      unbindS(s: any) {
        events.push(`unbind:${s?.id}`);
      }
      @Activate
      activate() {
        events.push('activate');
      }
      @Deactivate
      deactivate() {
        events.push('deactivate');
      }
    }

    bundleContext.registerService('RankedService', { id: 's1' }, { 'service.ranking': 5 });
    await scr.registerComponent(C, bundleId);
    await scr.activateComponent(bundleId, 'rt.greedy');
    await flush();
    expect(events).toEqual(['bind:s1', 'activate']);

    bundleContext.registerService('RankedService', { id: 's2' }, { 'service.ranking': 10 });
    await flush();

    expect(events).toEqual(['bind:s1', 'activate', 'unbind:s1', 'deactivate', 'bind:s2', 'activate']);
  });

  it('deactivates when a mandatory service unregisters with no replacement (SP-GRD-02 live)', async () => {
    const scr = getSCR();
    const events: string[] = [];

    @Component({ name: 'rt.mandatory', immediate: true })
    class C {
      @Reference({ interface: 'MandService', cardinality: '1..1', policy: 'static', bind: 'bindS', unbind: 'unbindS' })
      private s?: any;
      bindS() {
        events.push('bind');
      }
      unbindS() {
        events.push('unbind');
      }
      @Activate
      activate() {
        events.push('activate');
      }
      @Deactivate
      deactivate() {
        events.push('deactivate');
      }
    }

    const reg = bundleContext.registerService('MandService', { id: 'm1' });
    await scr.registerComponent(C, bundleId);
    await scr.activateComponent(bundleId, 'rt.mandatory');
    await flush();
    expect(events).toEqual(['bind', 'activate']);

    reg.unregister();
    await flush();

    expect(events).toContain('unbind');
    expect(events).toContain('deactivate');
  });
});
