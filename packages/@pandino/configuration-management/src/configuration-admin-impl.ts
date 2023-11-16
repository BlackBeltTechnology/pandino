import type { Configuration, ConfigurationAdmin } from '@pandino/configuration-management-api';
import type { Bundle, Logger } from '@pandino/pandino-api';
import { ConfigurationManager } from './configuration-manager';

export class ConfigurationAdminImpl implements ConfigurationAdmin {
  // @ts-ignore
  private readonly bundle: Bundle;
  // @ts-ignore
  private readonly logger: Logger;
  private readonly configurationManager: ConfigurationManager;

  constructor(configurationManager: ConfigurationManager, bundle: Bundle, logger: Logger) {
    this.configurationManager = configurationManager;
    this.bundle = bundle;
    this.logger = logger;
  }

  getConfiguration(pid: string, location?: string): Configuration {
    let config = this.configurationManager.getConfiguration(pid);
    if (!config) {
      config = this.configurationManager.createConfiguration(pid, location);
    }
    return config;
  }

  listConfigurations(filter?: string): Configuration[] {
    return this.configurationManager.listConfigurations(filter);
  }
}
