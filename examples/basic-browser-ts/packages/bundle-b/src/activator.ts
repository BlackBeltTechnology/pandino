import { BundleActivator, BundleContext } from '@pandino/pandino-api';
import { STRING_INVERTER, StringInverter } from './string-inverter';
import { stringInverterImpl } from './string-inverter-impl';

export class BundleBActivator implements BundleActivator {
  async start(context: BundleContext): Promise<void> {
    context.registerService<StringInverter>(STRING_INVERTER, stringInverterImpl);
  }

  async stop(context: BundleContext): Promise<void> {}
}
