import { ServiceEvent, ServiceEventType, ServiceReference, SERVICE_ID } from '@pandino/pandino-api';

export class ServiceEventImpl implements ServiceEvent {
  constructor(private readonly type: ServiceEventType, private readonly reference: ServiceReference<any>) {}

  getServiceReference(): ServiceReference<any> {
    return this.reference;
  }

  getType(): ServiceEventType {
    return this.type;
  }

  toString(): string {
    return `Service: ${this.reference.getProperty(SERVICE_ID)} changed state to: ${this.type}.`;
  }
}
