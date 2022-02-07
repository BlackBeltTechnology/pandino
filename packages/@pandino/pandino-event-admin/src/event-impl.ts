import { Event, EVENT_TOPIC, EventProperties } from '@pandino/pandino-event-api';
import { FilterApi } from '@pandino/pandino-api';

export class EventImpl implements Event {
  private readonly topic: string;
  private readonly properties: EventProperties;

  constructor(topic: string, properties: EventProperties) {
    EventImpl.validateTopicName(topic);
    this.topic = topic;
    this.properties = properties;
  }

  containsProperty(name: string): boolean {
    if (EVENT_TOPIC === name) {
      return true;
    }
    return Object.keys(this.properties).includes(name);
  }

  equals(other: any): boolean {
    if (other === this) {
      return true;
    }

    if (!(other instanceof Event)) {
      return false;
    }

    return (other as unknown as Event).getTopic() === this.topic;
  }

  getProperty(name: string): any {
    if (EVENT_TOPIC === name) {
      return this.topic;
    }
    return this.properties[name];
  }

  getPropertyNames(): string[] {
    return [...Object.keys(this.properties), EVENT_TOPIC];
  }

  getTopic(): string {
    return this.topic;
  }

  matches(filter: FilterApi): boolean {
    return filter.match({
      ...this.properties,
      [EVENT_TOPIC]: this.topic,
    });
  }

  private static validateTopicName(topic: string): void {
    let chars: string[] = topic.split('');
    const length = chars.length;
    if (length === 0) {
      throw new Error('empty topic');
    }
    for (let i = 0; i < length; i++) {
      let ch = chars[i];
      if (ch === '/') {
        // Can't start or end with a '/' but anywhere else is okay
        if (i === 0 || i === length - 1) {
          throw new Error('invalid topic: ' + topic);
        }
        // Can't have "//" as that implies empty token
        if (chars[i - 1] === '/') {
          throw new Error('invalid topic: ' + topic);
        }
        continue;
      }
      if ('A' <= ch && ch <= 'Z') {
        continue;
      }
      if ('a' <= ch && ch <= 'z') {
        continue;
      }
      if ('0' <= ch && ch <= '9') {
        continue;
      }
      if (ch == '_' || ch == '-') {
        continue;
      }
      throw new Error('invalid topic: ' + topic);
    }
  }
}
