import type { OSGiFramework } from '~/framework/framework';
import type { BundleEvent, LdapFilterService, ServiceEvent, ServiceReference } from '~/framework/interfaces';
import { Event, type EventAdmin, type EventHandler } from './interfaces';

export class EventAdminImpl implements EventAdmin {
  private eventQueue: Event[] = [];
  private processing = false;
  private readonly ldapFilterService: LdapFilterService | null = null;

  constructor(private framework: OSGiFramework) {
    const serviceRef = this.framework.getBundleContext().getServiceReference<LdapFilterService>('LdapFilterService');
    if (serviceRef) {
      this.ldapFilterService = this.framework.getBundleContext().getService(serviceRef);
    }

    this.framework.on('service-event', this.handleServiceEvent.bind(this));
    this.framework.on('bundle-event', this.handleBundleEvent.bind(this));
  }

  postEvent(event: Event): void {
    this.eventQueue.push(event);
    if (!this.processing) {
      setTimeout(() => this.processQueue(), 0);
    }
  }

  private async processQueue(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift()!;
      this.deliverEvent(event);
    }

    this.processing = false;
  }

  sendEvent(event: Event): void {
    this.deliverEvent(event);
  }

  private deliverEvent(event: Event): void {
    const handlers = this.getEventHandlers(event);

    for (const handlerRef of handlers) {
      const handler = this.framework.getService<EventHandler>(handlerRef);
      if (handler) {
        try {
          handler.handleEvent(event);
        } catch (error) {
          console.error('Error in event handler:', error);
        }
      }
    }
  }

  private getEventHandlers(event: Event): ServiceReference<EventHandler>[] {
    const handlerRefs = this.framework.getServiceReferences<EventHandler>('EventHandler');
    const matchingHandlers: ServiceReference<EventHandler>[] = [];

    for (const handlerRef of handlerRefs) {
      if (this.handlerMatches(handlerRef, event)) {
        matchingHandlers.push(handlerRef);
      }
    }

    return matchingHandlers;
  }

  private handlerMatches(handlerRef: ServiceReference<EventHandler>, event: Event): boolean {
    const eventTopics = handlerRef.getProperty('event.topics');
    if (!eventTopics) return false;

    const topics = Array.isArray(eventTopics) ? eventTopics : [eventTopics];
    const eventTopic = event.getTopic();

    const topicMatches = topics.some((topic) => {
      if (topic === '*') return true;
      if (topic.endsWith('/*')) {
        const prefix = topic.slice(0, -2);
        return eventTopic.startsWith(`${prefix}/`) || eventTopic === prefix;
      }
      return topic === eventTopic;
    });

    if (!topicMatches) return false;

    const eventFilter = handlerRef.getProperty('event.filter');
    if (eventFilter && this.ldapFilterService) {
      const eventProps: Record<string, any> = { 'event.topic': eventTopic };

      for (const propName of event.getPropertyNames()) {
        eventProps[propName] = event.getProperty(propName);
      }

      return this.ldapFilterService.match(eventFilter, eventProps);
    }

    return true;
  }

  private handleServiceEvent(serviceEvent: ServiceEvent): void {
    const eventType = this.getServiceEventTypeName(serviceEvent.getType());
    const topic = `pandino/framework/ServiceEvent/${eventType}`;

    const serviceRef = serviceEvent.getServiceReference();
    const properties = {
      service: serviceRef,
      'service.id': serviceRef.getProperty('service.id'),
      'service.objectClass': serviceRef.getProperty('objectClass'),
      bundle: serviceRef.getBundle(),
      'bundle.id': serviceRef.getBundle().getBundleId(),
      'bundle.symbolicName': serviceRef.getBundle().getSymbolicName(),
    };

    const event = new Event(topic, properties);
    this.postEvent(event);
  }

  private handleBundleEvent(bundleEvent: BundleEvent): void {
    const eventType = this.getBundleEventTypeName(bundleEvent.getType());
    const topic = `pandino/framework/BundleEvent/${eventType}`;

    const bundle = bundleEvent.getBundle();
    const properties = {
      bundle: bundle,
      'bundle.id': bundle.getBundleId(),
      'bundle.symbolicName': bundle.getSymbolicName(),
      'bundle.version': bundle.getVersion(),
    };

    const event = new Event(topic, properties);
    this.postEvent(event);
  }

  private getServiceEventTypeName(type: number): string {
    switch (type) {
      case 1:
        return 'REGISTERED';
      case 2:
        return 'MODIFIED';
      case 4:
        return 'UNREGISTERING';
      case 8:
        return 'MODIFIED_ENDMATCH';
      default:
        return 'UNKNOWN';
    }
  }

  private getBundleEventTypeName(type: number): string {
    switch (type) {
      case 1:
        return 'UNINSTALLED';
      case 2:
        return 'INSTALLED';
      case 4:
        return 'RESOLVED';
      case 8:
        return 'STARTING';
      case 16:
        return 'STOPPING';
      case 32:
        return 'ACTIVE';
      default:
        return 'UNKNOWN';
    }
  }
}
