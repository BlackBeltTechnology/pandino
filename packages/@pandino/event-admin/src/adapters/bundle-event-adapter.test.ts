import { describe, beforeEach, expect, it, vi } from 'vitest';
import type { BundleEvent } from '@pandino/pandino-api';
import { BUNDLE_SYMBOLICNAME, EVENT } from '@pandino/event-api';
import { evaluateFilter } from '@pandino/filters';
import { BundleEventAdapter } from './bundle-event-adapter';
import { EventAdminImpl } from '../event-admin-impl';
import { EventFactoryImpl } from '../event-factory-impl';

describe('BundleEventAdapter', () => {
  let bea: BundleEventAdapter;
  let eventAdmin: EventAdminImpl;
  const eventFactoryImpl = new EventFactoryImpl(evaluateFilter);
  const mockContextGetService = vi.fn();
  const mockContextAddBundleListener = vi.fn();
  const mockContextRemoveBundleListener = vi.fn();
  const mockContext: any = {
    getService: mockContextGetService,
    addBundleListener: mockContextAddBundleListener,
    removeBundleListener: mockContextRemoveBundleListener,
  };
  const mockLogger: any = {};
  const mockPostEvent = vi.fn();
  const bundle1: any = {
    getSymbolicName: () => '@scope/bundle1',
    getBundleId: () => 11,
  };
  const bundle2: any = {
    getSymbolicName: () => '@scope/bundle2',
    getBundleId: () => 22,
  };

  beforeEach(() => {
    mockPostEvent.mockClear();
    mockContextGetService.mockClear();
    mockContextAddBundleListener.mockClear();
    mockContextRemoveBundleListener.mockClear();
    eventAdmin = new EventAdminImpl(mockContext, mockLogger, evaluateFilter);
    bea = new BundleEventAdapter(mockContext, eventAdmin, eventFactoryImpl);

    (eventAdmin as any).postEvent = mockPostEvent;
  });

  it('destroy removes adapter from Bundle listeners', () => {
    bea.destroy(mockContext);

    expect(mockContext.removeBundleListener).toHaveBeenCalledTimes(1);
    expect(mockContext.removeBundleListener).toHaveBeenCalledWith(bea);
  });

  it.each`
    eventType        | expectedTopic
    ${'INSTALLED'}   | ${'@pandino/event-admin/BundleEvent/INSTALLED'}
    ${'STARTED'}     | ${'@pandino/event-admin/BundleEvent/STARTED'}
    ${'STOPPED'}     | ${'@pandino/event-admin/BundleEvent/STOPPED'}
    ${'UPDATED'}     | ${'@pandino/event-admin/BundleEvent/UPDATED'}
    ${'UNINSTALLED'} | ${'@pandino/event-admin/BundleEvent/UNINSTALLED'}
    ${'RESOLVED'}    | ${'@pandino/event-admin/BundleEvent/RESOLVED'}
    ${'UNRESOLVED'}  | ${'@pandino/event-admin/BundleEvent/UNRESOLVED'}
  `("bundleChanged() for '$eventType' event", ({ eventType, expectedTopic }) => {
    const event: BundleEvent = {
      getType: () => eventType,
      getBundle: () => bundle1,
      getOrigin: () => bundle2,
    };
    bea.bundleChanged(event);

    expect(mockPostEvent).toHaveBeenCalledTimes(1);
    expect(mockPostEvent).toHaveBeenCalledWith({
      filterEvaluator: evaluateFilter,
      topic: expectedTopic,
      properties: {
        [EVENT]: event,
        [BUNDLE_SYMBOLICNAME]: '@scope/bundle1',
        'bundle.id': 11,
        bundle: bundle1,
      },
    });
  });
});
