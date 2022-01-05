import { BundleActivator, BundleContext, Logger, ServiceReference } from '@pandino/pandino-api';
import { StringInverter } from './string-inverter';
import { stringInverterImpl } from './string-inverter-impl';

export class BundleBActivator implements BundleActivator {
  private loggerReference: ServiceReference<Logger>;
  private logger: Logger;

  async start(context: BundleContext): Promise<void> {
    this.loggerReference = context.getServiceReference<Logger>('@pandino/pandino/Logger');
    this.logger = context.getService(this.loggerReference);

    this.logger.log('Bundle B - Activator');

    context.registerService<StringInverter>('@pandino/bundle-b/StringInverter', stringInverterImpl);

    return Promise.resolve();
  }

  async stop(context: BundleContext): Promise<void> {
    context.ungetService(this.loggerReference);

    return Promise.resolve();
  }
}
