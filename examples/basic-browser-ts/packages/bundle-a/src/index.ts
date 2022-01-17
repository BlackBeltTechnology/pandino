import { BundleActivator, BundleContext, Logger, ServiceReference } from '@pandino/pandino-api';
import { StringInverter } from 'bundle-b';

export default class BundleAActivator implements BundleActivator {
  private loggerReference: ServiceReference<Logger>;
  private logger: Logger;
  private inverterReference: ServiceReference<StringInverter>;
  private inverter: StringInverter;

  async start(context: BundleContext): Promise<void> {
    this.loggerReference = context.getServiceReference<Logger>('@pandino/pandino/Logger');
    this.logger = context.getService(this.loggerReference);
    this.inverterReference = context.getServiceReference<StringInverter>('@pandino/bundle-b/StringInverter');

    if (this.inverterReference) {
      this.inverter = context.getService(this.inverterReference);

      this.logger.log('Bundle A - Activator');

      this.logger.log(`Testing inverter: ${this.inverter('Please invert this!')}`);
    }

    return Promise.resolve();
  }

  stop(context: BundleContext): Promise<void> {
    context.ungetService(this.loggerReference);
    context.ungetService(this.inverterReference);
    return Promise.resolve();
  }
}
