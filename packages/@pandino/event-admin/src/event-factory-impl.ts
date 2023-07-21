import type { Event, EventFactory, EventProperties } from '@pandino/event-api';
import type { FilterEvaluator } from '@pandino/filters';
import { EventImpl } from './event-impl';

export class EventFactoryImpl implements EventFactory {
  constructor(private filterEvaluator: FilterEvaluator) {}

  build(topic: string, properties: EventProperties): Event {
    return new EventImpl(topic, properties, this.filterEvaluator);
  }
}
