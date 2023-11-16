import { describe, beforeEach, expect, it, vi } from 'vitest';
import { OBJECTCLASS } from '@pandino/pandino-api';
import type { ServiceEvent } from '@pandino/pandino-api';
import { EVENT, SERVICE, SERVICE_ID, SERVICE_OBJECTCLASS, SERVICE_PID } from '@pandino/event-api';
import { evaluateFilter } from '@pandino/filters';
import { ServiceEventAdapter } from './service-event-adapter';
import { EventAdminImpl } from '../event-admin-impl';
import { EventFactoryImpl } from '../event-factory-impl';

describe('ServiceEventAdapter', () => {
  let sea: ServiceEventAdapter;
  let eventAdmin: EventAdminImpl;
  const eventFactoryImpl = new EventFactoryImpl(evaluateFilter);
  const mockContextGetService = vi.fn();
  const mockContextAddServiceListener = vi.fn();
  const mockContextRemoveServiceListener = vi.fn();
  const mockContext: any = {
    getService: mockContextGetService,
    addServiceListener: mockContextAddServiceListener,
    removeServiceListener: mockContextRemoveServiceListener,
  };
  const mockLogger: any = {};
  const mockPostEvent = vi.fn();

  beforeEach(() => {
    mockPostEvent.mockClear();
    mockContextGetService.mockClear();
    mockContextAddServiceListener.mockClear();
    mockContextRemoveServiceListener.mockClear();
    eventAdmin = new EventAdminImpl(mockContext, mockLogger, evaluateFilter);
    sea = new ServiceEventAdapter(mockContext, eventAdmin, eventFactoryImpl);

    (eventAdmin as any).postEvent = mockPostEvent;
  });

  it('destroy removes adapter from Service Event listeners', () => {
    sea.destroy(mockContext);

    expect(mockContext.removeServiceListener).toHaveBeenCalledTimes(1);
    expect(mockContext.removeServiceListener).toHaveBeenCalledWith(sea);
  });

  it.each`
    eventType          | expectedPid         | expectedTopic
    ${'REGISTERED'}    | ${undefined}        | ${'@pandino/event-admin/ServiceEvent/REGISTERED'}
    ${'REGISTERED'}    | ${'@scope/svc/sv1'} | ${'@pandino/event-admin/ServiceEvent/REGISTERED'}
    ${'MODIFIED'}      | ${undefined}        | ${'@pandino/event-admin/ServiceEvent/MODIFIED'}
    ${'UNREGISTERING'} | ${undefined}        | ${'@pandino/event-admin/ServiceEvent/UNREGISTERING'}
  `("serviceChanged() for '$eventType' event", ({ eventType, expectedPid, expectedTopic }) => {
    const mockServiceProps: any = {
      [OBJECTCLASS]: '@scope/mock/service',
      [SERVICE_ID]: 'service.id',
      ...(expectedPid
        ? {
            [SERVICE_PID]: expectedPid,
          }
        : {}),
    };
    const mockServiceReference: any = {
      getProperty: (prop: string) => mockServiceProps[prop],
    };
    const event: ServiceEvent = {
      getType: () => eventType,
      getServiceReference: () => mockServiceReference,
    };
    sea.serviceChanged(event);

    expect(mockPostEvent).toHaveBeenCalledTimes(1);
    expect(mockPostEvent).toHaveBeenCalledWith({
      filterEvaluator: evaluateFilter,
      topic: expectedTopic,
      properties: {
        [EVENT]: event,
        [SERVICE]: event.getServiceReference(),
        [SERVICE_ID]: event.getServiceReference().getProperty(SERVICE_ID),
        [SERVICE_OBJECTCLASS]: event.getServiceReference().getProperty(OBJECTCLASS),
        ...(expectedPid
          ? {
              [SERVICE_PID]: expectedPid,
            }
          : {}),
      },
    });
  });
});
