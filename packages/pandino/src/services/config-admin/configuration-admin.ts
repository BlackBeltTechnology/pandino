import type { OSGiFramework } from '../../framework/framework';
import { LdapFilterService } from '../../framework/interfaces';
import {
  Configuration,
  ConfigurationAdmin,
  ManagedService,
  ManagedServiceFactory,
  ConfigurationEvent,
  ConfigurationListener,
  ConfigurationEventType,
} from './interfaces';

export class SimpleEventEmitter {
  private listeners = new Map<string, Function[]>();

  on(event: string, listener: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);
  }

  emit(event: string, ...args: any[]): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      for (const listener of eventListeners) {
        listener(...args);
      }
    }
  }

  removeListener(event: string, listener: Function): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(listener);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }
}

class ConfigurationEventImpl implements ConfigurationEvent {
  constructor(
    private pid: string,
    private factoryPid: string | null,
    private type: ConfigurationEventType,
  ) {}

  getPid(): string {
    return this.pid;
  }

  getFactoryPid(): string | null {
    return this.factoryPid;
  }

  getType(): ConfigurationEventType {
    return this.type;
  }
}

export class ConfigurationAdminImpl extends SimpleEventEmitter implements ConfigurationAdmin {
  private configurations = new Map<string, ConfigurationImpl>();
  private factoryConfigurations = new Map<string, ConfigurationImpl>();
  private configCounter = 0;
  private readonly ldapFilterService: LdapFilterService | null = null;
  private configListeners: ConfigurationListener[] = [];

  constructor(private framework: OSGiFramework) {
    super();
    const serviceRef = this.framework.getBundleContext().getServiceReference<LdapFilterService>('LdapFilterService');
    if (serviceRef) {
      this.ldapFilterService = this.framework.getBundleContext().getService(serviceRef);
    }

    this.framework.getBundleContext().addServiceListener(
      {
        serviceChanged: (event) => {
          const objectClass = event.getServiceReference().getProperty('objectClass');
          const isConfigListener = Array.isArray(objectClass)
            ? objectClass.includes('ConfigurationListener')
            : objectClass === 'ConfigurationListener';

          if (isConfigListener) {
            if (event.getType() === 1) {
              // REGISTERED
              const listener = this.framework
                .getBundleContext()
                .getService<ConfigurationListener>(event.getServiceReference());
              if (listener) {
                this.configListeners.push(listener);
              }
            } else if (event.getType() === 2) {
              // UNREGISTERING
              const listener = this.framework
                .getBundleContext()
                .getService<ConfigurationListener>(event.getServiceReference());
              if (listener) {
                const index = this.configListeners.indexOf(listener);
                if (index !== -1) {
                  this.configListeners.splice(index, 1);
                }
              }
            }
          }
        },
      },
      '(objectClass=ConfigurationListener)',
    );

    const listenerRefs = this.framework.getBundleContext().getServiceReferences('ConfigurationListener');

    if (listenerRefs) {
      for (const ref of listenerRefs) {
        const listener = this.framework.getBundleContext().getService<ConfigurationListener>(ref);
        if (listener) {
          this.configListeners.push(listener);
        }
      }
    }

    // Deliver an existing configuration to a ManagedService/ManagedServiceFactory
    // that registers AFTER the configuration was created (OSGi CM tracks these).
    this.framework.getBundleContext().addServiceListener({
      serviceChanged: (event) => {
        if (event.getType() !== 1) return; // REGISTERED only
        const ref = event.getServiceReference();
        const objectClass = ref.getProperty('objectClass');
        const classes = Array.isArray(objectClass) ? objectClass : [objectClass];
        if (classes.includes('ManagedService')) {
          void this.deliverExistingToManagedService(ref);
        }
        if (classes.includes('ManagedServiceFactory')) {
          void this.deliverExistingToManagedServiceFactory(ref);
        }
      },
    });
  }

  private locationMatches(config: ConfigurationImpl, ref: { getProperty(k: string): any }): boolean {
    const configLocation = config.getBundleLocation();
    return configLocation === null || ref.getProperty('bundle.location') === configLocation;
  }

