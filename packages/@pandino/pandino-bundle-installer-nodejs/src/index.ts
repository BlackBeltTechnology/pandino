import { BundleActivator, BundleContext, Logger, ServiceReference, ServiceRegistration } from '@pandino/pandino-api';
import { INTERFACE_KEY, SERVICE_DISCRIMINATOR_PROPERTY } from '@pandino/pandino-bundle-installer-api';
import { InstallerServiceApi } from './installer-service-api';
import { InstallerService } from './installer-service';

export default class PandinoBundleInstallerNodeJSActivator implements BundleActivator {
  private context: BundleContext;
  // private fetcherReference: ServiceReference<ManifestFetcher>;
  // private fetcher: ManifestFetcher;
  private loggerReference: ServiceReference<Logger>;
  private logger: Logger;
  private installerRegistration: ServiceRegistration<InstallerServiceApi>;

  async start(context: BundleContext): Promise<void> {
    this.context = context;
    this.loggerReference = context.getServiceReference<Logger>('@pandino/pandino/Logger');
    this.logger = context.getService<Logger>(this.loggerReference);
    // this.fetcherReference = context.getServiceReference<ManifestFetcher>('@pandino/pandino/ManifestFetcher');
    // this.fetcher = context.getService<ManifestFetcher>(this.fetcherReference);

    this.installerRegistration = context.registerService(
      INTERFACE_KEY,
      new InstallerService(this.context.getProperty('pandino.deployment.root'), this.context, this.logger),
      {
        [SERVICE_DISCRIMINATOR_PROPERTY]: 'nodejs',
      },
    );
  }

  async stop(context: BundleContext): Promise<void> {
    // context.ungetService(this.fetcherReference);
    context.ungetService(this.loggerReference);
    this.installerRegistration.unregister();
  }
}
