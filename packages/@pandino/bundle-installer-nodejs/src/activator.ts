import { DEPLOYMENT_ROOT_PROP, FRAMEWORK_LOGGER, FRAMEWORK_MANIFEST_FETCHER } from '@pandino/pandino-api';
import type { BundleActivator, BundleContext, Logger, ManifestFetcher, ServiceReference } from '@pandino/pandino-api';
import { InstallerService } from './installer-service';

export class Activator implements BundleActivator {
  private context?: BundleContext;
  private fetcherReference?: ServiceReference<ManifestFetcher>;
  // @ts-ignore
  private fetcher?: ManifestFetcher;
  private loggerReference?: ServiceReference<Logger>;
  private logger?: Logger;
  private installerService?: InstallerService;

  async start(context: BundleContext): Promise<void> {
    this.context = context;
    this.loggerReference = context.getServiceReference<Logger>(FRAMEWORK_LOGGER)!;
    this.logger = context.getService<Logger>(this.loggerReference)!;
    this.fetcherReference = context.getServiceReference<ManifestFetcher>(FRAMEWORK_MANIFEST_FETCHER)!;
    this.fetcher = context.getService<ManifestFetcher>(this.fetcherReference)!;
    this.installerService = new InstallerService(this.context.getProperty(DEPLOYMENT_ROOT_PROP), this.context, this.logger);
    this.installerService.watch();
  }

  async stop(context: BundleContext): Promise<void> {
    if (this.installerService) {
      this.installerService.stopWatch();
    }
    if (this.fetcherReference) {
      context.ungetService(this.fetcherReference);
    }
    if (this.loggerReference) {
      context.ungetService(this.loggerReference);
    }
  }
}
