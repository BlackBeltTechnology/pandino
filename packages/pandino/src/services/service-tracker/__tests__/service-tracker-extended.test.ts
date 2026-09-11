import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SERVICE_EVENT_TYPES } from '../../../types/constants';
import { ServiceTracker } from '../index';
import { type MockService, createTrackerContext, makeServiceEvent, makeServiceRef } from './support/tracker-mocks';

/**
 * Coverage for the OSGi util.tracker methods added to complete the port:
 * getServiceReference (singular), getTrackingCount, getTracked, isEmpty,
 * remove, and waitForService.
 */
describe('ServiceTracker extended API', () => {
  let ctx: any;
  let services: Map<any, MockService>;

  beforeEach(() => {
    services = new Map();
    ctx = createTrackerContext(services);
  });

  it('should report tracking count -1 before open and 0 after opening empty', () => {
    const tracker = new ServiceTracker<MockService>(ctx, 'MockService');
    expect(tracker.getTrackingCount()).toBe(-1);
    tracker.open();
    expect(tracker.getTrackingCount()).toBe(0);
    expect(tracker.isEmpty()).toBe(true);
  });

  it('should increment tracking count on add and remove', () => {
    const ref = makeServiceRef(1);
    services.set(ref, { getValue: () => 'a' });
    const tracker = new ServiceTracker<MockService>(ctx, 'MockService');
    tracker.open();

    tracker.serviceChanged(makeServiceEvent(SERVICE_EVENT_TYPES.REGISTERED, ref) as any);
    expect(tracker.getTrackingCount()).toBe(1);
    expect(tracker.isEmpty()).toBe(false);

    tracker.serviceChanged(makeServiceEvent(SERVICE_EVENT_TYPES.UNREGISTERING, ref) as any);
    expect(tracker.getTrackingCount()).toBe(2);
    expect(ctx.ungetService).toHaveBeenCalledWith(ref);
  });

  it('should return the highest-ranked reference from getServiceReference', () => {
    const low = makeServiceRef(1, 10);
    const high = makeServiceRef(2, 20);
    services.set(low, { getValue: () => 'low' });
    services.set(high, { getValue: () => 'high' });
    ctx.getServiceReferences = vi.fn(() => [low, high]);

    const tracker = new ServiceTracker<MockService>(ctx, 'MockService');
    tracker.open();

    expect(tracker.getServiceReference()).toBe(high);
  });

  it('should return null from getServiceReference when nothing is tracked', () => {
    const tracker = new ServiceTracker<MockService>(ctx, 'MockService');
    tracker.open();
    expect(tracker.getServiceReference()).toBeNull();
  });

  it('should expose a snapshot map via getTracked', () => {
    const ref = makeServiceRef(1);
    const svc = { getValue: () => 'a' };
    services.set(ref, svc);
    ctx.getServiceReferences = vi.fn(() => [ref]);

    const tracker = new ServiceTracker<MockService>(ctx, 'MockService');
    tracker.open();

    const tracked = tracker.getTracked();
    expect(tracked.size).toBe(1);
    expect(tracked.get(ref)).toBe(svc);
  });

  it('should manually untrack a reference via remove()', () => {
    const ref = makeServiceRef(1);
    services.set(ref, { getValue: () => 'a' });
    ctx.getServiceReferences = vi.fn(() => [ref]);

    const tracker = new ServiceTracker<MockService>(ctx, 'MockService');
    tracker.open();
    expect(tracker.size()).toBe(1);

    tracker.remove(ref as any);
    expect(tracker.size()).toBe(0);
    expect(ctx.ungetService).toHaveBeenCalledWith(ref);
  });

  it('should resolve waitForService immediately when a service is present', async () => {
    const ref = makeServiceRef(1);
    const svc = { getValue: () => 'a' };
    services.set(ref, svc);
    ctx.getServiceReferences = vi.fn(() => [ref]);

    const tracker = new ServiceTracker<MockService>(ctx, 'MockService');
    tracker.open();

    await expect(tracker.waitForService(0)).resolves.toBe(svc);
  });

  it('should resolve waitForService when a service arrives later', async () => {
    const ref = makeServiceRef(1);
    const svc = { getValue: () => 'a' };
    const tracker = new ServiceTracker<MockService>(ctx, 'MockService');
    tracker.open();

    const pending = tracker.waitForService(0);
    services.set(ref, svc);
    tracker.serviceChanged(makeServiceEvent(SERVICE_EVENT_TYPES.REGISTERED, ref) as any);

    await expect(pending).resolves.toBe(svc);
  });

  it('should resolve waitForService with null after timeout when none arrives', async () => {
    const tracker = new ServiceTracker<MockService>(ctx, 'MockService');
    tracker.open();
    await expect(tracker.waitForService(15)).resolves.toBeNull();
  });

  it('should throw for a negative waitForService timeout', () => {
    const tracker = new ServiceTracker<MockService>(ctx, 'MockService');
    tracker.open();
    expect(() => tracker.waitForService(-1)).toThrow(/negative/);
  });

  it('should still unget the reference when a customizer addingService throws', () => {
    const ref = makeServiceRef(1);
    services.set(ref, { getValue: () => 'a' });
    ctx.getServiceReferences = vi.fn(() => [ref]);
    const customizer = {
      addingService: vi.fn(() => {
        throw new Error('boom');
      }),
      modifiedService: vi.fn(),
      removedService: vi.fn(),
    };

    const tracker = new ServiceTracker<MockService, MockService>(ctx, 'MockService', customizer);

    expect(() => tracker.open()).toThrow('boom');
    expect(ctx.ungetService).toHaveBeenCalledWith(ref);
  });

  it('should still unget the reference when a customizer removedService throws', () => {
    const ref = makeServiceRef(1);
    const svc = { getValue: () => 'a' };
    services.set(ref, svc);
    ctx.getServiceReferences = vi.fn(() => [ref]);
    const customizer = {
      addingService: vi.fn((_r: any, s: MockService) => s),
      modifiedService: vi.fn(),
      removedService: vi.fn(() => {
        throw new Error('boom');
      }),
    };

    const tracker = new ServiceTracker<MockService, MockService>(ctx, 'MockService', customizer);
    tracker.open();

    expect(() => tracker.remove(ref as any)).toThrow('boom');
    expect(ctx.ungetService).toHaveBeenCalledWith(ref);
  });
});
