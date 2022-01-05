import { BundleActivator, BundleContext, Fetcher, ServiceReference } from '@pandino/pandino-api';
import { BundleInstaller } from '@pandino/pandino-bundle-installer-api';

export default class PandinoBundleInstallerDomActivator implements BundleActivator, BundleInstaller {
  private context: BundleContext;
  private fetcherReference: ServiceReference<Fetcher>;
  private fetcher: Fetcher;

  async start(context: BundleContext): Promise<void> {
    this.context = context;
    this.fetcherReference = context.getServiceReference<Fetcher>('@pandino/pandino/Fetcher');
    this.fetcher = context.getService<Fetcher>(this.fetcherReference);
    await this.registerDocumentDefinedManifests(); // Not awaiting intentionally
  }

  stop(context: BundleContext): Promise<void> {
    context.ungetService(this.fetcherReference);

    return Promise.resolve();
  }

  async registerDocumentDefinedManifests(): Promise<void> {
    const documentDefinedManifest = document.querySelector('script[type="pandino-manifests"]');
    let locations: string[];
    if (!documentDefinedManifest) {
      throw new Error(`Cannot find manifests definition for selector: 'script[type="pandino-manifests"]'!`);
    }
    if (documentDefinedManifest.hasAttribute('src')) {
      locations = await this.fetcher.fetch(documentDefinedManifest.getAttribute('src'));
    } else {
      locations = documentDefinedManifest ? JSON.parse(documentDefinedManifest.textContent) : [];
    }
    await Promise.all(locations.map((manifestLocation) => this.install(manifestLocation)));
  }

  async install(path: string): Promise<void> {
    await this.context.installBundle(path);
  }

  async uninstall(path: string): Promise<void> {
    // Changing tracking on DOM for manifests is not supported yet
  }

  async update(path: string): Promise<void> {
    // Changing tracking on DOM for manifests is not supported yet
  }
}
