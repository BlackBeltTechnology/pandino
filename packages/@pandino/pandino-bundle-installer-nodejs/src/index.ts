import { BundleActivator, BundleContext, Logger, ServiceReference, ServiceRegistration } from '@pandino/pandino-api';
import { INSTALLER_SERVICE_PROP, InstallerServiceApi } from './installer-service-api';
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
      INSTALLER_SERVICE_PROP,
      new InstallerService(this.context.getProperty('pandino.deployment.root'), this.context, this.logger),
      {
        'installer-platform': 'nodejs',
      },
    );
  }

  async stop(context: BundleContext): Promise<void> {
    // context.ungetService(this.fetcherReference);
    context.ungetService(this.loggerReference);
    this.installerRegistration.unregister();
  }
}
