import { FRAMEWORK_LOGGER } from '@pandino/pandino-api';
import type { BundleActivator, BundleContext, Logger, ServiceReference, ServiceRegistration } from '@pandino/pandino-api';
import { INTERFACE_KEY, SERVICE_DISCRIMINATOR_PROPERTY } from '@pandino/persistence-manager-api';
import type { PersistenceManager } from '@pandino/persistence-manager-api';
import { LocalstoragePersistenceManager } from './service';
import { PM_MANAGED_KEYS_KEY } from './constants';

export class Activator implements BundleActivator {
  private serviceRegistration?: ServiceRegistration<PersistenceManager>;
  private service?: PersistenceManager;
  private loggerReference?: ServiceReference<Logger>;
  private logger?: Logger;
  private managedKeysKey?: string;

  async start(context: BundleContext): Promise<void> {
    this.managedKeysKey = context.getProperty('persistence-manager-managed-keys') || PM_MANAGED_KEYS_KEY;
    this.loggerReference = context.getServiceReference<Logger>(FRAMEWORK_LOGGER)!;
    this.logger = context.getService<Logger>(this.loggerReference)!;
    this.service = new LocalstoragePersistenceManager(window.localStorage, this.managedKeysKey, this.logger)!;
    this.serviceRegistration = context.registerService<PersistenceManager>(INTERFACE_KEY, this.service, {
      [SERVICE_DISCRIMINATOR_PROPERTY]: 'dom-localstorage',
    });
  }

  async stop(context: BundleContext): Promise<void> {
    if (this.loggerReference) {
      context.ungetService(this.loggerReference);
    }
    if (this.serviceRegistration) {
      this.serviceRegistration.unregister();
    }
  }
}
