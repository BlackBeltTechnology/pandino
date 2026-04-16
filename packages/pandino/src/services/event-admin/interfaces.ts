/**
 * Service for publishing events to topic-based subscribers.
 * Obtain via `context.getServiceReference<EventAdmin>('EventAdmin')`.
 */
export interface EventAdmin {
  /** Delivers the event asynchronously. Returns immediately. */
  postEvent(event: Event): void;
  /** Delivers the event synchronously. Blocks until all handlers complete. */
  sendEvent(event: Event): void;
}

/**
 * An event carrying a topic string and a map of properties.
 *
 * @example
 * ```ts
 * const event = new Event('user/login', { userId: '123' });
 * eventAdmin.sendEvent(event);
 * ```
 */
export class Event {
  constructor(
    private topic: string,
    private properties: Record<string, any> = {},
  ) {}

  /** Returns the topic path (e.g. `'user/login'`). */
  getTopic(): string {
    return this.topic;
  }

  /** Returns a single property by name. */
  getProperty(name: string): any {
    return this.properties[name];
  }

  /** Returns a copy of all properties. */
  getProperties(): Record<string, any> {
    return { ...this.properties };
  }

  /** Returns all property names. */
  getPropertyNames(): string[] {
    return Object.keys(this.properties);
  }

  /** Checks whether a property exists. */
  containsProperty(name: string): boolean {
    return name in this.properties;
  }
}

/**
 * Implement this interface and register as a service with an `event.topics`
 * property to subscribe to events. Topics support wildcards (e.g. `'user/*'`).
 */
export interface EventHandler {
  /** Called when an event matching the subscribed topics is published. */
  handleEvent(event: Event): void;
}
