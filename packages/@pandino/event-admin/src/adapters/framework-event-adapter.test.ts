import { describe, beforeEach, expect, it, vi } from 'vitest';
import type { FrameworkEvent } from '@pandino/pandino-api';
import { BUNDLE_SYMBOLICNAME, EVENT } from '@pandino/event-api';
import { evaluateFilter } from '@pandino/filters';
import { EventAdminImpl } from '../event-admin-impl';
import { EventFactoryImpl } from '../event-factory-impl';
import { FrameworkEventAdapter } from './framework-event-adapter';

describe('FrameworkEventAdapter', () => {
  let fea: FrameworkEventAdapter;
  let eventAdmin: EventAdminImpl;
  const eventFactoryImpl = new EventFactoryImpl(evaluateFilter);
  const mockContextGetService = vi.fn();
  const mockContextAddFrameworkListener = vi.fn();
  const mockContextRemoveFrameworkListener = vi.fn();
  const mockContext: any = {
    getService: mockContextGetService,
    addFrameworkListener: mockContextAddFrameworkListener,
    removeFrameworkListener: mockContextRemoveFrameworkListener,
  };
  const mockLogger: any = {};
  const mockPostEvent = vi.fn();
  const bundle1: any = {
    getSymbolicName: () => '@scope/bundle1',
    getBundleId: () => 11,
  };

  beforeEach(() => {
    mockPostEvent.mockClear();
    mockContextGetService.mockClear();
    mockContextAddFrameworkListener.mockClear();
    mockContextRemoveFrameworkListener.mockClear();
    eventAdmin = new EventAdminImpl(mockContext, mockLogger, evaluateFilter);
    fea = new FrameworkEventAdapter(mockContext, eventAdmin, eventFactoryImpl);

    (eventAdmin as any).postEvent = mockPostEvent;
  });

  it('destroy removes adapter from Framework listeners', () => {
    fea.destroy(mockContext);

    expect(mockContext.removeFrameworkListener).toHaveBeenCalledTimes(1);
    expect(mockContext.removeFrameworkListener).toHaveBeenCalledWith(fea);
  });

  it.each`
    eventType    | expectedTopic
    ${'STARTED'} | ${'@pandino/event-admin/FrameworkEvent/STARTED'}
    ${'ERROR'}   | ${'@pandino/event-admin/FrameworkEvent/ERROR'}
  `("frameworkEvent() for '$eventType' event", ({ eventType, expectedTopic }) => {
    const event: FrameworkEvent = {
      getType: () => eventType,
      getBundle: () => bundle1,
      getError: () => new Error(),
    };
    fea.frameworkEvent(event);

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
