import { PersistenceManager } from '@pandino/persistence-manager-api';
import { InMemoryPersistenceManager } from './service';

describe('InMemoryPersistenceManager', () => {
  let service: PersistenceManager;

  beforeEach(() => {
    service = new InMemoryPersistenceManager();
  });

  it('store()', () => {
    expect(service.getProperties().length).toEqual(0);

    service.store('pid.pong', {
      a: 'a',
      b: 1,
    });

    expect(service.getProperties().length).toEqual(1);

    service.store('pid.pang', {});

    expect(service.getProperties().length).toEqual(2);

    service.store('pid.pang', {});

    expect(service.getProperties().length).toEqual(2);
  });

  it('exists()', () => {
    service.store('pid.pong', {
      a: 'a',
      b: 1,
    });

    expect(service.exists('pid.pong')).toEqual(true);
    expect(service.exists('pid.pang')).toEqual(false);
  });

  it('load()', () => {
    service.store('pid.pong', {
      a: 'a',
      b: 1,
    });

    expect(service.load('pid.pong')).toEqual({
      a: 'a',
      b: 1,
    });
    expect(service.load('fake.pid')).toEqual(undefined);
  });

  it('getProperties()', () => {
    service.store('pid.pong', {
      a: 'a',
      b: 1,
    });
    service.store('pid.pang', {
      yes: true,
    });
    expect(service.getProperties()).toEqual([
      {
        a: 'a',
        b: 1,
      },
      {
        yes: true,
      },
    ]);
  });

  it('delete()', () => {
    service.store('pid.pong', {
      a: 'a',
      b: 1,
    });

    expect(service.getProperties().length).toEqual(1);

    service.delete('pid.pong');

    expect(service.getProperties().length).toEqual(0);

    service.delete('fake.pid');

    expect(service.getProperties().length).toEqual(0);
  });
});
