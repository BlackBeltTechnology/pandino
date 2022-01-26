import {
  Bundle,
  BundleActivator,
  BundleContext,
  FilterParser,
  FRAMEWORK_FILTER_PARSER,
  Logger,
  ServiceReference,
  ServiceRegistration,
} from '@pandino/pandino-api';
import { ConfigurationAdmin } from '@pandino/pandino-configuration-management-api';
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

  start(context: BundleContext): Promise<void> {
    this.context = context;
    this.loggerReference = context.getServiceReference<Logger>('@pandino/pandino/Logger');
    this.logger = context.getService<Logger>(this.loggerReference);
    this.filterParserReference = context.getServiceReference<FilterParser>(FRAMEWORK_FILTER_PARSER);
    this.filterParser = context.getService(this.filterParserReference);
    this.configManager = new ConfigurationManager(this.context, this.logger, this.filterParser);
    this.configAdmin = new ConfigurationAdminImpl(this.configManager, context.getBundle(), this.logger);
    context.addServiceListener(this.configManager);
    this.configAdminRegistration = context.registerService<ConfigurationAdmin>(
      '@pandino/pandino-configuration-management-api/ConfigurationAdmin',
      this.configAdmin,
    );

    return Promise.resolve();
  }

  stop(context: BundleContext): Promise<void> {
    context.ungetService(this.loggerReference);
    context.ungetService(this.filterParserReference);
    context.removeServiceListener(this.configManager);

    if (this.configAdminRegistration) {
      this.configAdminRegistration.unregister();
    }

    return Promise.resolve();
  }

  static getLocation(bundle: Bundle): string {
    return bundle.getLocation();
  }
}
