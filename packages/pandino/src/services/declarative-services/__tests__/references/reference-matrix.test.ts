import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OSGiFramework } from '../../../../framework/framework';
import type { BundleContext, ServiceReference } from '../../../../framework/interfaces';
import { ServiceComponentRuntime } from '../../scr';
import { Activate, Component, Deactivate, Modified, Reference, Service } from '@pandino/decorators';

/**
 * Group 6 — Reference Matrix.
 *
 * Systematically exercises the OSGi DS "Component Lifecycle Matrix" (see
 * spec.md) against the ACTUAL behavior of this runtime. Where the runtime
 * diverges from the spec, the test asserts the real behavior and carries a
 * `// DIVERGENCE:` comment naming the spec scenario it fails.
 *
 * No source is modified — these tests document the runtime as it exists.
 *
 * Harness mirrors service-references.test.ts: real OSGiFramework + a real
 * BundleContext whose getServiceReferences/getService are stubbed to simulate
 * the service registry. Components are driven through the public SCR API
 * (registerComponent / activateComponent / processServiceEvent /
 * updateComponentConfiguration).
 */
describe('Reference Matrix (group 6)', () => {
  let framework: OSGiFramework;
  let scr: ServiceComponentRuntime;
  let bundleContext: BundleContext;
  let bundleId: number;

  const makeRef = (): ServiceReference<any> =>
    ({
      getProperty: vi.fn(),
      getPropertyKeys: vi.fn().mockReturnValue([]),
      getBundle: vi.fn(),
      isAssignableTo: vi.fn().mockReturnValue(true),
    }) as unknown as ServiceReference<any>;

  beforeEach(async () => {
    framework = new OSGiFramework();
    await framework.start();
    bundleContext = framework.getBundleContext();
    scr = new ServiceComponentRuntime(framework, bundleContext);
    bundleId = bundleContext.getBundle().getBundleId();
  });

  // ---------------------------------------------------------------------------
  // Cardinality × policy × policyOption
  // ---------------------------------------------------------------------------
  describe('Cardinality × policy × policyOption', () => {
    it('1..1 static reluctant: satisfaction gated on mandatory ref presence', async () => {
      const activateTracker: string[] = [];

      @Component({ name: 'card.1to1.satisfaction', immediate: true })
      class C {
        @Reference({ interface: 'S', cardinality: '1..1', bind: 'bindS' })
        private s?: any;
        bindS(_s: any) {}
        @Activate
        activate() {
          activateTracker.push('activate');
        }
      }

      // No matching service yet.
      bundleContext.getServiceReferences = vi.fn().mockReturnValue([]);
      bundleContext.getService = vi.fn().mockReturnValue(null);

      await scr.registerComponent(C, bundleId);

      // UNSATISFIED: immediate component must NOT activate without its 1..1 ref.
      expect(scr.getComponent(bundleId, 'card.1to1.satisfaction')?.instance).toBeNull();
      expect(activateTracker).toEqual([]);

      // Service arrives -> SATISFIED -> immediate activation (SA-IMM-01).
      const ref = makeRef();
      const svc = { id: 'svc' };
      bundleContext.getServiceReferences = vi.fn().mockReturnValue([ref]);
      bundleContext.getService = vi.fn().mockReturnValue(svc);

      await scr.processServiceEvent('S', 'registered', ref);

      expect(scr.getComponent(bundleId, 'card.1to1.satisfaction')?.instance).toBeTruthy();
      expect(activateTracker).toEqual(['activate']);
    });

    it('1..1 static reluctant: binds before @Activate', async () => {
      const order: string[] = [];

      @Component({ name: 'card.1to1.bind' })
      class C {
        @Reference({ interface: 'S', cardinality: '1..1', bind: 'bindS' })
        private s?: any;
        bindS(_s: any) {
          order.push('bind');
        }
        @Activate
        activate() {
          order.push('activate');
        }
      }

      const ref = makeRef();
      const svc = { id: 'svc' };
      bundleContext.getServiceReferences = vi.fn().mockReturnValue([ref]);
      bundleContext.getService = vi.fn().mockReturnValue(svc);

      await scr.registerComponent(C, bundleId);
      await scr.activateComponent(bundleId, 'card.1to1.bind');

      // Bindings are established before @Activate so injected fields are ready.
      expect(order).toEqual(['bind', 'activate']);
    });

    it('1..1 static: explicit activation of an unsatisfied mandatory ref rejects', async () => {
      @Component({ name: 'card.1to1.reject' })
      class C {
        @Reference({ interface: 'S', cardinality: '1..1', bind: 'bindS' })
        private s?: any;
        bindS(_s: any) {}
        @Activate
        activate() {}
      }

      bundleContext.getServiceReferences = vi.fn().mockReturnValue([]);
      bundleContext.getService = vi.fn().mockReturnValue(null);

      await scr.registerComponent(C, bundleId);

      await expect(scr.activateComponent(bundleId, 'card.1to1.reject')).rejects.toThrow(
        /Mandatory reference S not satisfied/,
      );
    });

    it('0..1 static: activates without the optional ref, binds when present', async () => {
      const activateTracker: string[] = [];
      const bindTracker: any[] = [];

      @Component({ name: 'card.0to1', immediate: true })
      class C {
        @Reference({ interface: 'S', cardinality: '0..1', bind: 'bindS' })
        private s?: any;
        bindS(s: any) {
          bindTracker.push(s);
        }
        @Activate
        activate() {
          activateTracker.push('activate');
        }
      }

      // No optional service present.
      bundleContext.getServiceReferences = vi.fn().mockReturnValue([]);
      bundleContext.getService = vi.fn().mockReturnValue(null);

      await scr.registerComponent(C, bundleId);

      // Optional cardinality => activates anyway, without binding.
      expect(scr.getComponent(bundleId, 'card.0to1')?.instance).toBeTruthy();
      expect(activateTracker).toEqual(['activate']);
      expect(bindTracker).toEqual([]);
    });

    it('0..1 static: binds the optional ref when available at activation', async () => {
      const bindTracker: any[] = [];

      @Component({ name: 'card.0to1.present' })
      class C {
        @Reference({ interface: 'S', cardinality: '0..1', bind: 'bindS' })
        private s?: any;
        bindS(s: any) {
          bindTracker.push(s);
        }
        @Activate
        activate() {}
      }

      const ref = makeRef();
      const svc = { id: 'svc' };
      bundleContext.getServiceReferences = vi.fn().mockReturnValue([ref]);
      bundleContext.getService = vi.fn().mockReturnValue(svc);

      await scr.registerComponent(C, bundleId);
      await scr.activateComponent(bundleId, 'card.0to1.present');

      expect(bindTracker).toEqual([svc]);
    });

    it('0..n dynamic greedy: binds every matching service', async () => {
      const bound: any[] = [];

      @Component({ name: 'card.0ton.dynamic' })
      class C {
        @Reference({
          interface: 'S',
          cardinality: '0..n',
          policy: 'dynamic',
          policyOption: 'greedy',
          bind: 'bindS',
          unbind: 'unbindS',
        })
        private list: any[] = [];
        bindS(s: any) {
          bound.push(s);
        }
        unbindS() {}
        @Activate
        activate() {}
      }

      const r1 = makeRef();
      const r2 = makeRef();
      const s1 = { id: 's1' };
      const s2 = { id: 's2' };
      bundleContext.getServiceReferences = vi.fn().mockReturnValue([r1, r2]);
      bundleContext.getService = vi.fn().mockImplementation((r: any) => (r === r1 ? s1 : s2));

      await scr.registerComponent(C, bundleId);
      await scr.activateComponent(bundleId, 'card.0ton.dynamic');

      // Both services are bound. Every distinct service is present.
      expect(new Set(bound)).toEqual(new Set([s1, s2]));
      // DIVERGENCE: dynamic refs are bound twice during activation — the
      // singleton path runs satisfyReferences() a second time for dynamic refs
      // (pre-@Activate pass + post-@Activate pass), so bind fires 2x per
      // service (4 total) instead of once. Spec DP-ADD-01 expects a single bind.
      expect(bound.length).toBe(4);
    });

    it('1..n: satisfaction gated on at least one matching service', async () => {
      const activateTracker: string[] = [];
      const bound: any[] = [];

      @Component({ name: 'card.1ton', immediate: true })
      class C {
        @Reference({ interface: 'S', cardinality: '1..n', bind: 'bindS' })
        private list: any[] = [];
        bindS(s: any) {
          bound.push(s);
        }
        @Activate
        activate() {
          activateTracker.push('activate');
        }
      }

      bundleContext.getServiceReferences = vi.fn().mockReturnValue([]);
      bundleContext.getService = vi.fn().mockReturnValue(null);

      await scr.registerComponent(C, bundleId);

      // UNSATISFIED: no service for a mandatory-multiple ref.
      expect(scr.getComponent(bundleId, 'card.1ton')?.instance).toBeNull();
      expect(activateTracker).toEqual([]);

      // Two services arrive -> SATISFIED -> activation binds all.
      const r1 = makeRef();
      const r2 = makeRef();
      const s1 = { id: 's1' };
      const s2 = { id: 's2' };
      bundleContext.getServiceReferences = vi.fn().mockReturnValue([r1, r2]);
      bundleContext.getService = vi.fn().mockImplementation((r: any) => (r === r1 ? s1 : s2));

      await scr.processServiceEvent('S', 'registered', r1);

      expect(scr.getComponent(bundleId, 'card.1ton')?.instance).toBeTruthy();
      expect(activateTracker).toEqual(['activate']);
      expect(new Set(bound)).toEqual(new Set([s1, s2]));
    });

    it('DIVERGENCE: policyOption (greedy vs reluctant) has no behavioral effect', async () => {
      const events: string[] = [];

      // Two identical components differing only by policyOption on a static ref.
      @Component({ name: 'po.reluctant', immediate: true })
      class Reluctant {
        @Reference({ interface: 'S', cardinality: '1..1', policy: 'static', policyOption: 'reluctant', bind: 'bindS' })
        private s?: any;
        bindS(_s: any) {
          events.push('reluctant:bind');
        }
        @Activate
        activate() {}
      }

      @Component({ name: 'po.greedy', immediate: true })
      class Greedy {
        @Reference({ interface: 'S', cardinality: '1..1', policy: 'static', policyOption: 'greedy', bind: 'bindS' })
        private s?: any;
        bindS(_s: any) {
          events.push('greedy:bind');
        }
        @Activate
        activate() {}
      }

      const r1 = makeRef();
      const s1 = { id: 's1' };
      bundleContext.getServiceReferences = vi.fn().mockReturnValue([r1]);
      bundleContext.getService = vi.fn().mockReturnValue(s1);

      await scr.registerComponent(Reluctant, bundleId);
      await scr.registerComponent(Greedy, bundleId);

      // A higher-ranked S2 arrives.
      const r2 = makeRef();
      const s2 = { id: 's2', rank: 10 };
      bundleContext.getService = vi.fn().mockReturnValue(s2);
      await scr.processServiceEvent('S', 'registered', r2);

      // DIVERGENCE: policyOption is parsed into metadata but never read by
      // scr.ts. Both reluctant and greedy react identically to the new service
      // (both rebind in place). Spec SP-REL-02 requires reluctant to IGNORE the
      // new service; SP-GRD-01 requires greedy to deactivate+reactivate.
      expect(events).toEqual(['reluctant:bind', 'greedy:bind', 'reluctant:bind', 'greedy:bind']);
    });
  });

  // ---------------------------------------------------------------------------
  // Static greedy rebind — "Greedy Static Trap" (SP-GRD-01)
  // ---------------------------------------------------------------------------
  describe('Static greedy rebind ("greedy static trap")', () => {
    it('DIVERGENCE: higher-ranked service rebinds in place, no deactivate/reactivate', async () => {
      const events: string[] = [];

      @Component({ name: 'greedy.trap' })
      class C {
        @Reference({
          interface: 'S',
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

      const r1 = makeRef();
      const s1 = { id: 's1' };
      bundleContext.getServiceReferences = vi.fn().mockReturnValue([r1]);
      bundleContext.getService = vi.fn().mockReturnValue(s1);

      await scr.registerComponent(C, bundleId);
      await scr.activateComponent(bundleId, 'greedy.trap');

      const before = scr.getComponent(bundleId, 'greedy.trap')?.instance;

      // A higher-ranked S2 arrives.
      const r2 = makeRef();
      const s2 = { id: 's2' };
      bundleContext.getService = vi.fn().mockReturnValue(s2);
      await scr.processServiceEvent('S', 'registered', r2);

      const after = scr.getComponent(bundleId, 'greedy.trap')?.instance;

      // DIVERGENCE: spec SP-GRD-01 mandates unbind(s1) + @Deactivate + create a
      // NEW instance + bind(s2) + @Activate. This runtime never checks
      // policy/policyOption in processServiceEvent — it just calls bind(s2) on
      // the SAME still-active instance. No unbind, no deactivate, no new
      // instance.
      expect(events).toEqual(['bind:s1', 'activate', 'bind:s2']);
      expect(after).toBe(before);
    });
  });

  // ---------------------------------------------------------------------------
  // Delayed component (immediate=false) — SA-DLY-01 / SA-DLY-02
  // ---------------------------------------------------------------------------
  describe('Delayed component activation', () => {
    it('DIVERGENCE: delayed component stays fully INACTIVE after register (no service factory)', async () => {
      const activateTracker: string[] = [];

      @Component({ name: 'delayed.provider', immediate: false })
      @Service({ interfaces: ['P'] })
      class C {
        @Activate
        activate() {
          activateTracker.push('activate');
        }
      }

      bundleContext.getServiceReferences = vi.fn().mockReturnValue([]);
      bundleContext.getService = vi.fn().mockReturnValue(null);

      await scr.registerComponent(C, bundleId);

      const entry = scr.getComponent(bundleId, 'delayed.provider');

      // DIVERGENCE: spec SA-DLY-01 requires the runtime to register a service
      // factory for provider P once SATISFIED (SATISFIED/INACTIVE state), while
      // leaving the instance uninstantiated. This runtime does neither on
      // register: no instance AND no service registration. The component simply
      // sits dormant until activateComponent is called explicitly.
      expect(entry?.instance).toBeNull();
      expect(entry?.serviceRegistration).toBeUndefined();
      expect(activateTracker).toEqual([]);
    });

    it('DIVERGENCE: explicit activation instantiates eagerly (no getService interception)', async () => {
      const activateTracker: string[] = [];

      @Component({ name: 'delayed.eager', immediate: false })
      @Service({ interfaces: ['P'] })
      class C {
        @Activate
        activate() {
          activateTracker.push('activate');
        }
      }

      bundleContext.getServiceReferences = vi.fn().mockReturnValue([]);
      bundleContext.getService = vi.fn().mockReturnValue(null);

      await scr.registerComponent(C, bundleId);
      await scr.activateComponent(bundleId, 'delayed.eager');

      // DIVERGENCE: spec SA-DLY-02 defers @Activate until the first getService(P)
      // call. Here activateComponent eagerly instantiates and invokes @Activate;
      // there is no lazy just-in-time activation path.
      expect(scr.getComponent(bundleId, 'delayed.eager')?.instance).toBeTruthy();
      expect(activateTracker).toEqual(['activate']);
    });
  });

  // ---------------------------------------------------------------------------
  // Dynamic updated() on MODIFIED (DP dynamics)
  // ---------------------------------------------------------------------------
  describe('Dynamic updated() on service property change (MODIFIED)', () => {
    it('fires updated() on the active instance when a bound service is modified', async () => {
      const events: string[] = [];

      @Component({ name: 'dyn.updated' })
      class C {
        @Reference({
          interface: 'S',
          cardinality: '0..1',
          policy: 'dynamic',
          bind: 'bindS',
          unbind: 'unbindS',
          updated: 'updatedS',
        })
        private s?: any;
        bindS(_s: any) {
          events.push('bind');
        }
        unbindS() {
          events.push('unbind');
        }
        updatedS(s: any) {
          events.push(`updated:${s.rev}`);
        }
        @Activate
        activate() {}
      }

      const ref = makeRef();
      const svc = { id: 's', rev: 1 };
      bundleContext.getServiceReferences = vi.fn().mockReturnValue([ref]);
      bundleContext.getService = vi.fn().mockReturnValue(svc);

      await scr.registerComponent(C, bundleId);
      await scr.activateComponent(bundleId, 'dyn.updated');

      // Bound service's properties change.
      const modified = { id: 's', rev: 2 };
      bundleContext.getService = vi.fn().mockReturnValue(modified);
      await scr.processServiceEvent('S', 'modified', ref);

      // updated() is invoked in place; instance stays ACTIVE (no deactivate).
      expect(events).toContain('updated:2');
      expect(scr.getComponent(bundleId, 'dyn.updated')?.instance).toBeTruthy();
    });
  });

  // ---------------------------------------------------------------------------
  // Configuration updates (CU-MOD-01 / CU-NOM-01)
  // ---------------------------------------------------------------------------
  describe('Configuration updates', () => {
    it('with @Modified: updates in place, instance stays ACTIVE', async () => {
      const events: string[] = [];

      @Component({ name: 'cfg.modified', immediate: true })
      class C {
        @Activate
        activate() {
          events.push('activate');
        }
        @Deactivate
        deactivate() {
          events.push('deactivate');
        }
        @Modified
        modified(cfg: any) {
          events.push(`modified:${cfg.v}`);
        }
      }

      bundleContext.getServiceReferences = vi.fn().mockReturnValue([]);
      bundleContext.getService = vi.fn().mockReturnValue(null);

      await scr.registerComponent(C, bundleId);
      const before = scr.getComponent(bundleId, 'cfg.modified')?.instance;

      await scr.updateComponentConfiguration(bundleId, 'cfg.modified', { v: 2 });

      const after = scr.getComponent(bundleId, 'cfg.modified')?.instance;

      // CU-MOD-01: @Modified invoked, instance unchanged, no deactivate.
      expect(events).toEqual(['activate', 'modified:2']);
      expect(after).toBe(before);
    });

    it('DIVERGENCE: without @Modified, config update does NOT deactivate/reactivate', async () => {
      const events: string[] = [];

      @Component({ name: 'cfg.nomod', immediate: true })
      class C {
        @Activate
        activate() {
          events.push('activate');
        }
        @Deactivate
        deactivate() {
          events.push('deactivate');
        }
      }

      bundleContext.getServiceReferences = vi.fn().mockReturnValue([]);
      bundleContext.getService = vi.fn().mockReturnValue(null);

      await scr.registerComponent(C, bundleId);
      const before = scr.getComponent(bundleId, 'cfg.nomod')?.instance;

      await scr.updateComponentConfiguration(bundleId, 'cfg.nomod', { v: 2 });

      const after = scr.getComponent(bundleId, 'cfg.nomod')?.instance;

      // DIVERGENCE: spec CU-NOM-01 ("Missing Modified Deactivation") mandates a
      // full @Deactivate + @Activate cycle producing a NEW instance. This
      // runtime is a no-op when @Modified is absent: it only publishes an SCR
      // event. The original instance survives untouched.
      expect(events).toEqual(['activate']);
      expect(after).toBe(before);
    });
  });

  // ---------------------------------------------------------------------------
  // Optional static departure (0..1, 0..n) — DP-REM for optional cardinality
  // ---------------------------------------------------------------------------
  describe('Optional reference departure', () => {
    it('0..1: departure unbinds but does NOT deactivate the component', async () => {
      const events: string[] = [];

      @Component({ name: 'opt.0to1.depart' })
      class C {
        @Reference({ interface: 'S', cardinality: '0..1', bind: 'bindS', unbind: 'unbindS' })
        private s?: any;
        bindS(_s: any) {
          events.push('bind');
        }
        unbindS(s: any) {
          events.push('unbind');
          unbindArg = s;
        }
        @Activate
        activate() {}
        @Deactivate
        deactivate() {
          events.push('deactivate');
        }
      }

      let unbindArg: any;
      const ref = makeRef();
      const svc = { id: 's' };
      bundleContext.getServiceReferences = vi.fn().mockReturnValue([ref]);
      bundleContext.getService = vi.fn().mockReturnValue(svc);

      await scr.registerComponent(C, bundleId);
      await scr.activateComponent(bundleId, 'opt.0to1.depart');

      await scr.processServiceEvent('S', 'unregistered', ref);

      // Component remains ACTIVE; only unbind fires. No deactivate.
      // unbind receives the departing service object (per OSGi).
      expect(events).toEqual(['bind', 'unbind']);
      expect(unbindArg).toBe(svc);
      expect(scr.getComponent(bundleId, 'opt.0to1.depart')?.instance).toBeTruthy();
    });

    it('0..n: departure unbinds but does NOT deactivate the component', async () => {
      const events: string[] = [];

      @Component({ name: 'opt.0ton.depart' })
      class C {
        @Reference({ interface: 'S', cardinality: '0..n', bind: 'bindS', unbind: 'unbindS' })
        private list: any[] = [];
        bindS(_s: any) {
          events.push('bind');
        }
        unbindS() {
          events.push('unbind');
        }
        @Activate
        activate() {}
        @Deactivate
        deactivate() {
          events.push('deactivate');
        }
      }

      const ref = makeRef();
      const svc = { id: 's' };
      bundleContext.getServiceReferences = vi.fn().mockReturnValue([ref]);
      bundleContext.getService = vi.fn().mockReturnValue(svc);

      await scr.registerComponent(C, bundleId);
      await scr.activateComponent(bundleId, 'opt.0ton.depart');

      const bindCount = events.filter((e) => e === 'bind').length;

      await scr.processServiceEvent('S', 'unregistered', ref);

      // Component remains ACTIVE; unbind fires, field reset to []. No deactivate.
      expect(events).toContain('unbind');
      expect(events).not.toContain('deactivate');
      expect(events.filter((e) => e === 'unbind').length).toBe(1);
      expect(scr.getComponent(bundleId, 'opt.0ton.depart')?.instance).toBeTruthy();
      // Guard: bind ran during activation (documents dynamic double-pass count).
      expect(bindCount).toBeGreaterThanOrEqual(1);
    });
  });
});
