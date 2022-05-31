import { ServiceObjects, ServiceReference } from '@pandino/pandino-api';
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

  getService(): S {
    this.context.checkValidity();

    return this.pandino.getService(this.context.getBundle(), this.ref, true);
  }

  getServiceReference(): ServiceReference<S> {
    return this.ref;
  }

  ungetService(service: S): void {
    this.context.checkValidity();
  }
}
