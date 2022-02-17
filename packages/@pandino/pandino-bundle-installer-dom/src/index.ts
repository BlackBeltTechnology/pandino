import {
  BundleActivator,
  BundleContext,
  DEPLOYMENT_ROOT_PROP,
  ManifestFetcher,
  ServiceReference,
} from '@pandino/pandino-api';

export default class PandinoBundleInstallerDomActivator implements BundleActivator {
  private context: BundleContext;
  private observer: MutationObserver;
  private fetcherReference: ServiceReference<ManifestFetcher>;
  private fetcher: ManifestFetcher;
  private installedManifestList: string[] = [];

  async start(context: BundleContext): Promise<void> {
    this.context = context;
    this.fetcherReference = context.getServiceReference<ManifestFetcher>('@pandino/pandino/ManifestFetcher');
    this.fetcher = context.getService<ManifestFetcher>(this.fetcherReference);
    this.registerDocumentDefinedManifests();
  }

  stop(context: BundleContext): Promise<void> {
    context.ungetService(this.fetcherReference);
    this.observer.disconnect();

    return Promise.resolve();
  }

  async registerDocumentDefinedManifests(): Promise<void> {
    const documentDefinedManifest = document.querySelector('script[type="pandino-manifests"]');
    if (!documentDefinedManifest) {
      throw new Error(`Cannot find manifests definition for selector: 'script[type="pandino-manifests"]'!`);
    }

    const config = {
      attributes: true,
      childList: true,
      characterData: true,
    };

    let locations: string[];

    const callback = async () => {
      if (documentDefinedManifest.hasAttribute('src')) {
        locations = await this.fetcher.fetch(
          this.context.getProperty(DEPLOYMENT_ROOT_PROP),
          documentDefinedManifest.getAttribute('src'),
        );
      } else {
        locations = documentDefinedManifest ? JSON.parse(documentDefinedManifest.textContent) : [];
      }

      const installList = locations.filter(
        (manifestLocation) => !this.installedManifestList.includes(manifestLocation),
      );
      const uninstallList = this.installedManifestList.filter(
        (manifestLocation) => !locations.includes(manifestLocation),
      );

      await Promise.all(uninstallList.map((manifestLocation) => this.uninstall(manifestLocation)));
      await Promise.all(installList.map((manifestLocation) => this.install(manifestLocation)));

      this.installedManifestList = [...locations];
    };

    await callback();

    this.observer = new MutationObserver(callback);
    this.observer.observe(documentDefinedManifest.childNodes[0], config);
  }

  async install(path: string): Promise<void> {
    await this.context.installBundle(path);
  }

  async uninstall(path: string): Promise<void> {
    const bundle = this.context.getBundles().find((bundle) => path === bundle.getLocation());
    if (bundle) {
      await bundle.uninstall();
    }
  }
}