  private async deliverExistingToManagedService(ref: any): Promise<void> {
    const pid = ref.getProperty('service.pid');
    if (!pid) return;
    const config = this.configurations.get(pid);
    if (!config || !this.locationMatches(config, ref)) return;
    const props = config.getProperties();
    if (props === null) return;
    const service = this.framework.getService<ManagedService>(ref);
    if (!service) return;
    try {
      await service.updated({ ...props, 'service.pid': pid });
    } catch (error) {
      this.framework.getLogger().error(`Error delivering configuration to late ManagedService ${pid}:`, error as Error);
    }
  }

  private async deliverExistingToManagedServiceFactory(ref: any): Promise<void> {
    const factoryPid = ref.getProperty('service.pid');
    if (!factoryPid) return;
    const factory = this.framework.getService<ManagedServiceFactory>(ref);
    if (!factory) return;
    for (const config of this.factoryConfigurations.values()) {
      if (config.getFactoryPid() !== factoryPid || !this.locationMatches(config, ref)) continue;
      const props = config.getProperties();
      if (props === null) continue;
      try {
        await factory.updated(config.getPid(), {
          ...props,
          'service.pid': config.getPid(),
          'service.factoryPid': factoryPid,
        });
      } catch (error) {
        this.framework
          .getLogger()
          .error(`Error delivering factory configuration to late ManagedServiceFactory ${factoryPid}:`, error as Error);
      }
    }
  }

  setConfiguration(pid: string, config: ConfigurationImpl): void {
    this.configurations.set(pid, config);
  }

  setFactoryConfiguration(pid: string, config: ConfigurationImpl): void {
    this.factoryConfigurations.set(pid, config);
  }

  async getConfiguration(pid: string, location?: string): Promise<Configuration> {
    let config = this.configurations.get(pid);
    if (!config) {
      config = new ConfigurationImpl(pid, null, location ?? null, this, this.framework);
      this.configurations.set(pid, config);
    }
    return config;
  }

  async createFactoryConfiguration(factoryPid: string, location?: string): Promise<Configuration> {
    const instancePid = `${factoryPid}.${++this.configCounter}`;
    const config = new ConfigurationImpl(instancePid, factoryPid, location ?? null, this, this.framework);
    this.factoryConfigurations.set(instancePid, config);
    return config;
  }

  async listConfigurations(filter?: string): Promise<Configuration[] | null> {
    const allConfigs = [
      ...Array.from(this.configurations.values()),
      ...Array.from(this.factoryConfigurations.values()),
    ];

    if (!filter || !this.ldapFilterService) {
      return allConfigs.length > 0 ? allConfigs : null;
    }

    return allConfigs.filter((config) => this.ldapFilterService!.match(filter, config.getProperties() ?? {}));
  }

  async deleteConfiguration(pid: string): Promise<void> {
    const config = this.configurations.get(pid) || this.factoryConfigurations.get(pid);
    if (config) {
      this.configurations.delete(pid);
      this.factoryConfigurations.delete(pid);
      await this.deliverConfiguration(config, null);

      this.notifyConfigurationListeners(config.getPid(), config.getFactoryPid(), ConfigurationEventType.DELETED);
    }
  }

  notifyConfigurationListeners(pid: string, factoryPid: string | null, type: ConfigurationEventType): void {
    const event = new ConfigurationEventImpl(pid, factoryPid, type);

    if (this.configListeners.length === 0) {
      const listenerRefs = this.framework.getBundleContext().getServiceReferences('ConfigurationListener');

      if (listenerRefs && listenerRefs.length > 0) {
        for (const ref of listenerRefs) {
          const listener = this.framework.getBundleContext().getService<ConfigurationListener>(ref);
          if (listener) {
            this.configListeners.push(listener);
          }
        }
      }
    }

    for (const listener of this.configListeners) {
      try {
        listener.configurationEvent(event);
      } catch (error) {
        this.framework.getLogger().error(`Error notifying ConfigurationListener:`, error as Error);
      }
    }
  }

