export interface EventAdmin {
  postEvent(event: Event): void;
  sendEvent(event: Event): void;
}

export class Event {
  constructor(
    private topic: string,
    private properties: Record<string, any> = {},
  ) {}

  getTopic(): string {
    return this.topic;
  }

  getProperty(name: string): any {
    return this.properties[name];
  }

  getPropertyNames(): string[] {
    return Object.keys(this.properties);
  }

  containsProperty(name: string): boolean {
    return name in this.properties;
  }
}

export interface EventHandler {
  handleEvent(event: Event): void;
}
