import { BundleActivator, BundleContext, ServiceReference } from '@pandino/pandino-api';
import { STRING_INVERTER, StringInverter } from 'bundle-b';

export default class BundleAActivator implements BundleActivator {
  private inverterReference: ServiceReference<StringInverter>;
  private inverter: StringInverter;

  async start(context: BundleContext): Promise<void> {
    this.inverterReference = context.getServiceReference<StringInverter>(STRING_INVERTER);

    if (this.inverterReference) {
      this.inverter = context.getService(this.inverterReference);

      console.log(`Testing inverter: ${this.inverter('Please invert this!')}`);
    }
  }

  async stop(context: BundleContext): Promise<void> {
    context.ungetService(this.inverterReference);
  }
}
