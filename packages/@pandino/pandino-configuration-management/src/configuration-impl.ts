import { PersistenceManager } from '@pandino/pandino-persistence-manager-api';
import { ConfigurationManager } from './configuration-manager';

export class ConfigurationImpl {
  private configurationManager: ConfigurationManager;
  private persistenceManager: PersistenceManager;
  private properties: Record<string, any>;

  constructor(
    configurationManager: ConfigurationManager,
    persistenceManager: PersistenceManager,
    properties: Record<string, any>,
  ) {
    this.configurationManager = configurationManager;
    this.persistenceManager = persistenceManager;
    this.properties = properties;
  }
}
