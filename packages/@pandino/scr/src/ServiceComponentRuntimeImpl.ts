import type { BundleContext, Logger, ServiceRegistration, ServiceUtils } from '@pandino/pandino-api';
import type { ConfigurationAdmin, ConfigurationListener } from '@pandino/configuration-management-api';
import type { ComponentConfiguration, InternalMetaData } from '@pandino/scr-api';
import type { ServiceComponentRuntime } from './ServiceComponentRuntime';
import { SERVICE_PID } from '@pandino/pandino-api';
import { CONFIGURATION_LISTENER_INTERFACE_KEY } from '@pandino/configuration-management-api';
import { $$PANDINO_META, COMPONENT_KEY_CONFIGURATION_PID } from '@pandino/scr-api';
import { ComponentConfigurationImpl } from './ComponentConfigurationImpl';

export class ServiceComponentRuntimeImpl implements ServiceComponentRuntime {
  // @ts-ignore
  private readonly context: BundleContext;
  private readonly logger: Logger;
  private readonly serviceUtils: ServiceUtils;
  private readonly configAdmin: ConfigurationAdmin;
  private readonly configurationListenerRegistrations: Map<any, ServiceRegistration<ConfigurationListener>> = new Map<
    any,
    ServiceRegistration<ConfigurationListener>
  >();
  private readonly configurations: Map<any, ComponentConfiguration<any>> = new Map<any, ComponentConfiguration<any>>();

  constructor(context: BundleContext, logger: Logger, configAdmin: ConfigurationAdmin, serviceUtils: ServiceUtils) {
    this.context = context;
    this.logger = logger;
    this.configAdmin = configAdmin;
    this.serviceUtils = serviceUtils;
  }

  processComponent(target: any, bundleContext: BundleContext): void {
    if (target[$$PANDINO_META]) {
      const rawData: InternalMetaData = target[$$PANDINO_META];
      const pid = rawData[COMPONENT_KEY_CONFIGURATION_PID];

      if (Array.isArray(pid)) {
        for (const p of pid) {
          const componentConfiguration = new ComponentConfigurationImpl(p, rawData, target, bundleContext, this.configAdmin, this.logger, this.serviceUtils);
          const listenerRegistration = bundleContext.registerService(CONFIGURATION_LISTENER_INTERFACE_KEY, componentConfiguration, {
            [SERVICE_PID]: p,
          });

          this.configurationListenerRegistrations.set(target, listenerRegistration);
          this.configurations.set(target, componentConfiguration);
        }
      } else {
        const componentConfiguration = new ComponentConfigurationImpl(pid, rawData, target, bundleContext, this.configAdmin, this.logger, this.serviceUtils);
        const listenerRegistration = bundleContext.registerService(CONFIGURATION_LISTENER_INTERFACE_KEY, componentConfiguration, {
          [SERVICE_PID]: pid,
        });

        this.configurationListenerRegistrations.set(target, listenerRegistration);
        this.configurations.set(target, componentConfiguration);
      }
    }
  }

  releaseComponent(component: ComponentConfiguration<any>): void {}

  processComponents(): void {}

  releaseComponents(): void {
    for (const [target, config] of this.configurations) {
      try {
        const configListenerReg = this.configurationListenerRegistrations.get(target);
        configListenerReg?.unregister();
        this.releaseComponent(config);
      } catch (e: any) {
        this.logger.error(e);
      }
    }
    this.configurations.clear();
    this.configurationListenerRegistrations.clear();
  }
}
