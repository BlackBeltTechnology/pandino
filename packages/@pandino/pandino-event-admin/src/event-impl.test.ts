import { EventImpl } from './event-impl';

describe('EventImpl', () => {
  it('throws for missing topic', () => {
    expect(() => {
      new EventImpl(undefined, {});
    }).toThrow();
  });

  it('topic name cannot start or end with slash (/)', () => {
    expect(() => {
      new EventImpl('/test', {});
    }).toThrow();
    expect(() => {
      new EventImpl('test/', {});
    }).toThrow();
    expect(() => {
      new EventImpl('@test/topic_with-special-chars2', {});
    }).not.toThrow();
  });

  it('API', () => {
    const event = new EventImpl('test-topic', {
      prop1: true,
      prop2: 'yayy!',
    });

    expect(event.getTopic()).toEqual('test-topic');
    expect(event.containsProperty('prop1')).toEqual(true);
    expect(event.containsProperty('prop2')).toEqual(true);
    expect(event.containsProperty('prop3')).toEqual(false);
    expect(event.getProperty('prop1')).toEqual(true);
    expect(event.getProperty('prop2')).toEqual('yayy!');
  });

  it('equals()', () => {
    const event = new EventImpl('test-topic', {
      prop1: 'test',
    });
    const eventWithSameTopic = new EventImpl('test-topic', {
      prop1: 'something else',
    });

    expect(event.equals(null)).toEqual(false);
    expect(event.equals(undefined)).toEqual(false);
    expect(event.equals('test-topic')).toEqual(false);
    expect(event.equals({ prop: 'some-obj' })).toEqual(false);
    expect(event.equals(event)).toEqual(true);
    expect(event.equals(eventWithSameTopic)).toEqual(true);
  });
});
