import type { BundleActivator, BundleContext, ServiceRegistration } from '@pandino/pandino-api';
import type { Page } from '@custom-elements-web-ts/contract';
import { PAGE_INTERFACE_KEY } from '@custom-elements-web-ts/contract';
import { HiddenPageService } from './HiddenPage';

export default class AboutPageActivator implements BundleActivator {
  private pageReg: ServiceRegistration<Page>;

  async start(context: BundleContext) {
    this.pageReg = context.registerService<Page>(PAGE_INTERFACE_KEY, new HiddenPageService());
  }

  async stop(context: BundleContext) {
    this.pageReg.unregister();
  }
}
