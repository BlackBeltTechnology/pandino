import { EVENT_FILTER, EVENT_TOPIC } from '@pandino/event-api';
import type { EventHandler } from '@pandino/event-api';
import type { ServiceReference } from '@pandino/pandino-api';

export interface EventHandlerRegistrationInfo {
  [EVENT_TOPIC]: string | string[];
  [EVENT_FILTER]?: string;
  reference: ServiceReference<EventHandler>;
  service: EventHandler;
}
