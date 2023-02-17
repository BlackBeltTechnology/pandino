import type { BundleActivator, BundleContext, ServiceRegistration } from '@pandino/pandino-api';
import { CUSTOM_COMPONENT_INTERFACE_KEY } from '@react-esm/component-api';
import type { CustomComponent } from '@react-esm/component-api';
import { ComponentOne } from './ComponentOne';

export default class AboutPageActivator implements BundleActivator {
  private componentRegistration?: ServiceRegistration<CustomComponent>;

  async start(context: BundleContext) {
    this.componentRegistration = context.registerService<CustomComponent>(CUSTOM_COMPONENT_INTERFACE_KEY, ComponentOne);
  }

  async stop(context: BundleContext) {
    this.componentRegistration?.unregister();
  }
}
