import {
  BundleContext,
  FilterParser,
  Logger,
  SemverFactory,
  SERVICE_PID,
  ServiceEvent,
  ServiceEventType,
  ServiceListener,
  ServiceReference,
} from '@pandino/pandino-api';
import {
  ConfigurationEvent,
  ConfigurationEventType,
  ConfigurationListener,
  MANAGED_SERVICE_INTERFACE_KEY,
  ManagedService,
} from '@pandino/pandino-configuration-management-api';
import { PersistenceManager } from '@pandino/pandino-persistence-manager-api';
import { ConfigurationImpl } from './configuration-impl';
import { TargetedPID } from './helper/targeted-pid';
import { ConfigurationCache } from './configuration-cache';

export class ConfigurationManager implements ServiceListener {
  isSync: boolean = true;
  private readonly context: BundleContext;
  private readonly logger: Logger;
  private readonly filterParser: FilterParser;
  private readonly managedReferences: Map<string, Array<ServiceReference<ManagedService>>> = new Map<
    string,
    Array<ServiceReference<ManagedService>>
  >();
  private readonly eventListeners: Map<string, ConfigurationListener[]> = new Map<string, ConfigurationListener[]>();
  private readonly configurationCache: ConfigurationCache;
  private readonly semVerFactory: SemverFactory;

  constructor(
    context: BundleContext,
    logger: Logger,
    filterParser: FilterParser,
    pm: PersistenceManager,
    semVerFactory: SemverFactory,
  ) {
    this.context = context;
    this.logger = logger;
    this.filterParser = filterParser;
    this.configurationCache = new ConfigurationCache(context, pm, this, this.semVerFactory);
    this.semVerFactory = semVerFactory;
  }

  initReferencesAddedBeforeManagerActivation(): void {
    const nonConfiguredReferences: ServiceReference<any>[] = [];
    const freshReferences: ServiceReference<any>[] = [];
    const references = this.context
      .getServiceReferences(MANAGED_SERVICE_INTERFACE_KEY)
      .filter((ref) => ref.getProperty(SERVICE_PID));
    for (const config of this.configurationCache.values()) {
      // multiple references can have the same pid
      const configuredReferences = references.filter((ref) => ref.getProperty(SERVICE_PID) === config.getPid());
      for (const reference of configuredReferences) {
        const refPid = reference.getProperty(SERVICE_PID);
        if (refPid && !this.managedReferences.has(refPid)) {
          const targetedPid = new TargetedPID(refPid, this.semVerFactory);
          const service: ManagedService = this.context.getService<ManagedService>(reference);
          this.initManagedService(refPid, reference, config, targetedPid, service);
        }
        freshReferences.push(reference);
      }
    }

    for (const origRef of references) {
      if (!freshReferences.includes(origRef)) {
        nonConfiguredReferences.push(origRef);
      }
    }

    for (const ref of nonConfiguredReferences) {
      const service = this.context.getService(ref);
      if (service) {
        const pid = ref.getProperty(SERVICE_PID);
        this.logger.debug(`Updating non-configured Service for PID: ${pid}`);
        service.updated(undefined);
        if (!this.managedReferences.has(pid)) {
          this.managedReferences.set(pid, []);
        }
        const refs = this.managedReferences.get(pid);
        if (!refs.includes(ref)) {
          refs.push(ref);
        }
      }
    }
  }

