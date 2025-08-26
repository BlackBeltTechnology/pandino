import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EventEmitter } from './event-emitter';

describe('EventEmitter', () => {
  let eventEmitter: EventEmitter;

  beforeEach(() => {
    eventEmitter = new EventEmitter();
  });

  describe('on() method', () => {
    it('should add a listener for an event', () => {
      const listener = vi.fn();

      const result = eventEmitter.on('test', listener);

      expect(result).toBe(eventEmitter); // Should return this for chaining
      eventEmitter.emit('test', 'data');
      expect(listener).toHaveBeenCalledWith('data');
    });

    it('should allow multiple listeners for the same event', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      eventEmitter.on('test', listener1);
      eventEmitter.on('test', listener2);

      eventEmitter.emit('test', 'data');

      expect(listener1).toHaveBeenCalledWith('data');
      expect(listener2).toHaveBeenCalledWith('data');
    });

    it('should allow the same listener to be added multiple times', () => {
      const listener = vi.fn();

      eventEmitter.on('test', listener);
      eventEmitter.on('test', listener);

      eventEmitter.emit('test', 'data');

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith('data');
    });

    it('should support method chaining', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      const result = eventEmitter.on('event1', listener1).on('event2', listener2);

      expect(result).toBe(eventEmitter);

      eventEmitter.emit('event1');
      eventEmitter.emit('event2');

      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });
  });

  describe('emit() method', () => {
    it('should emit event with no arguments', () => {
      const listener = vi.fn();
      eventEmitter.on('test', listener);

      const result = eventEmitter.emit('test');

      expect(result).toBe(true);
      expect(listener).toHaveBeenCalledWith();
    });

    it('should emit event with single argument', () => {
      const listener = vi.fn();
      eventEmitter.on('test', listener);

      eventEmitter.emit('test', 'hello');

      expect(listener).toHaveBeenCalledWith('hello');
    });

    it('should emit event with multiple arguments', () => {
      const listener = vi.fn();
      eventEmitter.on('test', listener);

      eventEmitter.emit('test', 'arg1', 'arg2', 123, { key: 'value' });

      expect(listener).toHaveBeenCalledWith('arg1', 'arg2', 123, { key: 'value' });
    });

    it('should return false when no listeners exist', () => {
      const result = eventEmitter.emit('nonexistent');

      expect(result).toBe(false);
    });

    it('should return true when listeners exist', () => {
      const listener = vi.fn();
      eventEmitter.on('test', listener);

      const result = eventEmitter.emit('test');

      expect(result).toBe(true);
    });

    it('should call all listeners for an event', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      const listener3 = vi.fn();

      eventEmitter.on('test', listener1);
      eventEmitter.on('test', listener2);
      eventEmitter.on('test', listener3);

      eventEmitter.emit('test', 'data');

      expect(listener1).toHaveBeenCalledWith('data');
      expect(listener2).toHaveBeenCalledWith('data');
      expect(listener3).toHaveBeenCalledWith('data');
    });

    it('should handle listener errors gracefully', () => {
      const errorListener = vi.fn(() => {
        throw new Error('Listener error');
      });
      const normalListener = vi.fn();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      eventEmitter.on('test', errorListener);
      eventEmitter.on('test', normalListener);

      const result = eventEmitter.emit('test', 'data');

      expect(result).toBe(true);
      expect(errorListener).toHaveBeenCalledWith('data');
      expect(normalListener).toHaveBeenCalledWith('data');
      expect(consoleSpy).toHaveBeenCalledWith('Error in event listener:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should not affect other events', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      eventEmitter.on('event1', listener1);
      eventEmitter.on('event2', listener2);

      eventEmitter.emit('event1', 'data1');

      expect(listener1).toHaveBeenCalledWith('data1');
      expect(listener2).not.toHaveBeenCalled();
    });
  });

  describe('off() method', () => {
    it('should remove a specific listener', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      eventEmitter.on('test', listener1);
      eventEmitter.on('test', listener2);

      const result = eventEmitter.off('test', listener1);

      expect(result).toBe(eventEmitter); // Should return this for chaining

      eventEmitter.emit('test', 'data');

      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).toHaveBeenCalledWith('data');
    });

    it('should do nothing when removing non-existent listener', () => {
      const listener = vi.fn();

      eventEmitter.off('test', listener);

      expect(() => eventEmitter.emit('test')).not.toThrow();
    });

    it('should do nothing when removing from non-existent event', () => {
      const listener = vi.fn();

      eventEmitter.off('nonexistent', listener);

      expect(() => eventEmitter.emit('test')).not.toThrow();
    });

    it('should clean up empty event listener sets', () => {
      const listener = vi.fn();

      eventEmitter.on('test', listener);
      eventEmitter.off('test', listener);

      const result = eventEmitter.emit('test');
      expect(result).toBe(false);
    });

    it('should support method chaining', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      eventEmitter.on('event1', listener1);
      eventEmitter.on('event2', listener2);

      const result = eventEmitter.off('event1', listener1).off('event2', listener2);

      expect(result).toBe(eventEmitter);
    });

    it('should only remove the specific listener instance', () => {
      const sharedLogic = () => console.log('shared');
      const listener1 = vi.fn(sharedLogic);
      const listener2 = vi.fn(sharedLogic);

      eventEmitter.on('test', listener1);
      eventEmitter.on('test', listener2);

      eventEmitter.off('test', listener1);
      eventEmitter.emit('test');

      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });
  });

  describe('removeAllListeners() method', () => {
    it('should remove all listeners for a specific event', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      const listener3 = vi.fn();

      eventEmitter.on('test', listener1);
      eventEmitter.on('test', listener2);
      eventEmitter.on('other', listener3);

      const result = eventEmitter.removeAllListeners('test');

      expect(result).toBe(eventEmitter); // Should return this for chaining

      eventEmitter.emit('test');
      eventEmitter.emit('other');

      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).not.toHaveBeenCalled();
      expect(listener3).toHaveBeenCalled();
    });

    it('should remove all listeners for all events when no event specified', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      const listener3 = vi.fn();

      eventEmitter.on('event1', listener1);
      eventEmitter.on('event2', listener2);
      eventEmitter.on('event3', listener3);

      eventEmitter.removeAllListeners();

      eventEmitter.emit('event1');
      eventEmitter.emit('event2');
      eventEmitter.emit('event3');

      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).not.toHaveBeenCalled();
      expect(listener3).not.toHaveBeenCalled();
    });

    it('should do nothing when removing from non-existent event', () => {
      eventEmitter.removeAllListeners('nonexistent');

      expect(() => eventEmitter.emit('test')).not.toThrow();
    });

    it('should support method chaining', () => {
      const listener = vi.fn();

      eventEmitter.on('test', listener);

      const result = eventEmitter.removeAllListeners('test').removeAllListeners();

      expect(result).toBe(eventEmitter);
    });
  });

  describe('edge cases and complex scenarios', () => {
    it('should handle listeners that modify the event emitter', () => {
      const listener1 = vi.fn(() => {
        eventEmitter.on('test', vi.fn());
      });
      const listener2 = vi.fn(() => {
        eventEmitter.off('test', listener1);
      });

      eventEmitter.on('test', listener1);
      eventEmitter.on('test', listener2);

      expect(() => eventEmitter.emit('test')).not.toThrow();

      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });

    it('should handle rapid successive emissions', () => {
      const listener = vi.fn();
      eventEmitter.on('test', listener);

      for (let i = 0; i < 1000; i++) {
        eventEmitter.emit('test', i);
      }

      expect(listener).toHaveBeenCalledTimes(1000);
    });

    it('should handle different data types as event names', () => {
      const listener = vi.fn();

      eventEmitter.on('string-event', listener);
      eventEmitter.on('123', listener);
      eventEmitter.on('event-with-dashes', listener);
      eventEmitter.on('event_with_underscores', listener);

      eventEmitter.emit('string-event');
      eventEmitter.emit('123');
      eventEmitter.emit('event-with-dashes');
      eventEmitter.emit('event_with_underscores');

      expect(listener).toHaveBeenCalledTimes(4);
    });

    it('should maintain listener order during emission', () => {
      const callOrder: number[] = [];
      const listener1 = vi.fn(() => callOrder.push(1));
      const listener2 = vi.fn(() => callOrder.push(2));
      const listener3 = vi.fn(() => callOrder.push(3));

      eventEmitter.on('test', listener1);
      eventEmitter.on('test', listener2);
      eventEmitter.on('test', listener3);

      eventEmitter.emit('test');

      expect(callOrder).toEqual([1, 2, 3]);
    });

    it('should handle memory cleanup properly', () => {
      const listener = vi.fn();

      for (let i = 0; i < 100; i++) {
        eventEmitter.on(`event${i}`, listener);
        eventEmitter.off(`event${i}`, listener);
      }

      for (let i = 0; i < 100; i++) {
        const result = eventEmitter.emit(`event${i}`);
        expect(result).toBe(false);
      }
    });

    it('should handle complex argument types', () => {
      const listener = vi.fn();
      eventEmitter.on('test', listener);

      const complexArgs = [
        null,
        undefined,
        true,
        false,
        0,
        -1,
        Infinity,
        NaN,
        '',
        'string',
        [],
        [1, 2, 3],
        {},
        { key: 'value' },
        new Date(),
        /regex/,
        () => {},
        Symbol('test'),
      ];

      eventEmitter.emit('test', ...complexArgs);

      expect(listener).toHaveBeenCalledWith(...complexArgs);
    });
  });

  describe('TypeScript compatibility', () => {
    it('should work with typed listeners', () => {
      const listener: (data: string) => void = vi.fn();

      eventEmitter.on('test', listener);
      eventEmitter.emit('test', 'typed data');

      expect(listener).toHaveBeenCalledWith('typed data');
    });

    it('should work with generic event handlers', () => {
      interface CustomEvent {
        type: string;
        data: any;
      }

      const listener: (event: CustomEvent) => void = vi.fn();

      eventEmitter.on('custom', listener);
      eventEmitter.emit('custom', { type: 'test', data: 'value' });

      expect(listener).toHaveBeenCalledWith({ type: 'test', data: 'value' });
    });
  });
});
