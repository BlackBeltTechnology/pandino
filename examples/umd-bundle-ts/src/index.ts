import { BundleActivator, BundleContext } from '@pandino/pandino-api';

export default class UMDBundle implements BundleActivator {
  async start(context: BundleContext): Promise<void> {
    console.log('Hello from an UMD Bundle!');
  }

  async stop(context: BundleContext): Promise<void> {}
}
