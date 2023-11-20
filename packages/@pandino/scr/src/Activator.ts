import { FRAMEWORK_LOGGER, FRAMEWORK_SERVICE_UTILS, ServiceUtils } from '@pandino/pandino-api';
import type { BundleActivator, BundleContext, Logger, ServiceReference, ServiceRegistration } from '@pandino/pandino-api';
import type { ServiceComponentRuntime } from './ServiceComponentRuntime';
import { ServiceComponentRuntimeImpl } from './ServiceComponentRuntimeImpl';
import { SCR_INTERFACE_KEY } from './constants';
import { CONFIG_ADMIN_INTERFACE_KEY } from '@pandino/configuration-management-api';
import type { ConfigurationAdmin } from '@pandino/configuration-management-api';
import { ComponentRegistrarImpl } from './ComponentRegistrarImpl';
import { COMPONENT_REGISTRAR_INTERFACE_KEY } from '@pandino/scr-api';
import type { ComponentRegistrar } from '@pandino/scr-api';

export class Activator implements BundleActivator {
  private serviceRegistration?: ServiceRegistration<ServiceComponentRuntime>;
  private service?: ServiceComponentRuntime;
  private componentRegistrarRegistration?: ServiceRegistration<ComponentRegistrar>;
  private componentRegistrar?: ComponentRegistrar;
  private loggerReference?: ServiceReference<Logger>;
  private logger?: Logger;
  private serviceUtilsReference?: ServiceReference<ServiceUtils>;
  private serviceUtils?: ServiceUtils;
  private configAdminReference?: ServiceReference<ConfigurationAdmin>;
  private configAdmin?: ConfigurationAdmin;

  async start(context: BundleContext) {
    this.loggerReference = context.getServiceReference<Logger>(FRAMEWORK_LOGGER)!;
    this.logger = context.getService<Logger>(this.loggerReference)!;
    this.configAdminReference = context.getServiceReference<ConfigurationAdmin>(CONFIG_ADMIN_INTERFACE_KEY)!;
    this.configAdmin = context.getService<ConfigurationAdmin>(this.configAdminReference)!;
    this.serviceUtilsReference = context.getServiceReference<ServiceUtils>(FRAMEWORK_SERVICE_UTILS)!;
    this.serviceUtils = context.getService<ServiceUtils>(this.serviceUtilsReference)!;
    this.service = new ServiceComponentRuntimeImpl(context, this.logger, this.configAdmin, this.serviceUtils);
    this.serviceRegistration = context.registerService<ServiceComponentRuntime>(SCR_INTERFACE_KEY, this.service, {});
    this.componentRegistrar = new ComponentRegistrarImpl(this.service);
    this.componentRegistrarRegistration = context.registerService<ComponentRegistrar>(COMPONENT_REGISTRAR_INTERFACE_KEY, this.componentRegistrar);

    try {
      this.service.processComponents();
    } catch (e: any) {
      this.logger.error(e);
    }
  }

  async stop(context: BundleContext) {
    try {
      this.service?.releaseComponents();
    } catch (e: any) {
      this.logger?.error(e);
    }
    if (this.loggerReference) {
      context.ungetService(this.loggerReference);
    }
    if (this.serviceUtilsReference) {
      context.ungetService(this.serviceUtilsReference);
    }
    if (this.configAdminReference) {
      context.ungetService(this.configAdminReference);
    }
    this.serviceRegistration?.unregister();
    this.componentRegistrarRegistration?.unregister();
  }
}
