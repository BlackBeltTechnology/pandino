import { Event, EventFactory, EventProperties } from '@pandino/pandino-event-api';
import { EventImpl } from './event-impl';

export const eventFactoryImpl: EventFactory = (topic: string, properties: EventProperties): Event => {
  return new EventImpl(topic, properties);
};
