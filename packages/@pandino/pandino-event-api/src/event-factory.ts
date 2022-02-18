import { Event } from './event';
import { EventProperties } from './event-properties';

export interface EventFactory {
  build(topic: string, properties: EventProperties): Event;
}
