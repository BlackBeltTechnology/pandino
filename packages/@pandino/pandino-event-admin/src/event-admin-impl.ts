import { BundleContext, Logger, ServiceEvent, ServiceListener, ServiceReference } from '@pandino/pandino-api';
import {
  Event,
  EVENT_FILTER,
  EVENT_HANDLER_INTERFACE_KEY,
  EVENT_TOPIC,
  EventAdmin,
  EventHandler,
} from '@pandino/pandino-event-api';
import { EventHandlerRegistrationInfo } from './event-handler-registration-info';

export class EventAdminImpl implements EventAdmin, ServiceListener {
  private readonly regs: Array<EventHandlerRegistrationInfo> = [];
  private readonly context: BundleContext;
  private readonly logger: Logger;

  constructor(context: BundleContext, logger: Logger) {
    this.context = context;
    this.logger = logger;
  }

  serviceChanged(event: ServiceEvent): void {
    const ref = event.getServiceReference();

    if (ref.hasObjectClass(EVENT_HANDLER_INTERFACE_KEY)) {
      const service = this.context.getService(ref);

      if (service && typeof (service as EventHandler).handleEvent === 'function') {
        if (event.getType() === 'REGISTERED') {
          this.eventHandlerRegistered(ref);
        } else if (event.getType() === 'UNREGISTERING') {
          this.eventHandlerUnregistering(ref);
        }
      }
    }
  }

  postEvent(event: Event): void {
    // Event Handler services can also be registered with an EVENT_FILTER service property to further filter the events.
    // If the syntax of this filter is invalid, then the Event Handler must be ignored by the Event Admin service.
    // The Event Admin service should log a warning.
    event.getTopic();
    setTimeout(() => {}, 0);
  }

  private eventHandlerRegistered(ref: ServiceReference<EventHandler>): void {
    const props = ref.getProperties();

    if (typeof props[EVENT_TOPIC] !== 'string' && !Array.isArray(props[EVENT_TOPIC])) {
      this.logger.warn(`Skipping registration of Event Handler, invalid topic format: ${props[EVENT_TOPIC]}!`);
      return;
    }

    if (!this.regs.find((reg) => reg.reference === ref)) {
      let newReg: EventHandlerRegistrationInfo = {
        [EVENT_TOPIC]: props[EVENT_TOPIC],
        reference: ref,
        service: this.context.getService(ref),
      };
      if (props[EVENT_FILTER] !== null && props[EVENT_FILTER] !== undefined) {
        newReg[EVENT_FILTER] = props[EVENT_FILTER];
      }
      this.regs.push(newReg);
    }
  }

  private eventHandlerUnregistering(ref: ServiceReference<EventHandler>): void {
    const idx = this.regs.findIndex((reg) => reg.reference === ref);

    if (idx > -1) {
      this.regs.splice(idx, 1);
    }
  }
}
