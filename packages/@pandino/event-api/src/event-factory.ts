import type { Event } from './event';
import type { EventProperties } from './event-properties';

export interface EventFactory {
  build<T extends EventProperties>(topic: string, properties: T): Event;
}
