import { ServiceObjects, ServiceReference } from '@pandino/pandino-api';
import { Pandino } from '../../pandino';
import { BundleContextImpl } from './bundle-context-impl';
import { isAllPresent } from '../utils/helpers';

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

    return this.pandino.getService(this.context.getBundle(), this.ref, true);
  }

  getServiceReference(): ServiceReference<S> {
    return this.ref;
  }

  ungetService(service: S): void {
    this.context.checkValidity();

    if (isAllPresent(this.ref.getBundle()) && !this.pandino.ungetService(this.ref.getBundle(), this.ref, service)) {
      throw new Error(`Cannot unget service: ${service}`);
    }
  }
}
