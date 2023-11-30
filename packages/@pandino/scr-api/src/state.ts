import type { BundleContext } from '@pandino/pandino-api';
import { COMPONENT_REGISTRAR_INTERFACE_KEY } from './constants';
import type { ComponentRegistrar } from './interfaces';
import type { DecoratedQueue } from './DecoratedQueue';
import { DecoratedQueueImpl } from './DecoratedQueue';

export const decoratedQueue: DecoratedQueue = new DecoratedQueueImpl();

export function registerDecoratorHandler(bundleContext: BundleContext): () => void {
  const registrarReference = bundleContext.getServiceReference<ComponentRegistrar>(COMPONENT_REGISTRAR_INTERFACE_KEY);
  let registrar: ComponentRegistrar | undefined;
  if (registrarReference) {
    registrar = bundleContext.getService<ComponentRegistrar>(registrarReference);
    if (registrar) {
      decoratedQueue.init(bundleContext, registrar);
    }
  }
  return () => {
    if (registrarReference) {
      try {
        bundleContext.ungetService(registrarReference);
      } catch (e) {
        console.error(e);
      }
    }
  };
}
