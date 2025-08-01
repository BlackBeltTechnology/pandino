import type { OSGiFramework } from '~/framework/framework';
import type { LdapFilterService } from '~/framework/interfaces';
import type { Configuration, ConfigurationAdmin, ManagedService, ManagedServiceFactory } from './interfaces';

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
      eventListeners.forEach((listener) => listener(...args));
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

export class ConfigurationAdminImpl extends SimpleEventEmitter implements ConfigurationAdmin {
  private configurations = new Map<string, ConfigurationImpl>();
  private factoryConfigurations = new Map<string, ConfigurationImpl>();
  private configCounter = 0;
  private ldapFilterService: LdapFilterService | null = null;

  constructor(private framework: OSGiFramework) {
    super();
    const serviceRef = this.framework.getBundleContext().getServiceReference<LdapFilterService>('LdapFilterService');
    if (serviceRef) {
      this.ldapFilterService = this.framework.getBundleContext().getService(serviceRef);
    }
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

  deleteConfiguration(pid: string): void {
    const config = this.configurations.get(pid) || this.factoryConfigurations.get(pid);
    if (config) {
      this.configurations.delete(pid);
      this.factoryConfigurations.delete(pid);
      this.deliverConfiguration(config, null);
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
              await factory.updated(pid, properties);
            }
          } catch (error) {
            console.error(`Error delivering factory configuration to ${factoryPid}:`, error);
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
            await service.updated(properties);
          } catch (error) {
            console.error(`Error delivering factory configuration to ManagedService ${factoryPid}:`, error);
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
            await service.updated(properties);
          } catch (error) {
            console.error(`Error delivering configuration to ${pid}:`, error);
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
  }

  async delete(): Promise<void> {
    this.properties = null;
    this.configAdmin.deleteConfiguration(this.pid);

    await this.configAdmin.deliverConfiguration(this, null);
  }

  getBundleLocation(): string | null {
    return this.bundleLocation;
  }

  async setBundleLocation(location: string | null): Promise<void> {
    this.bundleLocation = location;
    await this.persist();
  }

  private async persist(): Promise<void> {}
}
