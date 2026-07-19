import { beforeEach, describe, expect, it } from 'vitest';
import type { BundleContext, ServiceListener } from '../interfaces';
import { SERVICE_EVENT_TYPES } from '../../types/constants';
import { OSGiFramework } from '../framework';

// Tests for service registry ordering / reference contracts, modeled on the
// OSGi Core spec (Service Layer, chapter 5). Where the Pandino implementation
// diverges from the spec, the test asserts ACTUAL behavior and marks it with a
// `// DIVERGENCE:` note rather than changing source.

describe('service registry ordering & reference contracts', () => {
  let framework: OSGiFramework;
  let context: BundleContext;

  beforeEach(async () => {
    framework = new OSGiFramework();
    await framework.start();
    context = framework.getBundle(0)!.getContext();
  });

  describe('ranking-based ordering', () => {
    it('breaks a ranking tie by service.id (lower id wins) for getServiceReference', () => {
      const first = { name: 'first' };
      const second = { name: 'second' };

      // Equal ranking (both default to 0). OSGi: lower service.id wins the tie.
      const regA = context.registerService('TieService', first);
      const regB = context.registerService('TieService', second);

      const idA = regA.getReference().getProperty('service.id');
      const idB = regB.getReference().getProperty('service.id');
      expect(idA).toBeLessThan(idB);

      const ref = context.getServiceReference('TieService');
      expect(context.getService(ref!)).toBe(first);
      expect(ref!.getProperty('service.id')).toBe(idA);
    });

    it('orders getServiceReferences by service.id ascending when rankings tie', () => {
      const first = { name: 'first' };
      const second = { name: 'second' };
      const third = { name: 'third' };

      context.registerService('TieService', first);
      context.registerService('TieService', second);
      context.registerService('TieService', third);

      const refs = context.getServiceReferences('TieService')!;
      expect(refs).toHaveLength(3);

      const ids = refs.map((r) => r.getProperty('service.id') as number);
      // Ascending order preserved via stable sort + insertion-ordered registry.
      expect(ids).toEqual([...ids].sort((a, b) => a - b));
      expect(context.getService(refs[0])).toBe(first);
    });

    it('defaults service.ranking to 0 when not supplied', () => {
      context.registerService('RankDefault', {});

      const ref = context.getServiceReference('RankDefault');
      expect(ref!.getProperty('service.ranking')).toBe(0);
    });

    it('orders negative, zero, and positive rankings correctly (highest first)', () => {
      const low = { r: -5 };
      const high = { r: 10 };
      const mid = { r: 0 };

      // Register out of rank order to prove sorting is by ranking, not insertion.
      context.registerService('RankService', low, { 'service.ranking': -5 });
      context.registerService('RankService', high, { 'service.ranking': 10 });
      context.registerService('RankService', mid, { 'service.ranking': 0 });

      const refs = context.getServiceReferences('RankService')!;
      const services = refs.map((r) => context.getService(r));
      expect(services).toEqual([high, mid, low]);

      expect(context.getService(context.getServiceReference('RankService')!)).toBe(high);
    });

    it('re-sorts after setProperties changes service.ranking', () => {
      const svcA = { name: 'A' };
      const svcB = { name: 'B' };

      const regA = context.registerService('ReSortService', svcA, { 'service.ranking': 100 });
      context.registerService('ReSortService', svcB, { 'service.ranking': 50 });

      // Initially A (100) outranks B (50).
      expect(context.getService(context.getServiceReference('ReSortService')!)).toBe(svcA);

      // Lower A below B. objectClass/service.id are read-only and preserved
      // across setProperties, so the service stays discoverable without
      // re-supplying objectClass.
      regA.setProperties({ 'service.ranking': 10 });

      expect(context.getService(context.getServiceReference('ReSortService')!)).toBe(svcB);

      const refs = context.getServiceReferences('ReSortService')!;
      expect(refs.map((r) => context.getService(r))).toEqual([svcB, svcA]);
    });
  });

  describe('objectClass shape', () => {
    it('stores objectClass as a string for a single interface', () => {
      const reg = context.registerService('SingleIface', {});
      const objectClass = reg.getReference().getProperty('objectClass');

      expect(typeof objectClass).toBe('string');
      expect(objectClass).toBe('SingleIface');
    });

    it('stores objectClass as an array for multiple interfaces', () => {
      const svc = { multi: true };
      const reg = context.registerService(['IfaceOne', 'IfaceTwo'], svc);

      const objectClass = reg.getReference().getProperty('objectClass');
      expect(Array.isArray(objectClass)).toBe(true);
      expect(objectClass).toEqual(['IfaceOne', 'IfaceTwo']);

      // Discoverable under either interface name.
      expect(context.getService(context.getServiceReference('IfaceOne')!)).toBe(svc);
      expect(context.getService(context.getServiceReference('IfaceTwo')!)).toBe(svc);
    });
  });

  describe('service.id identity', () => {
    it('assigns a unique service.id per registration', () => {
      const reg1 = context.registerService('IdService', {});
      const reg2 = context.registerService('IdService', {});

      const id1 = reg1.getReference().getProperty('service.id');
      const id2 = reg2.getReference().getProperty('service.id');

      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('number');
    });

    it('keeps service.id immutable across setProperties', () => {
      const reg = context.registerService('IdService', {}, { 'service.ranking': 1 });
      const originalId = reg.getReference().getProperty('service.id');

      reg.setProperties({ objectClass: 'IdService', 'service.ranking': 999, custom: 'value' });

      expect(reg.getReference().getProperty('service.id')).toBe(originalId);
      expect(reg.getReference().getProperty('service.ranking')).toBe(999);
    });
  });

  describe('no-match lookup contract', () => {
    it('returns null from getServiceReference when nothing matches', () => {
      expect(context.getServiceReference('DoesNotExist')).toBeNull();
    });

    it('returns null (not an empty array) from getServiceReferences when nothing matches', () => {
      // OSGi BundleContext.getServiceReferences returns null when no services
      // match; Pandino's context wrapper matches this contract.
      expect(context.getServiceReferences('DoesNotExist')).toBeNull();
    });

    it('returns a populated array from getServiceReferences when matches exist', () => {
      context.registerService('ExistsService', {});
      const refs = context.getServiceReferences('ExistsService');
      expect(refs).not.toBeNull();
      expect(refs).toHaveLength(1);
    });
  });

  describe('stale reference behavior', () => {
    it('returns null from getService for a reference to an unregistered service', () => {
      const reg = context.registerService('StaleService', { v: 1 });
      const ref = reg.getReference();

      expect(context.getService(ref)).toEqual({ v: 1 });

      reg.unregister();

      expect(context.getService(ref)).toBeNull();
    });

    it('fires UNREGISTERING before the service is removed from the registry', () => {
      const service = { v: 'live' };
      const reg = context.registerService('UnregService', service);
      const ref = reg.getReference();

      let serviceDuringEvent: unknown = '__not-called__';
      const listener: ServiceListener = {
        serviceChanged: (event) => {
          if (event.getType() === SERVICE_EVENT_TYPES.UNREGISTERING) {
            // Still retrievable at the moment the event fires.
            serviceDuringEvent = context.getService(ref);
          }
        },
      };
      context.addServiceListener(listener, '(objectClass=UnregService)');

      reg.unregister();

      expect(serviceDuringEvent).toBe(service);
      expect(context.getService(ref)).toBeNull();
    });
  });

  describe('getProperties() copy semantics', () => {
    it('returns a defensive copy that does not leak caller mutations', () => {
      const reg = context.registerService('CopyService', {}, { custom: 'original' });
      const ref = reg.getReference();

      const props = ref.getProperties();
      props.custom = 'mutated';
      props.injected = 'nope';

      const fresh = ref.getProperties();
      expect(fresh.custom).toBe('original');
      expect(fresh.injected).toBeUndefined();
      expect(ref.getProperty('custom')).toBe('original');
    });
  });
});