  serviceChanged(event: ServiceEvent): void {
    const reference = event.getServiceReference();
    const refPid = reference.getProperty(SERVICE_PID);
    const service = this.context.getService(reference);
    if (service) {
      if (refPid && typeof (service as ManagedService).updated === 'function') {
        const config = this.configurationCache.has(refPid)
          ? this.configurationCache.get(refPid)
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
    config: ConfigurationImpl,
  ): void {
    const targetedPid = new TargetedPID(pid, this.semVerFactory);
    if (eventType === 'REGISTERED') {
      this.initManagedService(pid, reference, config, targetedPid, managedService);
    } else if (eventType === 'UNREGISTERING') {
      if (!this.managedReferences.has(pid)) {
        this.managedReferences.set(pid, []);
      }
      const idx = this.managedReferences.get(pid).findIndex((ref) => ref === reference);
      if (idx > -1) {
        this.managedReferences.get(pid).splice(idx, 1);
      }
      if (targetedPid.matchesTarget(reference)) {
        managedService.updated(undefined);
        this.fireConfigurationChangeEvent('DELETED', pid, reference);
      }
    }
  }

  private initManagedService(
    pid: string,
    reference: ServiceReference<any>,
    config: ConfigurationImpl,
    targetedPid: TargetedPID,
    managedService: ManagedService,
  ) {
    if (!this.managedReferences.has(pid)) {
      this.managedReferences.set(pid, []);
    }
    if (!this.managedReferences.get(pid).includes(reference)) {
      this.managedReferences.get(pid).push(reference);
    }

    // As per specification if config is missing, we need to assign the first registered Service's Bundle location.
    if (!config.getBundleLocation()) {
      config.setBundleLocation(reference.getBundle().getLocation());
    }

    if (targetedPid.matchesTarget(reference)) {
      managedService.updated(config?.getProperties());
      this.fireConfigurationChangeEvent('UPDATED', pid, reference);
    }
  }

  private handleConfigurationEventListenerEvent(
    eventType: ServiceEventType,
    refPid: string,
    configurationListener: ConfigurationListener,
  ): void {
    if (eventType === 'REGISTERED') {
      if (!this.eventListeners.has(refPid)) {
        this.eventListeners.set(refPid, []);
      }
      const listeners = this.eventListeners.get(refPid);
      if (!listeners.includes(configurationListener)) {
        listeners.push(configurationListener);
      }
    } else if (eventType === 'UNREGISTERING') {
      if (this.eventListeners.has(refPid)) {
        const listeners = this.eventListeners.get(refPid);
        const listenerIdx = listeners.findIndex((l) => l === configurationListener);
        if (listenerIdx > -1) {
          listeners.splice(listenerIdx, 1);
        }
      }
    }
  }

  getConfiguration(pid: string): ConfigurationImpl | undefined {
    let config = this.configurationCache.get(pid);
    if (config) {
      this.logger.debug(`Found configuration ${pid} bound to ${config.getBundleLocation()}`);

      return config;
    }
  }

  createConfiguration(pid: string, location?: string): ConfigurationImpl {
    let effectiveLocation = location;
    let config = this.getConfiguration(pid);
    if (config) {
      return config;
    }

    const refs = this.managedReferences.get(pid);

    if (refs && refs.length) {
      effectiveLocation = refs[0].getBundle().getLocation();
    }

    return this.internalCreateConfiguration(pid, effectiveLocation);
  }

  listConfigurations(filterString?: string): ConfigurationImpl[] {
    if (filterString) {
      const filter = this.filterParser(filterString);
      this.logger.debug(`Listing configurations matching ${filterString}`);

      return Array.from(this.configurationCache.values()).filter((config) => filter.match(config.getProperties()));
    }

    return [...this.configurationCache.values()];
  }

  deleteConfiguration(pid: string): void {
    if (this.configurationCache.has(pid)) {
      this.configurationCache.delete(pid);
      if (this.managedReferences.has(pid)) {
        const refs = this.managedReferences.get(pid);
        for (const ref of refs) {
          const service = this.context.getService(ref);
          if (service) {
            service.updated(undefined);
          }
          this.fireConfigurationChangeEvent('DELETED', pid, ref);
        }
      }
    }
    this.logger.debug(`Attempted to delete already removed configuration for pid: ${pid}, ignoring.`);
  }

  updateConfiguration(config: ConfigurationImpl): void {
    this.configurationCache.set(config.getPid(), config);
    if (this.managedReferences.has(config.getServicePid())) {
      const refs = this.managedReferences.get(config.getServicePid());
      for (const ref of refs) {
        if (config.getTargetedPid().matchesTarget(ref)) {
          const service = this.context.getService(ref);
          if (service) {
            service.updated({
              ...config.getProperties(),
            });
            this.fireConfigurationChangeEvent('UPDATED', config.getPid(), ref);
          }
        }
      }
    }
  }

  private internalCreateConfiguration(pid: string, bundleLocation?: string): ConfigurationImpl {
    this.logger.debug(`createConfiguration(${pid}, ${bundleLocation})`);
    return new ConfigurationImpl(this, pid, this.semVerFactory, bundleLocation);
  }

  private storeConfiguration(configuration: ConfigurationImpl): ConfigurationImpl {
    const pid = configuration.getPid();
    const existing = this.configurationCache.get(pid);
    if (existing) {
      return existing as ConfigurationImpl;
    }

    this.configurationCache.set(pid, configuration);
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
    const listeners = this.eventListeners.get(pid) || [];
    for (const listener of listeners) {
      listener.configurationEvent(event);
    }
  }
}
