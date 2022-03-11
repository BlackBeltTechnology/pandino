import { EVENT_FILTER, EVENT_TOPIC } from '@pandino/pandino-event-api';
import { EventAdminImpl } from './event-admin-impl';
import { EventFactoryImpl } from './event-factory-impl';
import { EventHandlerRegistrationInfo } from './event-handler-registration-info';
import { ServiceEvent } from '@pandino/pandino-api';

describe('EventAdminImpl', () => {
  const DELAY_MS = 50;
  const nonMatchingFilter = {
    match: () => false,
  };
  const matchingFilter = {
    match: () => true,
  };
  let eventFactory = new EventFactoryImpl();
  let eventAdmin: EventAdminImpl;
  let mockFilterParser = {
    parse: jest.fn(),
  };
  let mockContextGetService = jest.fn();
  let mockContext: any = {
    getService: mockContextGetService,
  };
  let mockWarnLog: any = jest.fn();
  let mockLogger: any = {
    warn: mockWarnLog,
  };

  beforeEach(() => {
    mockFilterParser.parse.mockClear();
    mockContextGetService.mockClear();
    mockWarnLog.mockClear();
    eventAdmin = new EventAdminImpl(mockContext, mockLogger, mockFilterParser);
  });

  describe('postEvent()', () => {
    it('topic matches, filter does not, no handler triggering', async () => {
      mockFilterParser.parse.mockImplementation(() => nonMatchingFilter);
      const event = eventFactory.build('@pandino/event-admin/Test', {
        prop1: 'nay',
      });
      const reg = createRegistration(['@pandino/event-admin/Test'], undefined, '(prop1=yayy)');

      eventAdmin.getRegistrations().push(reg);
      eventAdmin.postEvent(event);

      await delay(DELAY_MS);

      expect(eventAdmin.getRegistrations().length).toEqual(1);
      expect(reg.service.handleEvent).toHaveBeenCalledTimes(0);
    });

    it('topic matches, filter matches, handler triggering once', async () => {
      mockFilterParser.parse.mockImplementation(() => matchingFilter);
      const event = eventFactory.build('@pandino/event-admin/Test', {
        prop1: 'yayy',
      });
      const reg = createRegistration(['@pandino/event-admin/Test'], undefined, '(prop1=yayy)');

      eventAdmin.getRegistrations().push(reg);
      eventAdmin.postEvent(event);

      await delay(DELAY_MS);

      expect(eventAdmin.getRegistrations().length).toEqual(1);
      expect(reg.service.handleEvent).toHaveBeenCalledTimes(1);
    });

    it('multiple registrations, single event, single match', async () => {
      const event = eventFactory.build('@pandino/event-admin/Test', {
        prop1: 'test',
        two: 2,
      });
      const reg = createRegistration('@pandino/event-admin/Test');
      const reg2 = createRegistration('@pandino/other-bundle/some-topic');

      eventAdmin.getRegistrations().push(reg, reg2);
      eventAdmin.postEvent(event);

      await delay(DELAY_MS);

      expect(eventAdmin.getRegistrations().length).toEqual(2);
      expect(reg.service.handleEvent).toHaveBeenCalledTimes(1);
      expect(reg.service.handleEvent).toHaveBeenCalledWith({
        topic: '@pandino/event-admin/Test',
        properties: {
          prop1: 'test',
          two: 2,
        },
      });
      expect(reg2.service.handleEvent).toHaveBeenCalledTimes(0);
    });

    it('multiple registrations, single event, multiple match', async () => {
      const event = eventFactory.build('@pandino/event-admin/Test', {});
      const reg = createRegistration('@pandino/event-admin/Test');
      const reg2 = createRegistration('@pandino/event-admin*');

      eventAdmin.getRegistrations().push(reg, reg2);
      eventAdmin.postEvent(event);

      await delay(DELAY_MS);

      expect(eventAdmin.getRegistrations().length).toEqual(2);
      expect(reg.service.handleEvent).toHaveBeenCalledTimes(1);
      expect(reg2.service.handleEvent).toHaveBeenCalledTimes(1);
    });

    it('single registration, multiple topics, single event, single match', async () => {
      const event = eventFactory.build('@pandino/event-admin/Test2', {});
      const reg = createRegistration(['@pandino/event-admin/Test1', '@pandino/event-admin/Test2']);

      eventAdmin.getRegistrations().push(reg);
      eventAdmin.postEvent(event);

      await delay(DELAY_MS);

      expect(eventAdmin.getRegistrations().length).toEqual(1);
      expect(reg.service.handleEvent).toHaveBeenCalledTimes(1);
    });

    it('single registration, multiple topics, single event, no match', async () => {
      const event = eventFactory.build('@pandino/event-admin/some-test', {});
      const reg = createRegistration(['@pandino/event-admin/Test1', '@pandino/event-admin/Test2']);

      eventAdmin.getRegistrations().push(reg);
      eventAdmin.postEvent(event);

      await delay(DELAY_MS);

      expect(eventAdmin.getRegistrations().length).toEqual(1);
      expect(reg.service.handleEvent).toHaveBeenCalledTimes(0);
    });

    it('single registration, multiple topics, multiple events, multiple matches', async () => {
      const event1 = eventFactory.build('@pandino/event-admin/Test1', {
        prop1: 'test1',
      });
      const event2 = eventFactory.build('@pandino/event-admin/Test2', {
        prop1: 'test2',
      });
      const mock = jest.fn();
      const reg = createRegistration(['@pandino/event-admin/Test1', '@pandino/event-admin/Test2'], mock);

      eventAdmin.getRegistrations().push(reg);
      eventAdmin.postEvent(event1);
      eventAdmin.postEvent(event2);

      await delay(DELAY_MS);

      expect(eventAdmin.getRegistrations().length).toEqual(1);
      expect(mock).toHaveBeenCalledTimes(2);
      expect(mock.mock.calls[0][0]).toEqual({
        topic: '@pandino/event-admin/Test1',
        properties: {
          prop1: 'test1',
        },
      });
      expect(mock.mock.calls[1][0]).toEqual({
        topic: '@pandino/event-admin/Test2',
        properties: {
          prop1: 'test2',
        },
      });
    });
  });

  describe('serviceChanged()', () => {
    it('does nothing if service is not an actual event handler', () => {
      (eventAdmin as any).eventHandlerRegistered = jest.fn();

      const invalidEvent: any = {
        getServiceReference: () => ({
          hasObjectClass: () => false,
        }),
      };

      eventAdmin.serviceChanged(invalidEvent);

      expect((eventAdmin as any).eventHandlerRegistered).toHaveBeenCalledTimes(0);
    });

    it('handles REGISTERED case', () => {
      (eventAdmin as any).eventHandlerRegistered = jest.fn();
      const mockServiceForRef = {
        handleEvent: jest.fn(),
      };
      mockContextGetService.mockImplementation(() => mockServiceForRef);
      const mockReference: any = {
        hasObjectClass: () => true,
      };
      const event: ServiceEvent = {
        getServiceReference: () => mockReference,
        getType: () => 'REGISTERED',
      };

      eventAdmin.serviceChanged(event);

      expect((eventAdmin as any).eventHandlerRegistered).toHaveBeenCalledTimes(1);
      expect((eventAdmin as any).eventHandlerRegistered).toHaveBeenCalledWith(mockReference);
    });

    it('handles UNREGISTERING case', () => {
      (eventAdmin as any).eventHandlerUnregistering = jest.fn();
      const mockServiceForRef = {
        handleEvent: jest.fn(),
      };
      mockContextGetService.mockImplementation(() => mockServiceForRef);
      const mockReference: any = {
        hasObjectClass: () => true,
      };
      const event: ServiceEvent = {
        getServiceReference: () => mockReference,
        getType: () => 'UNREGISTERING',
      };

      eventAdmin.serviceChanged(event);

      expect((eventAdmin as any).eventHandlerUnregistering).toHaveBeenCalledTimes(1);
      expect((eventAdmin as any).eventHandlerUnregistering).toHaveBeenCalledWith(mockReference);
    });
  });

  describe('eventHandlerRegistered()', () => {
    it('does not register handler if reference has no props', () => {
      const mockRef: any = {
        getProperties: () => ({}),
      };

      (eventAdmin as any).eventHandlerRegistered(mockRef);

      expect(eventAdmin.getRegistrations().length).toEqual(0);
      expect(mockWarnLog).toHaveBeenCalledTimes(1);
    });

    it('does not register handler if reference topic is of wrong type', () => {
      const mockRef1: any = {
        getProperties: () => ({
          [EVENT_TOPIC]: 1,
        }),
      };
      const mockRef2: any = {
        getProperties: () => ({
          [EVENT_TOPIC]: true,
        }),
      };

      (eventAdmin as any).eventHandlerRegistered(mockRef1);
      (eventAdmin as any).eventHandlerRegistered(mockRef2);

      expect(eventAdmin.getRegistrations().length).toEqual(0);
      expect(mockWarnLog).toHaveBeenCalledTimes(2);
    });

    it('registers handler', () => {
      const mockService = {};
      mockContextGetService.mockReturnValue(mockService);
      const mockRef: any = {
        getProperties: () => ({
          [EVENT_TOPIC]: '@scope/yayy/hello',
        }),
      };

      (eventAdmin as any).eventHandlerRegistered(mockRef);

      expect(eventAdmin.getRegistrations().length).toEqual(1);
      expect(mockWarnLog).toHaveBeenCalledTimes(0);

      const reg: EventHandlerRegistrationInfo = eventAdmin.getRegistrations()[0];

      expect(reg[EVENT_TOPIC]).toEqual('@scope/yayy/hello');
      expect(reg[EVENT_FILTER]).toEqual(undefined);
      expect(reg.reference).toEqual(mockRef);
      expect(reg.service).toEqual(mockService);
    });

    it('registers handler with filter', () => {
      const mockService = {};
      const mockFilter = {};
      mockContextGetService.mockReturnValue(mockService);
      const mockRef: any = {
        getProperties: () => ({
          [EVENT_TOPIC]: '@scope/yayy/hello',
          [EVENT_FILTER]: mockFilter,
        }),
      };

      (eventAdmin as any).eventHandlerRegistered(mockRef);

      expect(eventAdmin.getRegistrations().length).toEqual(1);
      expect(mockWarnLog).toHaveBeenCalledTimes(0);

      const reg: EventHandlerRegistrationInfo = eventAdmin.getRegistrations()[0];

      expect(reg[EVENT_FILTER]).toEqual(mockFilter);
    });
  });

  describe('eventHandlerUnregistering()', () => {
    it('removes handler if present', () => {
      const reg = createRegistration('@pandino/event-admin/Test');
      const reg2 = createRegistration('@pandino/other-bundle/some-topic');

      eventAdmin.getRegistrations().push(reg, reg2);

      expect(eventAdmin.getRegistrations().length).toEqual(2);

      (eventAdmin as any).eventHandlerUnregistering(reg.reference);

      expect(eventAdmin.getRegistrations().length).toEqual(1);
      expect(eventAdmin.getRegistrations()[0][EVENT_TOPIC]).toEqual('@pandino/other-bundle/some-topic');
    });
  });

  function createRegistration(
    topic: string | string[],
    externalMock?: any,
    filter?: string,
  ): EventHandlerRegistrationInfo {
    return {
      [EVENT_TOPIC]: topic,
      [EVENT_FILTER]: filter,
      service: {
        handleEvent: externalMock || jest.fn(),
      },
      reference: undefined,
    };
  }

  async function delay(time: number) {
    await new Promise((r) => setTimeout(r, time));
  }
});
