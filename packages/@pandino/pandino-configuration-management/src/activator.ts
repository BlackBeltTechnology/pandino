import {
  Bundle,
  BundleActivator,
  BundleContext,
  FilterParser,
  FRAMEWORK_FILTER_PARSER,
  Logger,
  ServiceEvent,
  ServiceListener,
  ServiceReference,
  ServiceRegistration,
} from '@pandino/pandino-api';
import { ConfigurationAdmin, CONFIG_ADMIN_INTERFACE_KEY } from '@pandino/pandino-configuration-management-api';
import { INTERFACE_KEY, PersistenceManager } from '@pandino/pandino-persistence-manager-api';
import { ConfigurationAdminImpl } from './configuration-admin-impl';
import { ConfigurationManager } from './configuration-manager';

export class Activator implements BundleActivator {
  private context: BundleContext;
  private loggerReference: ServiceReference<Logger>;
  private logger: Logger;
  private configManager: ConfigurationManager;
  private configAdmin: ConfigurationAdmin;
  private configAdminRegistration: ServiceRegistration<ConfigurationAdmin>;
  private filterParser: FilterParser;
  private filterParserReference: ServiceReference<FilterParser>;
  private persistenceManagerReference?: ServiceReference<PersistenceManager>;
  private persistenceManager: PersistenceManager;
  private pmUsed = false;
  private pmListener: ServiceListener;

  start(context: BundleContext): Promise<void> {
    this.context = context;
    this.loggerReference = context.getServiceReference<Logger>('@pandino/pandino/Logger');
    this.logger = context.getService<Logger>(this.loggerReference);
    this.filterParserReference = context.getServiceReference<FilterParser>(FRAMEWORK_FILTER_PARSER);
    this.filterParser = context.getService(this.filterParserReference);

    this.persistenceManagerReference = context.getServiceReference<PersistenceManager>(INTERFACE_KEY);

    if (this.persistenceManagerReference) {
      this.persistenceManager = context.getService(this.persistenceManagerReference);
      this.init(this.persistenceManager);
      this.pmUsed = true;
    } else {
      this.pmListener = {
        isSync: true,
        serviceChanged: (event: ServiceEvent) => {
          if (event.getType() === 'REGISTERED' && !this.pmUsed) {
            this.persistenceManagerReference = event.getServiceReference();
            this.persistenceManager = context.getService(this.persistenceManagerReference);
            this.init(this.persistenceManager);
            this.pmUsed = true;
          } else if (event.getType() === 'UNREGISTERING' && this.pmUsed) {
            context.ungetService(this.persistenceManagerReference);
            context.removeServiceListener(this.configManager);

            if (this.configAdminRegistration) {
              this.configAdminRegistration.unregister();
            }
          }
        },
      };
      this.context.addServiceListener(this.pmListener, `(objectClass=${INTERFACE_KEY})`);
    }

    return Promise.resolve();
  }

  stop(context: BundleContext): Promise<void> {
    context.ungetService(this.loggerReference);
    context.ungetService(this.filterParserReference);
    context.ungetService(this.persistenceManagerReference);
    context.removeServiceListener(this.configManager);

    if (this.configAdminRegistration) {
      this.configAdminRegistration.unregister();
    }

    if (this.pmListener) {
      context.removeServiceListener(this.pmListener);
    }

    return Promise.resolve();
  }

  private init(pm: PersistenceManager): void {
    if (!this.pmUsed) {
      this.configManager = new ConfigurationManager(this.context, this.logger, this.filterParser, pm);
      this.configAdmin = new ConfigurationAdminImpl(this.configManager, this.context.getBundle(), this.logger);
      this.configAdminRegistration = this.context.registerService<ConfigurationAdmin>(
        CONFIG_ADMIN_INTERFACE_KEY,
        this.configAdmin,
      );
      this.context.addServiceListener(this.configManager);
    } else {
      this.logger.warn(`Tried to re-start Configuration Admin while is already in use. Ignoring`);
    }
  }

  static getLocation(bundle: Bundle): string {
    return bundle.getLocation();
  }
}
