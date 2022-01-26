import {
  BundleContext,
  FilterParser,
  Logger,
  SERVICE_PID,
  ServiceEvent,
  ServiceEventType,
  ServiceListener,
  ServiceReference,
} from '@pandino/pandino-api';
import { ConfigurationImpl } from './configuration-impl';
import {
  ConfigurationEvent,
  ConfigurationEventType,
  ConfigurationListener,
  ManagedService,
} from '@pandino/pandino-configuration-management-api';

export class ConfigurationManager implements ServiceListener {
  isSync: boolean = true;
  private readonly context: BundleContext;
  private readonly logger: Logger;
  private readonly filterParser: FilterParser;
  private readonly configurations: Map<string, ConfigurationImpl> = new Map<string, ConfigurationImpl>();
  private readonly managedReferences: Map<string, ServiceReference<ManagedService>> = new Map<
    string,
    ServiceReference<ManagedService>
  >();
  private readonly eventListeners: Map<string, ConfigurationListener> = new Map<string, ConfigurationListener>();

  constructor(context: BundleContext, logger: Logger, filterParser: FilterParser) {
    this.context = context;
    this.logger = logger;
    this.filterParser = filterParser;
  }

  serviceChanged(event: ServiceEvent): void {
    const reference = event.getServiceReference();
    const refPid = reference.getProperty(SERVICE_PID);
    const service = this.context.getService(reference);
    if (service) {
      if (refPid) {
        const config = this.configurations.has(refPid)
          ? this.configurations.get(refPid)
          : this.internalCreateConfiguration(refPid, reference.getBundle().getLocation());
        this.handleManagedServiceEvent(event.getType(), refPid, reference, service, config);
      } else if (typeof (service as ConfigurationListener).configurationEvent === 'function') {
        const configurationListener: ConfigurationListener = service;
        this.handleConfigurationEventListenerEvent(event.getType(), refPid, configurationListener);
      }
    }
  }

  private handleManagedServiceEvent(
    eventType: ServiceEventType,
    pid: string,
    reference: ServiceReference<any>,
    managedService: ManagedService,
    config?: ConfigurationImpl,
  ): void {
    switch (eventType) {
      case 'REGISTERED':
        if (!this.managedReferences.has(pid)) {
          this.managedReferences.set(pid, reference);
        }
      case 'MODIFIED':
      case 'MODIFIED_ENDMATCH':
        managedService.updated(config?.getProperties());
        this.fireConfigurationChangeEvent('UPDATED', pid, reference);
        break;
      default:
        if (this.managedReferences.has(pid)) {
          this.managedReferences.delete(pid);
        }
        managedService.updated(undefined);
        this.fireConfigurationChangeEvent('DELETED', pid, reference);
    }
  }

  private handleConfigurationEventListenerEvent(
    eventType: ServiceEventType,
    refPid: string,
    configurationListener: ConfigurationListener,
  ): void {
    if (!this.eventListeners.has(refPid) && eventType === 'REGISTERED') {
      this.eventListeners.set(refPid, configurationListener);
    } else if (this.eventListeners.has(refPid) && eventType === 'UNREGISTERING') {
      this.eventListeners.delete(refPid);
    }
  }

  getConfiguration(pid: string): ConfigurationImpl | undefined {
    let config = this.configurations.get(pid);
    if (config) {
      this.logger.debug(`Found configuration ${pid} bound to ${config.getBundleLocation()}`);

      return config;
    }
  }

  createConfiguration(pid: string, location?: string): ConfigurationImpl {
    let config = this.getConfiguration(pid);
    if (config) {
      return config;
    }

    config = this.internalCreateConfiguration(pid, location);
    this.storeConfiguration(config);

    for (const key of this.managedReferences.keys()) {
      if (key === pid) {
        const ref = this.managedReferences.get(key);
        const service = this.context.getService(ref);
        service.updated(config.getProperties());
        this.fireConfigurationChangeEvent('UPDATED', pid, ref);
      }
    }

    return config;
  }

  listConfigurations(filterString?: string): ConfigurationImpl[] {
    const filter = this.filterParser(filterString);
    this.logger.debug(`Listing configurations matching ${filterString}`);

    return Array.from(this.configurations.values()).filter((config) => filter.match(config.getProperties()));
  }

  deleteConfiguration(pid: string): void {
    if (this.configurations.has(pid) && this.managedReferences.has(pid)) {
      const ref = this.managedReferences.get(pid);
      const service = this.context.getService(ref);
      if (service) {
        service.updated(undefined);
      }
      this.configurations.delete(pid);
      this.fireConfigurationChangeEvent('DELETED', pid, ref);
    }
    this.logger.debug(`Attempted to delete already removed configuration for pid: ${pid}, ignoring.`);
  }

  updateConfiguration(config: ConfigurationImpl): void {
    if (this.managedReferences.has(config.getPid())) {
      const ref = this.managedReferences.get(config.getPid());
      const service = this.context.getService(ref);
      if (service) {
        service.updated({
          ...config?.getProperties(),
        });
      }
    }
  }

  private internalCreateConfiguration(pid: string, bundleLocation?: string): ConfigurationImpl {
    this.logger.debug(`createConfiguration(${pid}, ${bundleLocation})`);
    return new ConfigurationImpl(this, pid, bundleLocation);
  }

  private storeConfiguration(configuration: ConfigurationImpl): ConfigurationImpl {
    const pid = configuration.getPid();
    const existing = this.configurations.get(pid);
    if (existing) {
      return existing as ConfigurationImpl;
    }

    this.configurations.set(pid, configuration);
    return configuration;
  }

  private fireConfigurationChangeEvent(type: ConfigurationEventType, pid: string, ref: ServiceReference<any>): void {
    const event: ConfigurationEvent = {
      getPid(): string {
        return pid;
      },
      getReference(): ServiceReference<any> {
        return ref;
      },
      getType(): ConfigurationEventType {
        return type;
      },
    };
    for (const key of this.eventListeners.keys()) {
      if (key === pid) {
        this.eventListeners.get(key).configurationEvent(event);
      }
    }
  }
}
