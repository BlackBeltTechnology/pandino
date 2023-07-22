import {
  Bundle,
  BundleActivator,
  BundleContext,
  FRAMEWORK_EVALUATE_FILTER,
  FRAMEWORK_LOGGER,
  Logger,
  OBJECTCLASS,
  ServiceEvent,
  ServiceListener,
  ServiceReference,
  ServiceRegistration,
} from '@pandino/pandino-api';
import type { FilterEvaluator } from '@pandino/filters';
import { ConfigurationAdmin, CONFIG_ADMIN_INTERFACE_KEY } from '@pandino/configuration-management-api';
import { INTERFACE_KEY, PersistenceManager } from '@pandino/persistence-manager-api';
import { ConfigurationAdminImpl } from './configuration-admin-impl';
import { ConfigurationManager } from './configuration-manager';

/* istanbul ignore file */
export class Activator implements BundleActivator {
  private context: BundleContext;
  private loggerReference: ServiceReference<Logger>;
  private logger: Logger;
  private configManager: ConfigurationManager;
  private configAdmin: ConfigurationAdmin;
  private configAdminRegistration: ServiceRegistration<ConfigurationAdmin>;
  private evaluateFilter: FilterEvaluator;
  private filterParserReference: ServiceReference<FilterEvaluator>;
  private persistenceManagerReference?: ServiceReference<PersistenceManager>;
  private persistenceManager: PersistenceManager;
  private pmUsed = false;
  private pmListener: ServiceListener;

  async start(context: BundleContext): Promise<void> {
    this.context = context;
    this.loggerReference = context.getServiceReference<Logger>(FRAMEWORK_LOGGER);
    this.logger = context.getService<Logger>(this.loggerReference);
    this.filterParserReference = context.getServiceReference<FilterEvaluator>(FRAMEWORK_EVALUATE_FILTER);
    this.evaluateFilter = context.getService(this.filterParserReference);

    this.persistenceManagerReference = context.getServiceReference<PersistenceManager>(INTERFACE_KEY);

    if (this.persistenceManagerReference) {
      this.logger.info(
        `Activating Configuration Management with immediate Persistence Manager Reference: ${this.persistenceManagerReference.getProperty(
          OBJECTCLASS,
        )}`,
      );
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
      this.logger.info(`Configuration Management activation delayed, waiting for a Persistence Manager Reference...`);
      this.context.addServiceListener(this.pmListener, `(objectClass=${INTERFACE_KEY})`);
    }
  }

  async stop(context: BundleContext): Promise<void> {
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
  }

  private init(pm: PersistenceManager): void {
    this.logger.info(`Initializing Configuration Management...`);
    if (!this.pmUsed) {
      this.configManager = new ConfigurationManager(this.context, this.logger, this.evaluateFilter, pm);
      this.configAdmin = new ConfigurationAdminImpl(this.configManager, this.context.getBundle(), this.logger);
      this.configAdminRegistration = this.context.registerService<ConfigurationAdmin>(
        CONFIG_ADMIN_INTERFACE_KEY,
        this.configAdmin,
      );
      this.configManager.initReferencesAddedBeforeManagerActivation();
      this.context.addServiceListener(this.configManager);
    } else {
      this.logger.warn(`Tried to re-start Configuration Admin while is already in use. Ignoring`);
    }
  }

  static getLocation(bundle: Bundle): string {
    return bundle.getLocation();
  }
}
