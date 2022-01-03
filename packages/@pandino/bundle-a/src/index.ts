import { BundleActivator, BundleContext, Fetcher, Logger, ServiceReference } from '@pandino/pandino-api';
import { StringInverter } from '@pandino/bundle-b';

export default class BundleAActivator implements BundleActivator {
  private loggerReference: ServiceReference<Logger>;
  private logger: Logger;
  private fetcherReference: ServiceReference<Fetcher>;
  private fetcher: Fetcher;
  private inverterReference: ServiceReference<StringInverter>;
  private inverter: StringInverter;

  async start(context: BundleContext): Promise<void> {
    this.loggerReference = context.getServiceReference<Logger>('@pandino/pandino/Logger');
    this.logger = context.getService(this.loggerReference);
    this.fetcherReference = context.getServiceReference<Fetcher>('@pandino/pandino/Fetcher');
    this.fetcher = context.getService(this.fetcherReference);
    this.inverterReference = context.getServiceReference<Logger>('@pandino/bundle-b/StringInverter');
    this.inverter = context.getService(this.inverterReference);

    this.logger.log('Bundle A - Activator');

    this.logger.log(`Testing inverter: ${this.inverter('Please invert this!')}`);
    this.testFetch();

    return Promise.resolve();
  }

  stop(context: BundleContext): Promise<void> {
    context.ungetService(this.loggerReference);
    context.ungetService(this.fetcherReference);
    context.ungetService(this.inverterReference);
    return Promise.resolve();
  }

  testFetch() {
    this.fetcher
      .fetch('https://reqres.in/api/users/2')
      .then((res: any) => this.logger.log(JSON.stringify(res.data, null, 4)));
  }
}
