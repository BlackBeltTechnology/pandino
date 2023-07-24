import {
  BundleActivator,
  BundleContext,
  FRAMEWORK_EVALUATE_FILTER,
  FRAMEWORK_LOGGER,
  Logger,
  SERVICE_LISTENER_INTERFACE_KEY,
  ServiceListener,
  ServiceReference,
  ServiceRegistration,
} from '@pandino/pandino-api';
import type { FilterEvaluator } from '@pandino/filters';
import { EVENT_ADMIN_INTERFACE_KEY, EVENT_FACTORY_INTERFACE_KEY, EventAdmin, EventFactory } from '@pandino/event-api';
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
  private evaluateFilterService: ServiceReference<FilterEvaluator>;
  private evaluateFilter: FilterEvaluator;
  private eventAdmin: EventAdmin & ServiceListener;
  private readonly adapters: AbstractAdapter[] = [];

  async start(context: BundleContext): Promise<void> {
    this.loggerRef = context.getServiceReference(FRAMEWORK_LOGGER);
    this.logger = context.getService(this.loggerRef);
    this.evaluateFilterService = context.getServiceReference<FilterEvaluator>(FRAMEWORK_EVALUATE_FILTER);
    this.evaluateFilter = context.getService(this.evaluateFilterService);
    this.eventAdmin = new EventAdminImpl(context, this.logger, this.evaluateFilter);
    const eventFactoryImpl = new EventFactoryImpl(this.evaluateFilter);
    this.eventAdminRegistration = context.registerService(
      [EVENT_ADMIN_INTERFACE_KEY, SERVICE_LISTENER_INTERFACE_KEY],
      this.eventAdmin,
    );
    this.eventFactoryRegistration = context.registerService(EVENT_FACTORY_INTERFACE_KEY, eventFactoryImpl);

    context.addServiceListener(this.eventAdmin);

    this.adapters.push(new BundleEventAdapter(context, this.eventAdmin, eventFactoryImpl));
    this.adapters.push(new FrameworkEventAdapter(context, this.eventAdmin, eventFactoryImpl));
    this.adapters.push(new LogEventAdapter(context, this.eventAdmin, eventFactoryImpl));
    this.adapters.push(new ServiceEventAdapter(context, this.eventAdmin, eventFactoryImpl));
  }

  async stop(context: BundleContext): Promise<void> {
    this.adapters.forEach((adapter) => adapter.destroy(context));
    context.removeServiceListener(this.eventAdmin);
    if (this.loggerRef) {
      context.ungetService(this.loggerRef);
    }
    if (this.evaluateFilterService) {
      context.ungetService(this.evaluateFilterService);
    }
    this.eventAdminRegistration.unregister();
    this.eventFactoryRegistration.unregister();
  }
}
