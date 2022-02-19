import { FrameworkEvent } from '@pandino/pandino-api';
import { BUNDLE_SYMBOLICNAME, EVENT } from '@pandino/pandino-event-api';
import { EventAdminImpl } from '../event-admin-impl';
import { EventFactoryImpl } from '../event-factory-impl';
import { FrameworkEventAdapter } from './framework-event-adapter';

describe('FrameworkEventAdapter', () => {
  let fea: FrameworkEventAdapter;
  let eventAdmin: EventAdminImpl;
  const eventFactoryImpl = new EventFactoryImpl();
  const mockContextGetService = jest.fn();
  const mockContextAddFrameworkListener = jest.fn();
  const mockContextRemoveFrameworkListener = jest.fn();
  const mockContext: any = {
    getService: mockContextGetService,
    addFrameworkListener: mockContextAddFrameworkListener,
    removeFrameworkListener: mockContextRemoveFrameworkListener,
  };
  const mockFilterParser = {
    parse: jest.fn(),
  };
  const mockLogger: any = {};
  const mockPostEvent = jest.fn();
  const bundle1: any = {
    getSymbolicName: () => '@scope/bundle1',
    getBundleId: () => 11,
  };

  beforeEach(() => {
    mockPostEvent.mockClear();
    mockContextGetService.mockClear();
    mockContextAddFrameworkListener.mockClear();
    mockContextRemoveFrameworkListener.mockClear();
    eventAdmin = new EventAdminImpl(mockContext, mockLogger, mockFilterParser);
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
    ${'STARTED'} | ${'@pandino/pandino-event-admin/FrameworkEvent/STARTED'}
    ${'ERROR'}   | ${'@pandino/pandino-event-admin/FrameworkEvent/ERROR'}
  `("frameworkEvent() for '$eventType' event", ({ eventType, expectedTopic }) => {
    const event: FrameworkEvent = {
      getType: () => eventType,
      getBundle: () => bundle1,
      getError: () => new Error(),
    };
    fea.frameworkEvent(event);

    expect(mockPostEvent).toHaveBeenCalledTimes(1);
    expect(mockPostEvent).toHaveBeenCalledWith({
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
