import { BundleActivator, BundleContext, Logger, ManifestFetcher, ServiceReference } from '@pandino/pandino-api';
import { InstallerService } from './installer-service';

export class Activator implements BundleActivator {
  private context: BundleContext;
  private fetcherReference: ServiceReference<ManifestFetcher>;
  private fetcher: ManifestFetcher;
  private loggerReference: ServiceReference<Logger>;
  private logger: Logger;
  private installerService: InstallerService;

  async start(context: BundleContext): Promise<void> {
    this.context = context;
    this.loggerReference = context.getServiceReference<Logger>('@pandino/pandino/Logger');
    this.logger = context.getService<Logger>(this.loggerReference);
    this.fetcherReference = context.getServiceReference<ManifestFetcher>('@pandino/pandino/ManifestFetcher');
    this.fetcher = context.getService<ManifestFetcher>(this.fetcherReference);
    this.installerService = new InstallerService(
      this.context.getProperty('pandino.deployment.root'),
      this.context,
      this.logger,
    );
    this.installerService.watch();
  }

  async stop(context: BundleContext): Promise<void> {
    if (this.installerService) {
      this.installerService.stopWatch();
    }
    context.ungetService(this.fetcherReference);
    context.ungetService(this.loggerReference);
  }
}
