import { EVENT_FILTER, EVENT_TOPIC, EventHandler } from '@pandino/event-api';
import { ServiceReference } from '@pandino/pandino-api';

export interface EventHandlerRegistrationInfo {
  [EVENT_TOPIC]: string | string[];
  [EVENT_FILTER]?: string;
  reference: ServiceReference<EventHandler>;
  service: EventHandler;
}