  async deliverConfiguration(config: Configuration, properties: Record<string, any> | null): Promise<void> {
    const pid = config.getPid();
    const factoryPid = config.getFactoryPid();
    const configBundleLocation = config.getBundleLocation();

    if (factoryPid) {
      const factoryServices = this.framework.getServiceReferences(
        'ManagedServiceFactory',
        `(service.pid=${factoryPid})`,
      );

      const managedServices = this.framework.getServiceReferences(
        'ManagedService',
        `(service.factoryPid=${factoryPid})`,
      );

      for (const serviceRef of factoryServices) {
        if (configBundleLocation !== null) {
          const serviceBundleLocation = serviceRef.getProperty('bundle.location');
          if (serviceBundleLocation !== configBundleLocation) {
            continue; // Skip this service - bundle location doesn't match
          }
        }

        const factory = this.framework.getService<ManagedServiceFactory>(serviceRef);
        if (factory) {
          try {
            if (properties === null) {
              await factory.deleted(pid);
            } else {
              await factory.updated(pid, { ...properties, 'service.pid': pid, 'service.factoryPid': factoryPid });
            }
          } catch (error) {
            this.framework
              .getLogger()
              .error(`Error delivering factory configuration to ${factoryPid}:`, error as Error);
          }
        }
      }

      for (const serviceRef of managedServices) {
        if (configBundleLocation !== null) {
          const serviceBundleLocation = serviceRef.getProperty('bundle.location');
          if (serviceBundleLocation !== configBundleLocation) {
            continue; // Skip this service - bundle location doesn't match
          }
        }

        const service = this.framework.getService<ManagedService>(serviceRef);
        if (service) {
          try {
            await service.updated(
              properties === null ? null : { ...properties, 'service.pid': pid, 'service.factoryPid': factoryPid },
            );
          } catch (error) {
            this.framework
              .getLogger()
              .error(`Error delivering factory configuration to ManagedService ${factoryPid}:`, error as Error);
          }
        }
      }
    } else {
      const services = this.framework.getServiceReferences('ManagedService', `(service.pid=${pid})`);

      for (const serviceRef of services) {
        if (configBundleLocation !== null) {
          const serviceBundleLocation = serviceRef.getProperty('bundle.location');
          if (serviceBundleLocation !== configBundleLocation) {
            continue; // Skip this service - bundle location doesn't match
          }
        }

        const service = this.framework.getService<ManagedService>(serviceRef);
        if (service) {
          try {
            await service.updated(properties === null ? null : { ...properties, 'service.pid': pid });
          } catch (error) {
            this.framework.getLogger().error(`Error delivering configuration to ${pid}:`, error as Error);
          }
        }
      }
    }
  }
}

class ConfigurationImpl implements Configuration {
  private properties: Record<string, any> | null = null;

  constructor(
    private pid: string,
    private factoryPid: string | null,
    private bundleLocation: string | null,
    private configAdmin: ConfigurationAdminImpl,
    private framework: OSGiFramework,
  ) {}

  getPid(): string {
    return this.pid;
  }

  getFactoryPid(): string | null {
    return this.factoryPid;
  }

  getProperties(): Record<string, any> | null {
    return this.properties ? { ...this.properties } : null;
  }

  async update(properties: Record<string, any>): Promise<void> {
    this.properties = { ...properties };

    await this.persist();

    await this.configAdmin.deliverConfiguration(this, this.properties);

    (this.configAdmin as ConfigurationAdminImpl).notifyConfigurationListeners(
      this.pid,
      this.factoryPid,
      ConfigurationEventType.UPDATED,
    );
  }

  async delete(): Promise<void> {
    this.properties = null;
    // deleteConfiguration performs the single null delivery + DELETED notification.
    await this.configAdmin.deleteConfiguration(this.pid);
  }

  getBundleLocation(): string | null {
    return this.bundleLocation;
  }

  async setBundleLocation(location: string | null): Promise<void> {
    this.bundleLocation = location;
    await this.persist();
  }

  private async persist(): Promise<void> {
    // Store configuration in memory
    // In a real implementation, this would persist to disk or database
    // For this example, we'll just ensure the configuration is stored in the ConfigurationAdmin
    if (this.factoryPid) {
      (this.configAdmin as ConfigurationAdminImpl).setFactoryConfiguration(this.pid, this);
    } else {
      (this.configAdmin as ConfigurationAdminImpl).setConfiguration(this.pid, this);
    }
  }
}
