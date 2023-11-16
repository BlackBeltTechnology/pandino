import type { ServiceObjects, ServiceReference } from '@pandino/pandino-api';
import { Pandino } from '../../pandino';
import { BundleContextImpl } from './bundle-context-impl';

export class ServiceObjectsImpl<S> implements ServiceObjects<S> {
  private readonly ref: ServiceReference<S>;
  private readonly context: BundleContextImpl;
  private readonly pandino: Pandino;

  constructor(ref: ServiceReference<S>, context: BundleContextImpl, pandino: Pandino) {
    this.ref = ref;
    this.context = context;
    this.pandino = pandino;
  }

  getService(): S | undefined {
    this.context.checkValidity();
    const bundle = this.context.getBundle();
    if (bundle) {
      return this.pandino.getService(bundle, this.ref, true);
    }
    return undefined;
  }

  getServiceReference(): ServiceReference<S> {
    return this.ref;
  }

  ungetService(service: S): void {
    this.context.checkValidity();

    const bundle = this.ref.getBundle();

    if (bundle && !this.pandino.ungetService(bundle, this.ref, service)) {
      throw new Error(`Cannot unget service: ${service}`);
    }
  }
}
