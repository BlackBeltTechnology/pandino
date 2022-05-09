import { BundleActivator, BundleContext, ServiceRegistration } from '@pandino/pandino-api';
import { INTERFACE_KEY, PersistenceManager, SERVICE_DISCRIMINATOR_PROPERTY } from '@pandino/persistence-manager-api';
import { InMemoryPersistenceManager } from './service';

export default class Activator implements BundleActivator {
  private serviceRegistration: ServiceRegistration<PersistenceManager>;
  private service: PersistenceManager;

  async start(context: BundleContext): Promise<void> {
    this.service = new InMemoryPersistenceManager();
    this.serviceRegistration = context.registerService<PersistenceManager>(INTERFACE_KEY, this.service, {
      [SERVICE_DISCRIMINATOR_PROPERTY]: 'in-memory',
    });
  }

  async stop(context: BundleContext): Promise<void> {
    if (this.serviceRegistration) {
      this.serviceRegistration.unregister();
    }
  }
}
