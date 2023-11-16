import { describe, beforeEach, expect, it, vi } from 'vitest';
import type { PersistenceManager } from '@pandino/persistence-manager-api';
import type { Logger } from '@pandino/pandino-api';
import { LocalstoragePersistenceManager } from './service';

describe('InMemoryPersistenceManager', () => {
  const managedKeysKey = 'pandino.pm.managed-keys';
  let mockStorageValues: any = {};
  let service: PersistenceManager;
  let mockStorage: Storage;
  let mockLogger: Logger;
  let mockLength: number;
  const getItemMock = vi.fn().mockImplementation((key: string) => {
    return mockStorageValues[key];
  });
  const removeItemMock = vi.fn().mockImplementation((key: string) => delete mockStorageValues[key]);
  const setItemMock = vi.fn().mockImplementation((key: string, value: any) => (mockStorageValues[key] = value));

  beforeEach(() => {
    getItemMock.mockClear();
    removeItemMock.mockClear();
    setItemMock.mockClear();
    mockStorageValues = {};
    mockStorage = {
      key: vi.fn(),
      clear: vi.fn(),
      length: mockLength,
      getItem: getItemMock,
      removeItem: removeItemMock,
      setItem: setItemMock,
    };
    mockLogger = {
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
      info: vi.fn(),
      log: vi.fn(),
      setLogLevel: vi.fn(),
      trace: vi.fn(),
    };
    service = new LocalstoragePersistenceManager(mockStorage, managedKeysKey, mockLogger);
  });

  it('store() add new key to Managed Keys and stores value', () => {
    expect((service as LocalstoragePersistenceManager).getManagedKeys()).toEqual([]);
    expect(service.getProperties().length).toEqual(0);

    service.store('pid.pong', {
      a: 'a',
      b: 1,
    });

    expect((service as LocalstoragePersistenceManager).getManagedKeys()).toEqual(['pid.pong']);
    expect(service.getProperties().length).toEqual(1);
  });

  it('store() updates already managed PID value', () => {
    service.store('pid.pong', {
      a: 'a',
      b: 1,
    });

    expect((service as LocalstoragePersistenceManager).getManagedKeys()).toEqual(['pid.pong']);
    expect(service.getProperties().length).toEqual(1);

    service.store('pid.pong', {
      a: 'another value',
      b: 222,
    });

    expect((service as LocalstoragePersistenceManager).getManagedKeys()).toEqual(['pid.pong']);
    expect(service.getProperties().length).toEqual(1);
    expect(service.load('pid.pong')).toEqual({
      a: 'another value',
      b: 222,
    });
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

  it('load() does not load a Configuration for a PID if it is not managed', () => {
    mockStorageValues = {
      [managedKeysKey]: '[]',
      'pid.pong': {
        a: 'a',
        b: 1,
      },
    };

    expect(service.load('pid.pong')).toEqual(undefined);
    expect((service as LocalstoragePersistenceManager).getManagedKeys()).toEqual([]);
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
    expect((service as LocalstoragePersistenceManager).getManagedKeys()).toEqual(['pid.pong', 'pid.pang']);
  });

  it('delete()', () => {
    service.store('pid.pong', {
      a: 'a',
      b: 1,
    });

    expect(service.getProperties().length).toEqual(1);
    expect((service as LocalstoragePersistenceManager).getManagedKeys()).toEqual(['pid.pong']);

    service.delete('pid.pong');

    expect(service.getProperties().length).toEqual(0);
    expect((service as LocalstoragePersistenceManager).getManagedKeys()).toEqual([]);

    service.delete('fake.pid');

    expect(service.getProperties().length).toEqual(0);
    expect((service as LocalstoragePersistenceManager).getManagedKeys()).toEqual([]);
  });
});
