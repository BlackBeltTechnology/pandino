import {
  BundleContext,
  BundleEvent,
  BundleListener,
  ServiceProperties,
  ServiceRegistration,
} from '@pandino/pandino-api';
import { ConfigurationAdmin } from '@pandino/pandino-configuration-management-api';
import { PersistenceManager } from '@pandino/pandino-persistence-manager-api';
import { ConfigurationImpl } from './configuration-impl';

export class ConfigurationManager implements BundleListener {
  private readonly bundleContext: BundleContext;
  private readonly configurationAdminRegistration: ServiceRegistration<ConfigurationAdmin>;
  private readonly serviceProperties: ServiceProperties;
  private readonly persistenceManager: PersistenceManager;
  private readonly configurations: Map<string, ConfigurationImpl> = new Map<string, ConfigurationImpl>();
  private isActive: boolean;

  constructor(persistenceManager: PersistenceManager, bundleContext: BundleContext) {
    this.persistenceManager = persistenceManager;
    this.bundleContext = bundleContext;
  }

  bundleChanged(event: BundleEvent): void {}

  getConfiguration(pid: string): ConfigurationImpl {
    throw new Error('Not yet implemented');
  }
}
