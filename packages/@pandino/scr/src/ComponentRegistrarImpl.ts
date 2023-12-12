import type { ComponentRegistrar } from '@pandino/scr-api';
import type { BundleContext } from '@pandino/pandino-api';
import type { ServiceComponentRuntime } from './ServiceComponentRuntime';

export class ComponentRegistrarImpl implements ComponentRegistrar {
  private readonly scr: ServiceComponentRuntime;

  constructor(scr: ServiceComponentRuntime) {
    this.scr = scr;
  }

  registerComponent(target: any, bundleContext: BundleContext): void {
    this.scr.processComponent(target, bundleContext);
  }
}
