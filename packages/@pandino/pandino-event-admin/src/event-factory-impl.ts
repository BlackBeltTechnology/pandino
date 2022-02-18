import { Event, EventFactory, EventProperties } from '@pandino/pandino-event-api';
import { EventImpl } from './event-impl';

export class EventFactoryImpl implements EventFactory {
  build(topic: string, properties: EventProperties): Event {
    return new EventImpl(topic, properties);
  }
}
