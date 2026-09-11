import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OSGiFramework } from '../../framework/framework';
import { EventAdminImpl } from './event-admin';
import { Event, type EventHandler } from './interfaces';
import { createBundleModule } from '../../test/bundle-module';

describe('Event immutability', () => {
  it('should not reflect external mutation of the source properties object', () => {
    const props: Record<string, any> = { a: 1 };
    const event = new Event('some/topic', props);

    props.a = 999;
    props.b = 2;

    expect(event.getProperty('a')).toBe(1);
    expect(event.containsProperty('b')).toBe(false);
    expect(event.getPropertyNames()).toEqual(['a']);
  });
});

describe('EventAdmin', () => {
  let framework: OSGiFramework;
  let eventAdmin: EventAdminImpl;

  beforeEach(async () => {
    framework = new OSGiFramework();
    await framework.start();
    eventAdmin = new EventAdminImpl(framework);
  });

  describe('event delivery', () => {
    it('should deliver event to matching handler', async () => {
      const handler: EventHandler = {
        handleEvent: vi.fn(),
      };

      const context = framework.getBundleContext();
      context.registerService('EventHandler', handler, {
        'event.topics': 'test/topic',
      });

      const event = new Event('test/topic', { data: 'value' });
      eventAdmin.sendEvent(event);

      expect(handler.handleEvent).toHaveBeenCalledWith(event);
    });

    it('should not deliver event to non-matching topic handler', async () => {
      const handler: EventHandler = {
        handleEvent: vi.fn(),
      };

      const context = framework.getBundleContext();
      context.registerService('EventHandler', handler, {
        'event.topics': 'different/topic',
      });

      const event = new Event('test/topic', { data: 'value' });
      eventAdmin.sendEvent(event);

      expect(handler.handleEvent).not.toHaveBeenCalled();
    });

    it('should deliver to wildcard topic handlers', async () => {
      const handler: EventHandler = {
        handleEvent: vi.fn(),
      };

      const context = framework.getBundleContext();
      context.registerService('EventHandler', handler, {
        'event.topics': 'test/*',
      });

      const event = new Event('test/subtopic', { data: 'value' });
      eventAdmin.sendEvent(event);

      expect(handler.handleEvent).toHaveBeenCalledWith(event);
    });

    it('should filter events by event filter', async () => {
      const handler: EventHandler = {
        handleEvent: vi.fn(),
      };

      const context = framework.getBundleContext();
      context.registerService('EventHandler', handler, {
        'event.topics': 'test/topic',
        'event.filter': '(type=important)',
      });

      const event1 = new Event('test/topic', { type: 'important' });
      const event2 = new Event('test/topic', { type: 'normal' });

      eventAdmin.sendEvent(event1);
      eventAdmin.sendEvent(event2);

      expect(handler.handleEvent).toHaveBeenCalledTimes(1);
      expect(handler.handleEvent).toHaveBeenCalledWith(event1);
    });

    it('should handle postEvent asynchronously', async () => {
      const handler: EventHandler = {
        handleEvent: vi.fn(),
      };

      const context = framework.getBundleContext();
      context.registerService('EventHandler', handler, {
        'event.topics': 'test/topic',
      });

      const event = new Event('test/topic', { data: 'value' });
      eventAdmin.postEvent(event);

      expect(handler.handleEvent).not.toHaveBeenCalled();

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(handler.handleEvent).toHaveBeenCalledWith(event);
    });
  });

  describe('framework event integration', () => {
    it('should republish service events', async () => {
      const handler: EventHandler = {
        handleEvent: vi.fn(),
      };

      const context = framework.getBundleContext();
      context.registerService('EventHandler', handler, {
        'event.topics': 'pandino/framework/ServiceEvent/*',
      });

      context.registerService('TestService', {});

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(handler.handleEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          topic: expect.stringContaining('ServiceEvent/REGISTERED'),
        }),
      );
    });

    it('should republish bundle events', async () => {
      const handler: EventHandler = {
        handleEvent: vi.fn(),
      };

      const context = framework.getBundleContext();
      context.registerService('EventHandler', handler, {
        'event.topics': 'pandino/framework/BundleEvent/*',
      });

      await framework.installBundle(createBundleModule());

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(handler.handleEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          topic: expect.stringContaining('BundleEvent/'),
        }),
      );
    });
  });
});

describe('Event', () => {
  describe('constructor', () => {
    it('should create event with topic only', () => {
      const event = new Event('test/topic');

      expect(event.getTopic()).toBe('test/topic');
      expect(event.getPropertyNames()).toHaveLength(0);
    });

    it('should create event with topic and properties', () => {
      const props = { key1: 'value1', key2: 42 };
      const event = new Event('test/topic', props);

      expect(event.getTopic()).toBe('test/topic');
      expect(event.getProperty('key1')).toBe('value1');
      expect(event.getProperty('key2')).toBe(42);
    });
  });

  describe('property access', () => {
    it('should get property by name', () => {
      const event = new Event('test/topic', { key: 'value' });

      expect(event.getProperty('key')).toBe('value');
      expect(event.getProperty('nonexistent')).toBeUndefined();
    });

    it('should check property existence', () => {
      const event = new Event('test/topic', { key: 'value' });

      expect(event.containsProperty('key')).toBe(true);
      expect(event.containsProperty('nonexistent')).toBe(false);
    });

    it('should get all property names', () => {
      const event = new Event('test/topic', { key1: 'value1', key2: 'value2' });

      const names = event.getPropertyNames();
      expect(names).toContain('key1');
      expect(names).toContain('key2');
      expect(names).toHaveLength(2);
    });
  });
});
