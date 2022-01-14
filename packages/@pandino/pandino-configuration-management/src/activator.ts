import { BundleActivator, BundleContext, Logger, ServiceReference } from '@pandino/pandino-api';
import { INTERFACE_KEY, PersistenceManager } from '@pandino/pandino-persistence-manager-api';

export class Activator implements BundleActivator {
  private context: BundleContext;
  private loggerReference: ServiceReference<Logger>;
  private logger: Logger;
  private persistenceManagerReference: ServiceReference<PersistenceManager>;
  private persistenceManager: PersistenceManager;

  start(context: BundleContext): Promise<void> {
    this.context = context;
    this.loggerReference = context.getServiceReference<Logger>('@pandino/pandino/Logger');
    this.logger = context.getService<Logger>(this.loggerReference);
    this.persistenceManagerReference = context.getServiceReference<PersistenceManager>(INTERFACE_KEY);
    this.persistenceManager = context.getService<PersistenceManager>(this.persistenceManagerReference);
    return Promise.resolve(undefined);
  }

  stop(context: BundleContext): Promise<void> {
    context.ungetService(this.loggerReference);
    context.ungetService(this.persistenceManagerReference);
    return Promise.resolve(undefined);
  }
}
