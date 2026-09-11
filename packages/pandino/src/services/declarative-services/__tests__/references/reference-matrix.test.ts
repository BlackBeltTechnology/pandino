import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { BundleContext, ServiceReference } from '../../../../framework/interfaces';
import { ServiceComponentRuntime } from '../../scr';
import { createScrHarness, makeServiceRef, stubServiceRegistry } from '../support/scr-harness';
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
  let scr: ServiceComponentRuntime;
  let bundleContext: BundleContext;
  let bundleId: number;

  beforeEach(async () => {
    ({ scr, bundleContext, bundleId } = await createScrHarness());
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
      stubServiceRegistry(bundleContext, [], null);

      await scr.registerComponent(C, bundleId);

      // UNSATISFIED: immediate component must NOT activate without its 1..1 ref.
      expect(scr.getComponent(bundleId, 'card.1to1.satisfaction')?.instance).toBeNull();
      expect(activateTracker).toEqual([]);

      // Service arrives -> SATISFIED -> immediate activation (SA-IMM-01).
      const ref = makeServiceRef();
      const svc = { id: 'svc' };
      stubServiceRegistry(bundleContext, [ref], svc);

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

      const ref = makeServiceRef();
      const svc = { id: 'svc' };
      stubServiceRegistry(bundleContext, [ref], svc);

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

      stubServiceRegistry(bundleContext, [], null);

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
      stubServiceRegistry(bundleContext, [], null);

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

      const ref = makeServiceRef();
      const svc = { id: 'svc' };
      stubServiceRegistry(bundleContext, [ref], svc);

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

      const r1 = makeServiceRef();
      const r2 = makeServiceRef();
      const s1 = { id: 's1' };
      const s2 = { id: 's2' };
      stubServiceRegistry(bundleContext, [r1, r2], (r: any) => (r === r1 ? s1 : s2));

      await scr.registerComponent(C, bundleId);
      await scr.activateComponent(bundleId, 'card.0ton.dynamic');

      // Both services are bound exactly once each (DP-ADD-01).
      expect(new Set(bound)).toEqual(new Set([s1, s2]));
      expect(bound).toHaveLength(2);
    });

    it('two references to the same interface (unnamed) each bind independently', async () => {
      const a: any[] = [];
      const b: any[] = [];

      @Component({ name: 'two.refs.same.iface' })
      class C {
        @Reference({ interface: 'S', cardinality: '0..n', policy: 'dynamic', bind: 'bindA' })
        private la: any[] = [];
        @Reference({ interface: 'S', cardinality: '0..n', policy: 'dynamic', bind: 'bindB' })
        private lb: any[] = [];
        bindA(s: any) {
          a.push(s);
        }
        bindB(s: any) {
          b.push(s);
        }
        @Activate
        activate() {}
      }

      const r1 = makeServiceRef();
      const s1 = { id: 's1' };
      stubServiceRegistry(bundleContext, [r1], s1);

      await scr.registerComponent(C, bundleId);
      await scr.activateComponent(bundleId, 'two.refs.same.iface');

      // Distinct refKeys (bind method) => neither ref suppresses the other's bind.
      expect(a).toEqual([s1]);
      expect(b).toEqual([s1]);
    });

    it('fieldOption:update does not double-append across the two-pass activation', async () => {
      @Component({ name: 'update.field' })
      class C {
        @Reference({ interface: 'S', cardinality: '0..n', policy: 'dynamic', fieldOption: 'update', field: 'list' })
        private list: any[] = [];
        @Activate
        activate() {}
      }

      const r1 = makeServiceRef();
      const r2 = makeServiceRef();
      const s1 = { id: 's1' };
      const s2 = { id: 's2' };
      stubServiceRegistry(bundleContext, [r1, r2], (r: any) => (r === r1 ? s1 : s2));

      await scr.registerComponent(C, bundleId);
      await scr.activateComponent(bundleId, 'update.field');

      const inst = scr.getComponent(bundleId, 'update.field')?.instance as any;
      // Not [s1, s2, s1, s2] — the second pass must not re-append.
      expect(inst.list).toEqual([s1, s2]);
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

      stubServiceRegistry(bundleContext, [], null);

      await scr.registerComponent(C, bundleId);

      // UNSATISFIED: no service for a mandatory-multiple ref.
      expect(scr.getComponent(bundleId, 'card.1ton')?.instance).toBeNull();
      expect(activateTracker).toEqual([]);

      // Two services arrive -> SATISFIED -> activation binds all.
      const r1 = makeServiceRef();
      const r2 = makeServiceRef();
      const s1 = { id: 's1' };
      const s2 = { id: 's2' };
      stubServiceRegistry(bundleContext, [r1, r2], (r: any) => (r === r1 ? s1 : s2));

      await scr.processServiceEvent('S', 'registered', r1);

      expect(scr.getComponent(bundleId, 'card.1ton')?.instance).toBeTruthy();
      expect(activateTracker).toEqual(['activate']);
      expect(new Set(bound)).toEqual(new Set([s1, s2]));
    });

    it('SP-REL-02: a reluctant static reference ignores a newly-arrived service', async () => {
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

      const r1 = makeServiceRef();
      const s1 = { id: 's1' };
      stubServiceRegistry(bundleContext, [r1], s1);

      await scr.registerComponent(Reluctant, bundleId);
      await scr.registerComponent(Greedy, bundleId);

      // A higher-ranked S2 arrives.
      const r2 = makeServiceRef();
      const s2 = { id: 's2', rank: 10 };
      bundleContext.getService = vi.fn().mockReturnValue(s2);
      await scr.processServiceEvent('S', 'registered', r2);

      // SP-REL-02: reluctant IGNORES the new service. Greedy also does nothing
      // here because the arrival is NOT higher-ranked (equal rank) — the greedy
      // static trap only fires for a strictly higher-ranked service (SP-GRD-01).
      expect(events).toEqual(['reluctant:bind', 'greedy:bind']);
    });
  });

  // ---------------------------------------------------------------------------
  // Static greedy rebind — "Greedy Static Trap" (SP-GRD-01)
  // ---------------------------------------------------------------------------
  describe('Static greedy rebind ("greedy static trap")', () => {
    const rankedRef = (id: string, ranking: number): ServiceReference<any> =>
      makeServiceRef({ 'service.ranking': ranking, 'service.id': id });

    it('SP-GRD-01: higher-ranked service triggers unbind + deactivate + reactivate onto the better service', async () => {
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

      const r1 = rankedRef('s1', 5);
      const s1 = { id: 's1' };
      const r2 = rankedRef('s2', 10);
      const s2 = { id: 's2' };
      const registry = new Map<any, any>([
        [r1, s1],
        [r2, s2],
      ]);
      bundleContext.getService = vi.fn().mockImplementation((r: any) => registry.get(r) ?? null);
      // Only S1 present at activation.
      bundleContext.getServiceReferences = vi.fn().mockReturnValue([r1]);

      await scr.registerComponent(C, bundleId);
      await scr.activateComponent(bundleId, 'greedy.trap');

      const before = scr.getComponent(bundleId, 'greedy.trap')?.instance;

      // A higher-ranked S2 arrives; the registry now returns S2 first (highest).
      bundleContext.getServiceReferences = vi.fn().mockReturnValue([r2, r1]);
      await scr.processServiceEvent('S', 'registered', r2);

      const after = scr.getComponent(bundleId, 'greedy.trap')?.instance;

      // SP-GRD-01: full reactivation onto the higher-ranked service.
      expect(events).toEqual(['bind:s1', 'activate', 'unbind:s1', 'deactivate', 'bind:s2', 'activate']);
      expect(after).not.toBe(before);
    });

    it('SP-GRD-02: unregistering the bound service of a mandatory static ref deactivates the component', async () => {
      const events: string[] = [];

      @Component({ name: 'greedy.loss' })
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

      const r1 = rankedRef('s1', 5);
      const s1 = { id: 's1' };
      const registry = new Map<any, any>([[r1, s1]]);
      bundleContext.getService = vi.fn().mockImplementation((r: any) => registry.get(r) ?? null);
      bundleContext.getServiceReferences = vi.fn().mockReturnValue([r1]);

      await scr.registerComponent(C, bundleId);
      await scr.activateComponent(bundleId, 'greedy.loss');

      // The bound service departs with no replacement available.
      bundleContext.getServiceReferences = vi.fn().mockReturnValue([]);
      await scr.processServiceEvent('S', 'unregistered', r1);

      expect(events).toEqual(['bind:s1', 'activate', 'unbind:s1', 'deactivate']);
      expect(scr.getComponent(bundleId, 'greedy.loss')?.instance).toBeFalsy();
    });

    it('#4 static: mandatory ref reactivates onto a survivor when its bound service departs', async () => {
      const events: string[] = [];

      @Component({ name: 'mand.survivor.static' })
      class C {
        @Reference({ interface: 'S', cardinality: '1..1', policy: 'static', bind: 'bindS', unbind: 'unbindS' })
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

      const r1 = rankedRef('s1', 10);
      const s1 = { id: 's1' };
      const r2 = rankedRef('s2', 5);
      const s2 = { id: 's2' };
      const registry = new Map<any, any>([
        [r1, s1],
        [r2, s2],
      ]);
      bundleContext.getService = vi.fn().mockImplementation((r: any) => registry.get(r) ?? null);
      bundleContext.getServiceReferences = vi.fn().mockReturnValue([r1, r2]);

      await scr.registerComponent(C, bundleId);
      await scr.activateComponent(bundleId, 'mand.survivor.static');

      bundleContext.getServiceReferences = vi.fn().mockReturnValue([r2]);
      await scr.processServiceEvent('S', 'unregistered', r1);

      expect(events).toEqual(['bind:s1', 'activate', 'unbind:s1', 'deactivate', 'bind:s2', 'activate']);
    });

    it('#4 dynamic: mandatory 1..1 ref rebinds in place onto a survivor', async () => {
      const events: string[] = [];

      @Component({ name: 'mand.survivor.dynamic' })
      class C {
        @Reference({ interface: 'S', cardinality: '1..1', policy: 'dynamic', bind: 'bindS', unbind: 'unbindS' })
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

      const r1 = rankedRef('s1', 10);
      const s1 = { id: 's1' };
      const r2 = rankedRef('s2', 5);
      const s2 = { id: 's2' };
      const registry = new Map<any, any>([
        [r1, s1],
        [r2, s2],
      ]);
      bundleContext.getService = vi.fn().mockImplementation((r: any) => registry.get(r) ?? null);
      bundleContext.getServiceReferences = vi.fn().mockReturnValue([r1, r2]);

      await scr.registerComponent(C, bundleId);
      await scr.activateComponent(bundleId, 'mand.survivor.dynamic');

      bundleContext.getServiceReferences = vi.fn().mockReturnValue([r2]);
      await scr.processServiceEvent('S', 'unregistered', r1);

      // Dynamic 1..1: unbind departed, bind survivor in place, no deactivate.
      expect(events).toEqual(['bind:s1', 'activate', 'unbind:s1', 'bind:s2']);
      expect(scr.getComponent(bundleId, 'mand.survivor.dynamic')?.instance).toBeTruthy();
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

      stubServiceRegistry(bundleContext, [], null);

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

      stubServiceRegistry(bundleContext, [], null);

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

      const ref = makeServiceRef();
      const svc = { id: 's', rev: 1 };
      stubServiceRegistry(bundleContext, [ref], svc);

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

      stubServiceRegistry(bundleContext, [], null);

      await scr.registerComponent(C, bundleId);
      const before = scr.getComponent(bundleId, 'cfg.modified')?.instance;

      await scr.updateComponentConfiguration(bundleId, 'cfg.modified', { v: 2 });

      const after = scr.getComponent(bundleId, 'cfg.modified')?.instance;

      // CU-MOD-01: @Modified invoked, instance unchanged, no deactivate.
      expect(events).toEqual(['activate', 'modified:2']);
      expect(after).toBe(before);
    });

    it('CU-NOM-01: without @Modified, config update forces deactivate + reactivate', async () => {
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

      stubServiceRegistry(bundleContext, [], null);

      await scr.registerComponent(C, bundleId);
      const before = scr.getComponent(bundleId, 'cfg.nomod')?.instance;

      await scr.updateComponentConfiguration(bundleId, 'cfg.nomod', { v: 2 });

      const after = scr.getComponent(bundleId, 'cfg.nomod')?.instance;

      // CU-NOM-01 ("Missing Modified Deactivation"): a full @Deactivate +
      // @Activate cycle producing a NEW instance.
      expect(events).toEqual(['activate', 'deactivate', 'activate']);
      expect(after).not.toBe(before);
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
      const ref = makeServiceRef();
      const svc = { id: 's' };
      stubServiceRegistry(bundleContext, [ref], svc);

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

      const ref = makeServiceRef();
      const svc = { id: 's' };
      stubServiceRegistry(bundleContext, [ref], svc);

      await scr.registerComponent(C, bundleId);
      await scr.activateComponent(bundleId, 'opt.0ton.depart');

      const bindCount = events.filter((e) => e === 'bind').length;

      await scr.processServiceEvent('S', 'unregistered', ref);

      // Component remains ACTIVE; unbind fires, field reset to []. No deactivate.
      expect(events).toContain('unbind');
      expect(events).not.toContain('deactivate');
      expect(events.filter((e) => e === 'unbind')).toHaveLength(1);
      expect(scr.getComponent(bundleId, 'opt.0ton.depart')?.instance).toBeTruthy();
      // Guard: bind ran during activation (documents dynamic double-pass count).
      expect(bindCount).toBeGreaterThanOrEqual(1);
    });
  });
});
