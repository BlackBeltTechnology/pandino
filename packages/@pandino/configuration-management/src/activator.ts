import {
  Bundle,
  BundleActivator,
  BundleContext,
  FilterParser,
  FRAMEWORK_FILTER_PARSER,
  FRAMEWORK_LOGGER,
  FRAMEWORK_SEMVER_FACTORY,
  Logger,
  OBJECTCLASS,
  SemverFactory,
  ServiceEvent,
  ServiceListener,
  ServiceReference,
  ServiceRegistration,
} from '@pandino/pandino-api';
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
  private filterParser: FilterParser;
  private filterParserReference: ServiceReference<FilterParser>;
  private persistenceManagerReference?: ServiceReference<PersistenceManager>;
  private persistenceManager: PersistenceManager;
  private semVerFactoryReference?: ServiceReference<SemverFactory>;
  private semVerFactory: SemverFactory;
  private pmUsed = false;
  private pmListener: ServiceListener;

  async start(context: BundleContext): Promise<void> {
    this.context = context;
    this.loggerReference = context.getServiceReference<Logger>(FRAMEWORK_LOGGER);
    this.logger = context.getService<Logger>(this.loggerReference);
    this.filterParserReference = context.getServiceReference<FilterParser>(FRAMEWORK_FILTER_PARSER);
    this.filterParser = context.getService(this.filterParserReference);
    this.semVerFactoryReference = context.getServiceReference<SemverFactory>(FRAMEWORK_SEMVER_FACTORY);
    this.semVerFactory = context.getService(this.semVerFactoryReference);

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
    context.ungetService(this.semVerFactoryReference);
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
      this.configManager = new ConfigurationManager(
        this.context,
        this.logger,
        this.filterParser,
        pm,
        this.semVerFactory,
      );
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
