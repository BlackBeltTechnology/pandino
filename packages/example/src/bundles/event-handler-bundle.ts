import type { BundleActivator, BundleContext, ServiceRegistration } from '@pandino/pandino';
import { Event, EventHandler } from '@pandino/pandino';

export interface EventRecord {
  id: string;
  topic: string;
  properties: Record<string, any>;
  receivedAt: number;
}

export interface EventListenerService {
  getAllEvents(): EventRecord[];
  getEventsByTopic(topicPattern: string): EventRecord[];
  clearEvents(): void;
  getEventStats(): {
    totalEvents: number;
    eventsByTopic: Record<string, number>;
  };
}

abstract class BaseEventHandler implements EventHandler {
  protected events: EventRecord[] = [];
  protected context: BundleContext;
  protected logger: any;

  constructor(context: BundleContext, logger: any) {
    this.context = context;
    this.logger = logger;
  }

  handleEvent(event: Event): void {
    const eventRecord: EventRecord = {
      id: Date.now().toString(36) + Math.random().toString(36).substring(2),
      topic: event.getTopic(),
      properties: { ...event.getProperties() },
      receivedAt: Date.now(),
    };

    this.events.push(eventRecord);
    this.processEvent(eventRecord);
  }

  protected abstract processEvent(eventRecord: EventRecord): void;

  getEvents(): EventRecord[] {
    return [...this.events];
  }

  clearEvents(): void {
    this.events = [];
  }
}

class UserEventHandler extends BaseEventHandler {
  processEvent(eventRecord: EventRecord): void {
    if (this.logger) {
      this.logger.info(`UserEventHandler received event: ${eventRecord.topic}`, undefined, eventRecord.properties);
    }
  }
}

class SystemEventHandler extends BaseEventHandler {
  processEvent(eventRecord: EventRecord): void {
    if (this.logger) {
      this.logger.info(`SystemEventHandler received event: ${eventRecord.topic}`, undefined, eventRecord.properties);
    }
  }
}

class NotificationEventHandler extends BaseEventHandler {
  processEvent(eventRecord: EventRecord): void {
    if (this.logger) {
      this.logger.info(
        `NotificationEventHandler received event: ${eventRecord.topic}`,
        undefined,
        eventRecord.properties,
      );
    }
  }
}

class EventListenerServiceImpl implements EventListenerService {
  private eventHandlers: BaseEventHandler[];

  constructor(eventHandlers: BaseEventHandler[]) {
    this.eventHandlers = eventHandlers;
  }

  getAllEvents(): EventRecord[] {
    // Combine events from all handlers and sort by receivedAt (newest first)
    return this.eventHandlers.flatMap((handler) => handler.getEvents()).sort((a, b) => b.receivedAt - a.receivedAt);
  }

  getEventsByTopic(topicPattern: string): EventRecord[] {
    const regex = new RegExp(topicPattern.replace('*', '.*'));
    return this.getAllEvents().filter((event) => regex.test(event.topic));
  }

  clearEvents(): void {
    this.eventHandlers.forEach((handler) => handler.clearEvents());
  }

  getEventStats(): { totalEvents: number; eventsByTopic: Record<string, number> } {
    const events = this.getAllEvents();
    const eventsByTopic: Record<string, number> = {};

    events.forEach((event) => {
      const topic = event.topic;
      eventsByTopic[topic] = (eventsByTopic[topic] || 0) + 1;
    });

    return {
      totalEvents: events.length,
      eventsByTopic,
    };
  }
}

class EventHandlerBundleActivator implements BundleActivator {
  private serviceRegistration: ServiceRegistration<EventListenerService> | null = null;
  private userHandlerRegistration: ServiceRegistration<EventHandler> | null = null;
  private systemHandlerRegistration: ServiceRegistration<EventHandler> | null = null;
  private notificationHandlerRegistration: ServiceRegistration<EventHandler> | null = null;
  private eventListenerService: EventListenerServiceImpl | null = null;
  private userEventHandler: UserEventHandler | null = null;
  private systemEventHandler: SystemEventHandler | null = null;
  private notificationEventHandler: NotificationEventHandler | null = null;
  private frameworkLogger: any = null;

  async start(context: BundleContext): Promise<void> {
    this.frameworkLogger = context.getLogService();

    if (this.frameworkLogger) {
      this.frameworkLogger.info('Starting Event Handler Bundle');
    }

    try {
      this.userEventHandler = new UserEventHandler(context, this.frameworkLogger);
      this.systemEventHandler = new SystemEventHandler(context, this.frameworkLogger);
      this.notificationEventHandler = new NotificationEventHandler(context, this.frameworkLogger);

      // Register user event handler for "user/*" topics
      this.userHandlerRegistration = context.registerService<EventHandler>('EventHandler', this.userEventHandler, {
        'event.topics': 'user/*',
        'handler.type': 'user',
        'service.description': 'Handles user events',
      });

      // Register system event handler for "system/*" topics
      this.systemHandlerRegistration = context.registerService<EventHandler>('EventHandler', this.systemEventHandler, {
        'event.topics': 'system/*',
        'handler.type': 'system',
        'service.description': 'Handles system events',
      });

      // Register notification event handler for "notification/*" topics with priority filter
      this.notificationHandlerRegistration = context.registerService<EventHandler>(
        'EventHandler',
        this.notificationEventHandler,
        {
          'event.topics': 'notification/*',
          'event.filter': '(priority>=50)', // Only handle high-priority notifications
          'handler.type': 'notification',
          'service.description': 'Handles notification events with priority >= 50',
        },
      );

      this.eventListenerService = new EventListenerServiceImpl([
        this.userEventHandler,
        this.systemEventHandler,
        this.notificationEventHandler,
      ]);

      this.serviceRegistration = context.registerService<EventListenerService>(
        'EventListenerService',
        this.eventListenerService,
        {
          'service.description': 'Event listener service',
          'service.vendor': 'Pandino Showcase',
        },
      );

      if (this.frameworkLogger) {
        this.frameworkLogger.info('Event Handler Bundle started');
      }
    } catch (error) {
      if (this.frameworkLogger) {
        this.frameworkLogger.error('Error starting Event Handler Bundle:', error as Error);
      }
    }
  }

  async stop(): Promise<void> {
    if (this.frameworkLogger) {
      this.frameworkLogger.info('Stopping Event Handler Bundle');
    }

    if (this.serviceRegistration) {
      this.serviceRegistration.unregister();
      this.serviceRegistration = null;
    }

    if (this.userHandlerRegistration) {
      this.userHandlerRegistration.unregister();
      this.userHandlerRegistration = null;
    }

    if (this.systemHandlerRegistration) {
      this.systemHandlerRegistration.unregister();
      this.systemHandlerRegistration = null;
    }

    if (this.notificationHandlerRegistration) {
      this.notificationHandlerRegistration.unregister();
      this.notificationHandlerRegistration = null;
    }

    if (this.frameworkLogger) {
      this.frameworkLogger.info('Event Handler Bundle stopped');
    }
  }
}

export default {
  headers: {
    bundleSymbolicName: '@example/event-handler',
    bundleVersion: '1.0.0',
    bundleName: 'Event Handler Bundle',
  },
  activator: new EventHandlerBundleActivator(),
};
