import type { BundleContext, Logger, ServiceRegistration, ServiceUtils } from '@pandino/pandino-api';
import { SERVICE_PID } from '@pandino/pandino-api';
import {
  CONFIGURATION_LISTENER_INTERFACE_KEY,
  type ConfigurationAdmin,
  type ConfigurationListener,
  MANAGED_SERVICE_INTERFACE_KEY,
} from '@pandino/configuration-management-api';
import {
  $$PANDINO_META,
  COMPONENT_KEY_CONFIGURATION_PID,
  COMPONENT_KEY_CONFIGURATION_POLICY,
  type ComponentConfiguration,
  type InternalMetaData,
} from '@pandino/scr-api';
import type { ServiceComponentRuntime } from './ServiceComponentRuntime';
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
    if (target.prototype[$$PANDINO_META]) {
      const rawData: InternalMetaData = target.prototype[$$PANDINO_META];
      const pid = rawData[COMPONENT_KEY_CONFIGURATION_PID];
      const pids: string[] = Array.isArray(pid) ? pid : [pid];

      for (const p of pids) {
        const componentConfiguration = new ComponentConfigurationImpl(p, rawData, target, bundleContext, this.configAdmin, this.logger, this.serviceUtils);
        this.configurations.set(target, componentConfiguration);
        if (rawData[COMPONENT_KEY_CONFIGURATION_POLICY] !== 'IGNORE') {
          const listenerRegistration = bundleContext.registerService(
            [MANAGED_SERVICE_INTERFACE_KEY, CONFIGURATION_LISTENER_INTERFACE_KEY],
            componentConfiguration,
            {
              [SERVICE_PID]: p,
            },
          );
          this.configurationListenerRegistrations.set(target, listenerRegistration);
        }
      }
    }
  }

  releaseComponent(config: ComponentConfiguration<any>): void {
    const ref = config.getService();
    if (ref) {
      try {
        (config as ComponentConfigurationImpl<any>).deactivate('BUNDLE_STOPPED');
      } catch (e) {
        this.logger.error(`Error releasing component: ${e}`);
      }
    }
  }

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
