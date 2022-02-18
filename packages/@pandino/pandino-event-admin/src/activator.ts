import {
  BundleActivator,
  BundleContext,
  FilterParser,
  FRAMEWORK_FILTER_PARSER,
  FRAMEWORK_LOGGER,
  Logger,
  ServiceReference,
  ServiceRegistration,
} from '@pandino/pandino-api';
import {
  EVENT_ADMIN_INTERFACE_KEY,
  EVENT_FACTORY_INTERFACE_KEY,
  EventAdmin,
  EventFactory,
} from '@pandino/pandino-event-api';
import { EventAdminImpl } from './event-admin-impl';
import { EventFactoryImpl } from './event-factory-impl';
import {
  AbstractAdapter,
  BundleEventAdapter,
  FrameworkEventAdapter,
  LogEventAdapter,
  ServiceEventAdapter,
} from './adapters';

export class Activator implements BundleActivator {
  private eventAdminRegistration: ServiceRegistration<EventAdmin>;
  private eventFactoryRegistration: ServiceRegistration<EventFactory>;
  private loggerRef: ServiceReference<Logger>;
  private logger: Logger;
  private filterParserReference: ServiceReference<FilterParser>;
  private filterParser: FilterParser;
  private readonly adapters: AbstractAdapter[] = [];

  start(context: BundleContext): Promise<void> {
    this.loggerRef = context.getServiceReference(FRAMEWORK_LOGGER);
    this.logger = context.getService(this.loggerRef);
    this.filterParserReference = context.getServiceReference<FilterParser>(FRAMEWORK_FILTER_PARSER);
    this.filterParser = context.getService(this.filterParserReference);
    const eventAdmin = new EventAdminImpl(context, this.logger, this.filterParser);
    const eventFactoryImpl = new EventFactoryImpl();
    this.eventAdminRegistration = context.registerService(EVENT_ADMIN_INTERFACE_KEY, eventAdmin);
    this.eventFactoryRegistration = context.registerService(EVENT_FACTORY_INTERFACE_KEY, eventFactoryImpl);

    this.adapters.push(new BundleEventAdapter(context, eventAdmin, eventFactoryImpl));
    this.adapters.push(new FrameworkEventAdapter(context, eventAdmin, eventFactoryImpl));
    this.adapters.push(new LogEventAdapter(context, eventAdmin, eventFactoryImpl));
    this.adapters.push(new ServiceEventAdapter(context, eventAdmin, eventFactoryImpl));

    return Promise.resolve();
  }

  stop(context: BundleContext): Promise<void> {
    this.adapters.forEach((adapter) => adapter.destroy(context));
    if (this.loggerRef) {
      context.ungetService(this.loggerRef);
    }
    if (this.filterParserReference) {
      context.ungetService(this.filterParserReference);
    }
    this.eventAdminRegistration.unregister();
    this.eventFactoryRegistration.unregister();

    return Promise.resolve();
  }
}
