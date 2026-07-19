import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OSGiFramework } from '../../../framework/framework';
import { EventAdminImpl } from '../event-admin';
import { Event, type EventHandler } from '../interfaces';

describe('EventAdmin delivery (group 8)', () => {
  let framework: OSGiFramework;
  let eventAdmin: EventAdminImpl;

  beforeEach(async () => {
    framework = new OSGiFramework();
    await framework.start();
    eventAdmin = new EventAdminImpl(framework);
  });

  describe('sendEvent (sync) vs postEvent (async)', () => {
    it('should invoke handler synchronously with sendEvent', () => {
      const handler: EventHandler = { handleEvent: vi.fn() };
      framework.getBundleContext().registerService('EventHandler', handler, {
        'event.topics': 'test/sync',
      });

      const event = new Event('test/sync');
      eventAdmin.sendEvent(event);

      // Already called before returning control — no tick awaited.
      expect(handler.handleEvent).toHaveBeenCalledWith(event);
    });

    it('should defer handler invocation until a tick with postEvent', async () => {
      const handler: EventHandler = { handleEvent: vi.fn() };
      framework.getBundleContext().registerService('EventHandler', handler, {
        'event.topics': 'test/async',
      });

      const event = new Event('test/async');
      eventAdmin.postEvent(event);

      // Not yet called: postEvent schedules delivery via setTimeout(0).
      expect(handler.handleEvent).not.toHaveBeenCalled();

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(handler.handleEvent).toHaveBeenCalledWith(event);
    });
  });

  describe('EVENT_FILTER (event.filter LDAP property)', () => {
    // The impl reads the handler property key 'event.filter' and matches it
    // against event properties via the registered LdapFilterService.
    it('should only deliver events whose properties match the event.filter', () => {
      const handler: EventHandler = { handleEvent: vi.fn() };
      framework.getBundleContext().registerService('EventHandler', handler, {
        'event.topics': 'filter/topic',
        'event.filter': '(level=high)',
      });

      const matching = new Event('filter/topic', { level: 'high' });
      const nonMatching = new Event('filter/topic', { level: 'low' });

      eventAdmin.sendEvent(matching);
      eventAdmin.sendEvent(nonMatching);

      expect(handler.handleEvent).toHaveBeenCalledTimes(1);
      expect(handler.handleEvent).toHaveBeenCalledWith(matching);
    });

    it('should deliver all matching-topic events when no event.filter is set', () => {
      const handler: EventHandler = { handleEvent: vi.fn() };
      framework.getBundleContext().registerService('EventHandler', handler, {
        'event.topics': 'filter/topic',
      });

      eventAdmin.sendEvent(new Event('filter/topic', { level: 'high' }));
      eventAdmin.sendEvent(new Event('filter/topic', { level: 'low' }));

      expect(handler.handleEvent).toHaveBeenCalledTimes(2);
    });
  });

  describe('handler exception isolation', () => {
    it('should still deliver to other handlers when one handler throws', () => {
      const throwing: EventHandler = {
        handleEvent: vi.fn(() => {
          throw new Error('boom');
        }),
      };
      const healthy1: EventHandler = { handleEvent: vi.fn() };
      const healthy2: EventHandler = { handleEvent: vi.fn() };

      const context = framework.getBundleContext();
      context.registerService('EventHandler', throwing, { 'event.topics': 'isolate/topic' });
      context.registerService('EventHandler', healthy1, { 'event.topics': 'isolate/topic' });
      context.registerService('EventHandler', healthy2, { 'event.topics': 'isolate/topic' });

      const event = new Event('isolate/topic');

      // Must not propagate the handler's exception to the caller.
      expect(() => eventAdmin.sendEvent(event)).not.toThrow();

      expect(throwing.handleEvent).toHaveBeenCalledWith(event);
      expect(healthy1.handleEvent).toHaveBeenCalledWith(event);
      expect(healthy2.handleEvent).toHaveBeenCalledWith(event);
    });
  });

  describe('EVENT_TOPIC as array', () => {
    it('should deliver events for each topic when subscribed via an array', () => {
      const handler: EventHandler = { handleEvent: vi.fn() };
      framework.getBundleContext().registerService('EventHandler', handler, {
        'event.topics': ['multi/one', 'multi/two'],
      });

      const eventOne = new Event('multi/one');
      const eventTwo = new Event('multi/two');
      const eventOther = new Event('multi/three');

      eventAdmin.sendEvent(eventOne);
      eventAdmin.sendEvent(eventTwo);
      eventAdmin.sendEvent(eventOther);

      expect(handler.handleEvent).toHaveBeenCalledTimes(2);
      expect(handler.handleEvent).toHaveBeenCalledWith(eventOne);
      expect(handler.handleEvent).toHaveBeenCalledWith(eventTwo);
      expect(handler.handleEvent).not.toHaveBeenCalledWith(eventOther);
    });

    it('should match multiple sub-levels for a trailing /* wildcard (a/b/* matches a/b/c and a/b/c/d)', () => {
      const handler: EventHandler = { handleEvent: vi.fn() };
      framework.getBundleContext().registerService('EventHandler', handler, {
        'event.topics': 'a/b/*',
      });

      const child = new Event('a/b/c');
      const grandchild = new Event('a/b/c/d');

      eventAdmin.sendEvent(child);
      eventAdmin.sendEvent(grandchild);

      expect(handler.handleEvent).toHaveBeenCalledTimes(2);
      expect(handler.handleEvent).toHaveBeenCalledWith(child);
      expect(handler.handleEvent).toHaveBeenCalledWith(grandchild);
    });
  });
});
