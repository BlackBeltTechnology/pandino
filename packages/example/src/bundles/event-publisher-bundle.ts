import type { BundleActivator, BundleContext, ServiceReference, ServiceRegistration } from '@pandino/pandino';
import { EventAdmin, Event } from '@pandino/pandino';

export interface EventPublisherService {
  publishUserEvent(action: string, userId: string, userData: Record<string, any>): void;
  publishSystemEvent(action: string, data: Record<string, any>): void;
  publishNotificationEvent(type: string, message: string, data?: Record<string, any>): void;
  getEventCounts(): Record<string, number>;
}

class EventPublisherServiceImpl implements EventPublisherService {
  private eventAdmin: EventAdmin;
  private eventCounts: Record<string, number> = {};
  private readonly logger: any;

  constructor(eventAdmin: EventAdmin, logger: any) {
    this.eventAdmin = eventAdmin;
    this.logger = logger;
  }

  private incrementEventCount(topic: string): void {
    this.eventCounts[topic] = (this.eventCounts[topic] || 0) + 1;
  }

  publishUserEvent(action: string, userId: string, userData: Record<string, any>): void {
    const topic = `user/${action}`;
    const properties = {
      userId,
      timestamp: Date.now(),
      ...userData,
    };

    this.eventAdmin.sendEvent(new Event(topic, properties));
    this.incrementEventCount(topic);

    if (this.logger) {
      this.logger.info(`Published user event: ${topic}`, undefined, properties);
    }
  }

  publishSystemEvent(action: string, data: Record<string, any>): void {
    const topic = `system/${action}`;
    const properties = {
      timestamp: Date.now(),
      ...data,
    };

    this.eventAdmin.sendEvent(new Event(topic, properties));
    this.incrementEventCount(topic);

    if (this.logger) {
      this.logger.info(`Published system event: ${topic}`, undefined, properties);
    }
  }

  publishNotificationEvent(type: string, message: string, data: Record<string, any> = {}): void {
    const topic = `notification/${type}`;
    const properties = {
      message,
      timestamp: Date.now(),
      ...data,
    };

    this.eventAdmin.sendEvent(new Event(topic, properties));
    this.incrementEventCount(topic);

    if (this.logger) {
      this.logger.info(`Published notification event: ${topic}`, undefined, properties);
    }
  }

  getEventCounts(): Record<string, number> {
    return { ...this.eventCounts };
  }
}

class EventPublisherBundleActivator implements BundleActivator {
  private serviceRegistration: ServiceRegistration<EventPublisherService> | null = null;
  private eventAdminRef: ServiceReference<EventAdmin> | null = null;
  private eventPublisherService: EventPublisherServiceImpl | null = null;
  private frameworkLogger: any = null;

  async start(context: BundleContext): Promise<void> {
    this.frameworkLogger = context.getLogService();

    if (this.frameworkLogger) {
      this.frameworkLogger.info('Starting Event Publisher Bundle');
    }

    try {
      this.eventAdminRef = context.getServiceReference<EventAdmin>('EventAdmin');

      if (!this.eventAdminRef) {
        if (this.frameworkLogger) {
          this.frameworkLogger.warn('EventAdmin service not available, waiting...');
        }
        return; // Bundle will be in STARTING state until dependencies are available
      }

      const eventAdmin = context.getService<EventAdmin>(this.eventAdminRef);

      if (!eventAdmin) {
        if (this.frameworkLogger) {
          this.frameworkLogger.warn('Failed to get EventAdmin service instance');
        }
        return;
      }

      this.eventPublisherService = new EventPublisherServiceImpl(eventAdmin, this.frameworkLogger);
      this.serviceRegistration = context.registerService<EventPublisherService>(
        'EventPublisherService',
        this.eventPublisherService,
        {
          'service.description': 'Event publisher service',
          'service.vendor': 'Pandino Showcase',
        },
      );

      this.eventPublisherService.publishSystemEvent('bundle/started', {
        bundleId: context.getBundle().getBundleId(),
        bundleName: context.getBundle().getSymbolicName(),
      });

      if (this.frameworkLogger) {
        this.frameworkLogger.info('Event Publisher Bundle started');
      }
    } catch (error) {
      if (this.frameworkLogger) {
        this.frameworkLogger.error('Error starting Event Publisher Bundle:', error as Error);
      }
    }
  }

  async stop(context: BundleContext): Promise<void> {
    if (this.frameworkLogger) {
      this.frameworkLogger.info('Stopping Event Publisher Bundle');
    }

    if (this.eventPublisherService) {
      this.eventPublisherService.publishSystemEvent('bundle/stopping', {
        bundleId: context.getBundle().getBundleId(),
        bundleName: context.getBundle().getSymbolicName(),
      });
    }

    if (this.serviceRegistration) {
      this.serviceRegistration.unregister();
      this.serviceRegistration = null;
    }

    if (this.eventAdminRef) {
      context.ungetService(this.eventAdminRef);
      this.eventAdminRef = null;
    }

    if (this.frameworkLogger) {
      this.frameworkLogger.info('Event Publisher Bundle stopped');
    }
  }
}

export default {
  headers: {
    bundleSymbolicName: '@example/event-publisher',
    bundleVersion: '1.0.0',
    bundleName: 'Event Publisher Bundle',
  },
  activator: new EventPublisherBundleActivator(),
};
