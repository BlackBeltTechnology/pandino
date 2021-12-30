import { BundleActivator, BundleContext, Fetcher, ServiceReference } from '@pandino/pandino-api';

export default class PandinoExtraDocumentManifestsActivator implements BundleActivator {
  private fetcherReference: ServiceReference<Fetcher>;
  private fetcher: Fetcher;

  async start(context: BundleContext): Promise<void> {
    this.fetcherReference = context.getServiceReference<Fetcher>('io.pandino.fetcher');
    this.fetcher = context.getService<Fetcher>(this.fetcherReference);
    await this.registerDocumentDefinedManifests(context);
    return Promise.resolve();
  }

  stop(context: BundleContext): Promise<void> {
    return Promise.resolve();
  }

  async registerDocumentDefinedManifests(context: BundleContext): Promise<void> {
    const documentDefinedManifest = document.querySelector('script[type="pandino-manifests"]');
    let locations: string[];
    if (documentDefinedManifest.hasAttribute('src')) {
      locations = await this.fetcher(documentDefinedManifest.getAttribute('src'));
    } else {
      locations = documentDefinedManifest ? JSON.parse(documentDefinedManifest.textContent) : [];
    }
    await Promise.all(locations.map((manifestLocation) => context.installBundle(manifestLocation)));
    return Promise.resolve();
  }
}
