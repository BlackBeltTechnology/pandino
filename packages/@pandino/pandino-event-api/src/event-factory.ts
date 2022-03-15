import { Event } from './event';
import { EventProperties } from './event-properties';

export interface EventFactory {
  build<T extends EventProperties>(topic: string, properties: T): Event;
}
