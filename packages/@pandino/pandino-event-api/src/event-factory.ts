import { Event } from './event';
import { EventProperties } from './event-properties';

export type EventFactory = (topic: string, properties: EventProperties) => Event;
