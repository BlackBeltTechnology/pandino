import { Configuration, ConfigurationAdmin } from '@pandino/pandino-configuration-management-api';
import { Bundle, Logger } from '@pandino/pandino-api';
import { ConfigurationManager } from './configuration-manager';

export class ConfigurationAdminImpl implements ConfigurationAdmin {
  private configurationManager: ConfigurationManager;
  private bundle: Bundle;
  private logger: Logger;

  constructor(configurationManager: ConfigurationManager, bundle: Bundle, logger: Logger) {
    this.configurationManager = configurationManager;
    this.bundle = bundle;
    this.logger = logger;
  }

  getConfiguration(pid: string, location?: string): Configuration {
    throw new Error('Not implemented yet');
  }

  listConfigurations(filter?: string): Configuration[] {
    return [];
  }

  dispose(): void {
    this.bundle = undefined;
    this.configurationManager = undefined;
  }

  getBundle(): Bundle {
    return this.bundle;
  }

  private getConfigurationManager(): ConfigurationManager {
    if (!this.configurationManager) {
      throw new Error('Configuration Admin service has been unregistered');
    }

    return this.configurationManager;
  }
}
