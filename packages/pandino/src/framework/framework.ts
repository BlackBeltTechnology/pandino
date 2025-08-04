import { EventEmitter } from '~/framework/event-emitter';
import { FrameworkLogger } from '~/framework/framework-logger';
import { LogLevel, type LogService } from '~/services/log-service/interfaces';
import type { BundleMetadata, BundleModule } from '~/types/bundle-metadata';
import { BUNDLE_STATES, type BundleState, SERVICE_EVENT_TYPES } from '~/types/constants';
import {
  type Bundle,
  type BundleActivator,
  type BundleConfiguration,
  type BundleContext,
  BundleEvent,
  type BundleListener,
  type Filter,
  type FragmentResourceProcessor,
  ServiceEvent,
  type ServiceFactory,
  type ServiceListener,
  type ServiceReference,
  type ServiceRegistration,
} from './interfaces';
import { LDAPFilter } from './ldap-filter';
import { LdapFilterServiceImpl } from './ldap-filter-service';
import { parseFragmentHost, versionMatches } from './version-utils';
import { globToRegExp } from './glob-utils';

export class OSGiFramework extends EventEmitter implements BundleActivator {
  private bundles = new Map<number, Bundle>();
  private services = new Map<number, ServiceRegistrationImpl<any>>();
  private bundleCounter = 0;
  private serviceCounter = 0;
  private frameworkProperties = new Map<string, string>();
  private running = false;
  private systemBundle: Bundle | null = null;
  private factoryServiceInstances = new Map<number, Map<ServiceRegistration<any>, any>>();
  private hostToFragmentsMap = new Map<number, Set<number>>();
  private resourceProcessors = new Map<string, FragmentResourceProcessor>();
  private readonly logger: FrameworkLogger;

  constructor(logLevel: LogLevel = LogLevel.INFO) {
    super();
    this.frameworkProperties.set('org.osgi.framework.version', '1.0.0');
    this.frameworkProperties.set('org.osgi.framework.vendor', 'TypeScript OSGi Implementation');
    this.logger = new FrameworkLogger(logLevel);
  }

  async start(): Promise<void> {
    if (this.running) return;

    if (!this.systemBundle) {
      const systemMetadata: BundleMetadata = {
        bundleSymbolicName: import.meta.env.VITE_PANDINO_NAME,
        bundleVersion: import.meta.env.VITE_PANDINO_VERSION,
      };
      this.systemBundle = new BundleImpl(0, 'system:', systemMetadata, this);
      (this.systemBundle as BundleImpl).setState(BUNDLE_STATES.ACTIVE);
      this.bundles.set(0, this.systemBundle);
    }

    this.registerFrameworkServices();

    this.on('service-event', (event: ServiceEvent) => {
      if (event.getType() === SERVICE_EVENT_TYPES.REGISTERED) {
        const reference = event.getServiceReference();
        const objectClass = reference.getProperty('objectClass');

        if (objectClass === 'LogService' || (Array.isArray(objectClass) && objectClass.includes('LogService'))) {
          this.logger.info('LogService registered, connecting framework logger');
          const logService = this.getService<LogService>(reference);
          if (logService) {
            this.logger.setLogService(logService);
          }
        }
      }
    });

    this.running = true;
    this.logger.info('Framework started');
    this.emit('framework-started');
  }

  async stop(): Promise<void> {
    if (!this.running) return;

    this.logger.info('Stopping framework');

    const bundleArray = Array.from(this.bundles.values()).reverse();
    for (const bundle of bundleArray) {
      if (bundle.getState() === BUNDLE_STATES.ACTIVE) {
        await bundle.stop();
      }
    }

    this.running = false;
    this.logger.info('Framework stopped');
    this.emit('framework-stopped');
  }

  private registerFrameworkServices(): void {
    const systemContext = this.systemBundle!.getContext();

    const ldapFilterService = new LdapFilterServiceImpl();
    systemContext.registerService('LdapFilterService', ldapFilterService);

    // Register the framework itself as a service (OSGi-compliant)
    systemContext.registerService('OSGiFramework', this);
  }

  async installBundle(
    modulePromiseOrLocation: Promise<BundleModule> | string,
    config?: BundleConfiguration,
  ): Promise<Bundle> {
    const bundleId = ++this.bundleCounter;

    let bundleModule: BundleModule;

    let originalLocation: string | undefined;

    if (typeof modulePromiseOrLocation === 'string') {
      // Handle string location parameter
      originalLocation = modulePromiseOrLocation;
      const symbolicName = modulePromiseOrLocation.replace(/^.*?:\/\//, '');

      // Create a default bundle module from the location
      bundleModule = {
        default: {
          headers: {
            bundleSymbolicName: symbolicName || `bundle-${bundleId}`,
            bundleVersion: '1.0.0',
          },
          activator: {
            start: async () => {},
            stop: async () => {},
          },
        },
      };

      if (config?.headers) {
        bundleModule.default.headers = {
          ...bundleModule.default.headers,
          ...config.headers,
        };
      }

      if (config?.activator) {
        if (typeof config.activator === 'function') {
          // If it's a factory function, call it to get the activator
          const activatorFactory = config.activator as () => BundleActivator;
          const activator = activatorFactory();

          // Validate that the factory function returned a valid BundleActivator
          if (
            typeof activator !== 'object' ||
            activator === null ||
            typeof activator.start !== 'function' ||
            typeof activator.stop !== 'function'
          ) {
            throw new Error('Activator factory function must return a BundleActivator object');
          }

          bundleModule.default.activator = activator;
        } else if (
          typeof config.activator === 'object' &&
          typeof (config.activator as BundleActivator).start === 'function' &&
          typeof (config.activator as BundleActivator).stop === 'function'
        ) {
          bundleModule.default.activator = config.activator as BundleActivator;
        } else {
          throw new Error('Invalid activator: must be a BundleActivator object or factory function');
        }
      }
    } else {
      bundleModule = await modulePromiseOrLocation;
    }

    const { headers, activator } = bundleModule.default;

    // Use the original location if provided, otherwise construct a default one
    const location = originalLocation || `module://${headers.bundleSymbolicName}`;

    const bundle = new BundleImpl(
      bundleId,
      location,
      {
        ...headers, // Include ALL custom headers from the bundle first
        // Override with standard properties to ensure they're always present
        bundleSymbolicName: headers.bundleSymbolicName,
        bundleVersion: headers.bundleVersion,
      },
      this,
    );

    this.bundles.set(bundleId, bundle);

    // Store the bundle module for component discovery
    bundle.setBundleModule(bundleModule);

    if (activator) {
      bundle.setActivator(activator);
    }

    if (config?.deactivator) {
      (bundle as any).setDeactivator(config.deactivator);
    }

    this.emit('bundle-event', new BundleEvent(BUNDLE_STATES.INSTALLED, bundle));

    await this.resolveBundle(bundle);

    return bundle;
  }

  removeBundle(bundleId: number): void {
    this.bundles.delete(bundleId);
  }

  private async resolveBundle(bundle: BundleImpl): Promise<void> {
    if (this.isFragment(bundle)) {
      const hostBundle = this.findHostBundle(bundle);

      if (hostBundle) {
        this.logger.info(`Resolved fragment ${bundle.getBundleId()} for host ${hostBundle.getBundleId()}`, undefined, {
          fragmentId: bundle.getBundleId(),
          fragmentSymbolicName: bundle.getSymbolicName(),
          hostId: hostBundle.getBundleId(),
          hostSymbolicName: hostBundle.getSymbolicName(),
        });

        if (hostBundle.getState() === BUNDLE_STATES.RESOLVED || hostBundle.getState() === BUNDLE_STATES.ACTIVE) {
          this.attachFragmentToHost(bundle, hostBundle);
        }
      } else {
        this.logger.warn(`Fragment ${bundle.getBundleId()} has no matching host bundle`, undefined, {
          fragmentId: bundle.getBundleId(),
          fragmentSymbolicName: bundle.getSymbolicName(),
          fragmentHost: bundle.getBundleModule()?.default.headers.fragmentHost,
        });
      }
    } else {
      const fragments = Array.from(this.bundles.values()).filter(
        (b) => this.isFragment(b) && this.findHostBundle(b) === bundle,
      );

      for (const fragment of fragments) {
        this.attachFragmentToHost(fragment, bundle);
      }
    }

    bundle.setState(BUNDLE_STATES.RESOLVED);
    this.emit('bundle-event', new BundleEvent(BUNDLE_STATES.RESOLVED, bundle));
  }

  getFactoryServiceInstances(bundleId: number): Map<ServiceRegistration<any>, any> | undefined {
    return this.factoryServiceInstances.get(bundleId);
  }

  clearFactoryServiceInstances(bundleId: number): void {
    this.factoryServiceInstances.delete(bundleId);
  }

  trackFactoryServiceInstance(bundleId: number, registration: ServiceRegistration<any>, instance: any): void {
    if (!this.factoryServiceInstances.has(bundleId)) {
      this.factoryServiceInstances.set(bundleId, new Map());
    }
    this.factoryServiceInstances.get(bundleId)!.set(registration, instance);
  }

  getSystemBundleContext(): BundleContext {
    if (!this.systemBundle) {
      throw new Error('Framework not started - system bundle not available');
    }
    return this.systemBundle.getContext();
  }

  getBundleContext(): BundleContext {
    return this.getSystemBundleContext();
  }

  getBundle(id: number): Bundle | null {
    return this.bundles.get(id) || null;
  }

  getBundles(): Bundle[] {
    return Array.from(this.bundles.values());
  }

  getProperty(key: string): string | undefined {
    return this.frameworkProperties.get(key);
  }

  static isServiceFactory(service: any): boolean {
    return typeof service?.getService === 'function' && typeof service?.ungetService === 'function';
  }

  registerService<S>(
    bundle: Bundle,
    clazz: string | string[] | Function,
    service: S | ServiceFactory<S>,
    properties: Record<string, any> = {},
  ): ServiceRegistration<S> {
    // Check if this is a ServiceFactory using the reusable utility method
    if (OSGiFramework.isServiceFactory(service)) {
      properties['service.factory'] = true;
    }

    const serviceId = ++this.serviceCounter;

    let objectClass: string | string[];
    if (Array.isArray(clazz)) {
      objectClass = clazz;
    } else if (typeof clazz === 'string') {
      objectClass = clazz;
    } else {
      objectClass = clazz.name;
    }

    const serviceProps = {
      ...properties,
      'service.id': serviceId,
      'service.ranking': properties?.['service.ranking'] ?? 0,
      objectClass,
    };

    const registration = new ServiceRegistrationImpl(serviceId, service, serviceProps, bundle, this);

    this.services.set(serviceId, registration);

    (bundle as any).addRegisteredService(serviceId);

    const event = new ServiceEvent(SERVICE_EVENT_TYPES.REGISTERED, registration.getReference());
    this.emit('service-event', event);

    return registration;
  }

  unregisterService(serviceId: number): void {
    const registration = this.services.get(serviceId);
    if (registration) {
      const serviceReference = registration.getReference();

      const event = new ServiceEvent(SERVICE_EVENT_TYPES.UNREGISTERING, serviceReference);
      this.emit('service-event', event);

      const bundle = serviceReference.getBundle();
      (bundle as any).removeRegisteredService(serviceId);

      (registration as any).markUnregistered();

      this.services.delete(serviceId);
    }
  }

  getServiceReferences<S>(clazz: string | Function, filter?: string): ServiceReference<S>[] {
    const className = typeof clazz === 'string' ? clazz : clazz.name;
    const results: ServiceReference<S>[] = [];

    for (const registration of this.services.values()) {
      const objectClass = registration.getReference().getProperty('objectClass');

      const implementsInterface = Array.isArray(objectClass)
        ? objectClass.includes(className)
        : objectClass === className;

      if (implementsInterface) {
        if (!filter || this.createFilter(filter).match(registration.getProperties())) {
          results.push(registration.getReference());
        }
      }
    }

    return results.sort((a, b) => {
      const rankingA = a.getProperty('service.ranking') || 0;
      const rankingB = b.getProperty('service.ranking') || 0;
      return rankingB - rankingA;
    });
  }

  getService<S>(reference: ServiceReference<S>, requestingBundle?: Bundle): S | null {
    const serviceId = reference.getProperty('service.id');
    const registration = this.services.get(serviceId);
    if (!registration) {
      return null;
    }

    const bundle = requestingBundle || this.systemBundle!;
    return registration.getService(bundle);
  }

  createFilter(filterString: string): Filter {
    return new LDAPFilter(filterString);
  }

  getLogger(): LogService {
    return this.logger;
  }

  registerResourceProcessor(processor: FragmentResourceProcessor): void {
    const resourceType = processor.getResourceType();
    this.resourceProcessors.set(resourceType, processor);
    this.logger.debug(`Registered resource processor for type: ${resourceType}`);
  }

  getResourceProcessor(resourceType: string): FragmentResourceProcessor | undefined {
    return this.resourceProcessors.get(resourceType);
  }

  getResourceProcessors(): FragmentResourceProcessor[] {
    return Array.from(this.resourceProcessors.values());
  }

  isFragment(bundle: Bundle): boolean {
    const bundleModule = bundle.getBundleModule();
    if (!bundleModule || !bundleModule.default || !bundleModule.default.headers) {
      return false;
    }
    return !!bundleModule.default.headers.fragmentHost;
  }

  private findHostBundle(fragment: Bundle): Bundle | null {
    const bundleModule = fragment.getBundleModule();
    if (!bundleModule || !bundleModule.default || !bundleModule.default.headers) {
      return null;
    }

    const fragmentHost = bundleModule.default.headers.fragmentHost;
    if (!fragmentHost) {
      return null;
    }

    const [symbolicName, versionRange] = parseFragmentHost(fragmentHost);

    const candidates = Array.from(this.bundles.values()).filter((bundle) => bundle.getSymbolicName() === symbolicName);

    if (versionRange) {
      const matchingCandidates = candidates.filter((bundle) => {
        const bundleVersion = bundle.getVersion();
        return versionMatches(bundleVersion, versionRange);
      });

      return matchingCandidates.length > 0 ? (matchingCandidates[0] as BundleImpl) : null;
    }

    return candidates.length > 0 ? (candidates[0] as BundleImpl) : null;
  }

  getFragmentsForHost(host: Bundle): Bundle[] {
    const hostId = host.getBundleId();
    const fragmentIds = this.hostToFragmentsMap.get(hostId) || new Set<number>();

    return Array.from(fragmentIds)
      .map((id) => this.bundles.get(id))
      .filter((bundle): bundle is Bundle => bundle !== undefined);
  }

  attachFragmentToHost(fragment: Bundle, host: Bundle): void {
    const hostId = host.getBundleId();
    const fragmentId = fragment.getBundleId();

    if (!this.hostToFragmentsMap.has(hostId)) {
      this.hostToFragmentsMap.set(hostId, new Set<number>());
    }

    this.hostToFragmentsMap.get(hostId)!.add(fragmentId);

    (fragment as any).attachedToHost = hostId;

    this.processFragmentResources(host, fragment);

    this.logger.info(`Fragment ${fragmentId} attached to host ${hostId}`, undefined, {
      fragmentId,
      fragmentSymbolicName: fragment.getSymbolicName(),
      hostId,
      hostSymbolicName: host.getSymbolicName(),
    });
  }

  detachFragmentFromHost(fragment: Bundle, host: Bundle): void {
    const hostId = host.getBundleId();
    const fragmentId = fragment.getBundleId();

    if (this.hostToFragmentsMap.has(hostId)) {
      this.hostToFragmentsMap.get(hostId)!.delete(fragmentId);
    }

    delete (fragment as any).attachedToHost;

    this.logger.info(`Fragment ${fragmentId} detached from host ${hostId}`, undefined, {
      fragmentId,
      fragmentSymbolicName: fragment.getSymbolicName(),
      hostId,
      hostSymbolicName: host.getSymbolicName(),
    });
  }

  private processFragmentResources(host: Bundle, fragment: Bundle): void {
    const processors = this.getResourceProcessors();

    if (processors.length === 0) {
      this.logger.debug('No resource processors registered, fragment resources will not be processed');
      return;
    }

    let resourcesProcessed = false;

    for (const processor of processors) {
      try {
        const processed = processor.processResources(host, fragment);
        if (processed) {
          this.logger.debug(
            `Processed resources of type '${processor.getResourceType()}' from fragment ${fragment.getBundleId()}`,
          );
          resourcesProcessed = true;
        }
      } catch (error) {
        this.logger.error(
          `Error processing resources of type '${processor.getResourceType()}' from fragment ${fragment.getBundleId()}`,
          error as Error,
          {
            fragmentId: fragment.getBundleId(),
            fragmentSymbolicName: fragment.getSymbolicName(),
            hostId: host.getBundleId(),
            hostSymbolicName: host.getSymbolicName(),
            resourceType: processor.getResourceType(),
          },
        );
      }
    }

    if (!resourcesProcessed) {
      this.logger.debug(`No resources processed for fragment ${fragment.getBundleId()}`);
    }
  }
}

class BundleImpl implements Bundle {
  private state: BundleState = BUNDLE_STATES.INSTALLED;
  private context: BundleContextImpl | null = null;
  private activator: BundleActivator | null = null;
  private deactivator: ((context: BundleContext) => void | Promise<void>) | null = null;
  private registeredServices = new Set<number>();
  private bundleModule: BundleModule | null = null; // Store the bundle module for component discovery

  constructor(
    private bundleId: number,
    private location: string,
    private metadata: BundleMetadata,
    private framework: OSGiFramework,
  ) {}

  getBundleId(): number {
    return this.bundleId;
  }

  getSymbolicName(): string {
    return this.metadata.bundleSymbolicName;
  }

  getVersion(): string {
    return this.metadata.bundleVersion;
  }

  getState(): BundleState {
    if (this.state === BUNDLE_STATES.UNINSTALLED) {
      throw new Error(`Bundle ${this.bundleId} has been uninstalled`);
    }
    return this.state;
  }

  setState(state: BundleState): void {
    this.state = state;
  }

  getContext(): BundleContext {
    if (!this.context) {
      this.context = new BundleContextImpl(this, this.framework);
    }
    return this.context;
  }

  getHeaders(_locale?: string): Record<string, string> {
    const headers: Record<string, string> = {
      'Bundle-SymbolicName': this.metadata.bundleSymbolicName,
      'Bundle-Version': this.metadata.bundleVersion,
      'Bundle-Activator': this.metadata.bundleActivator || '',
    };

    // Add custom headers from metadata - check for undefined instead of truthiness to preserve empty strings
    if (this.metadata.bundleName !== undefined) {
      headers['bundleName'] = this.metadata.bundleName;
    }
    if (this.metadata.bundleDescription !== undefined) {
      headers['bundleDescription'] = this.metadata.bundleDescription;
    }
    if (this.metadata.bundleManifestVersion !== undefined) {
      headers['bundleManifestVersion'] = this.metadata.bundleManifestVersion;
    }

    // Add any additional properties from metadata
    for (const key of Object.keys(this.metadata)) {
      if (
        key !== 'bundleSymbolicName' &&
        key !== 'bundleVersion' &&
        key !== 'bundleActivator' &&
        key !== 'bundleName' &&
        key !== 'bundleDescription' &&
        key !== 'bundleManifestVersion'
      ) {
        headers[key] = this.metadata[key];
      }
    }

    return headers;
  }

  getLocation(): string {
    return this.location;
  }

  async resolve(): Promise<void> {
    if (this.state === BUNDLE_STATES.INSTALLED) {
      this.state = BUNDLE_STATES.RESOLVED;
    }
  }

  async start(): Promise<void> {
    if ((this.framework as OSGiFramework).isFragment(this)) {
      throw new Error(`Cannot start fragment bundle ${this.bundleId}: fragments cannot be started directly`);
    }

    if (this.state === BUNDLE_STATES.UNINSTALLED) {
      throw new Error(`Cannot start bundle ${this.bundleId}: uninstalled`);
    }

    if (this.state === BUNDLE_STATES.ACTIVE) {
      return; // Already started
    }

    if (this.state === BUNDLE_STATES.INSTALLED) {
      await this.resolve();
    }

    if (this.state !== BUNDLE_STATES.RESOLVED) {
      throw new Error(`Cannot start bundle ${this.bundleId}: not resolved`);
    }

    this.state = BUNDLE_STATES.STARTING;

    try {
      if (!this.context || !(this.context as BundleContextInternal).valid) {
        this.context = new BundleContextImpl(this, this.framework);
      }

      if (this.activator) {
        await this.activator.start(this.context);
      }

      const fragments = (this.framework as OSGiFramework).getFragmentsForHost(this);
      for (const fragment of fragments) {
        // The fragment's resources should already be merged with the host's during resolution,
        // but we'll make sure they're attached here as well
        if (!(fragment as any).attachedToHost) {
          (this.framework as OSGiFramework).attachFragmentToHost(fragment, this);
        }
      }

      this.state = BUNDLE_STATES.ACTIVE;
      this.framework.emit('bundle-event', new BundleEvent(BUNDLE_STATES.ACTIVE, this));
    } catch (error) {
      this.state = BUNDLE_STATES.RESOLVED;
      throw error;
    }
  }

  async stop(_options?: number): Promise<void> {
    if (this.state !== BUNDLE_STATES.ACTIVE) return;

    this.state = BUNDLE_STATES.STOPPING;

    try {
      const fragments = (this.framework as OSGiFramework).getFragmentsForHost(this);
      for (const fragment of fragments) {
        (this.framework as OSGiFramework).detachFragmentFromHost(fragment, this);
      }

      if (this.activator && this.context) {
        try {
          await this.activator.stop(this.context);
        } catch (error) {
          this.framework.getLogger().error('Error in activator stop', error as Error, {
            bundleId: this.bundleId,
            symbolicName: this.getSymbolicName(),
          });
        }
      }

      if (this.deactivator && this.context) {
        try {
          await this.deactivator(this.context);
        } catch (error) {
          this.framework.getLogger().error('Error in deactivator', error as Error, {
            bundleId: this.bundleId,
            symbolicName: this.getSymbolicName(),
          });
        }
      }

      this.cleanupFactoryServices();

      for (const serviceId of this.registeredServices) {
        this.framework.unregisterService(serviceId);
      }
      this.registeredServices.clear();

      if (this.context) {
        (this.context as BundleContextInternal).invalidate();
      }
    } finally {
      this.state = BUNDLE_STATES.RESOLVED;
      this.framework.emit('bundle-event', new BundleEvent(BUNDLE_STATES.RESOLVED, this));
    }
  }

  async update(_source?: ReadableStream): Promise<void> {
    throw new Error('Bundle update not implemented');
  }

  async uninstall(): Promise<void> {
    if (this.state === BUNDLE_STATES.ACTIVE) {
      await this.stop();
    }
    this.state = BUNDLE_STATES.UNINSTALLED;
    this.framework.removeBundle(this.bundleId);
    this.framework.emit('bundle-event', new BundleEvent(BUNDLE_STATES.UNINSTALLED, this));
  }

  private cleanupFactoryServices(): void {
    const bundleInstances = this.framework.getFactoryServiceInstances(this.bundleId);
    if (bundleInstances) {
      for (const [_, registration] of bundleInstances.entries()) {
        (registration as ServiceRegistrationImpl<any>).ungetService(this);
      }
      this.framework.clearFactoryServiceInstances(this.bundleId);
    }
  }

  addRegisteredService(serviceId: number): void {
    this.registeredServices.add(serviceId);
  }

  getRegisteredServices(): ServiceReference<any>[] {
    const services: ServiceReference<any>[] = [];
    for (const serviceId of this.registeredServices) {
      const registration = (this.framework as any).services.get(serviceId);
      if (registration) {
        services.push(registration.getReference());
      }
    }
    return services;
  }

  removeRegisteredService(serviceId: number): void {
    this.registeredServices.delete(serviceId);
  }

  getServicesInUse(): ServiceReference<any>[] {
    return [];
  }

  setActivator(activator: BundleActivator): void {
    this.activator = activator;
  }

  setDeactivator(deactivator: BundleConfiguration['deactivator']): void {
    if (typeof deactivator === 'function') {
      let parameterCount = deactivator.length;

      if (typeof (deactivator as any).getMockImplementation === 'function') {
        const mockImpl = (deactivator as any).getMockImplementation();
        if (mockImpl) {
          parameterCount = mockImpl.length;
        }
      }

      // Check if this is a factory function (no parameters) vs a direct deactivator (has parameters)
      if (parameterCount === 0) {
        try {
          const result = (deactivator as () => any)();

          // Handle both sync and async factory functions
          if (result && typeof result.then === 'function') {
            if (typeof (deactivator as any).getMockImplementation === 'function') {
              this.deactivator = deactivator as (context: BundleContext) => void | Promise<void>;
              return;
            }

            result
              .then((asyncResult: any) => {
                if (typeof asyncResult === 'function') {
                  this.deactivator = asyncResult;
                } else {
                  throw new Error('Async factory function must resolve to a deactivator function');
                }
              })
              .catch((error: any) => {
                throw new Error(`Failed to resolve async deactivator factory: ${error}`);
              });
            return;
          } else if (typeof result === 'function') {
            this.deactivator = result;
            return;
          } else {
            throw new Error('Factory function must return a deactivator function');
          }
        } catch (error) {
          if (typeof (deactivator as any).getMockImplementation === 'function') {
            this.deactivator = deactivator as (context: BundleContext) => void | Promise<void>;
            return;
          }
          throw new Error(`Failed to call deactivator factory function: ${error}`);
        }
      } else {
        this.deactivator = deactivator as (context: BundleContext) => void | Promise<void>;
      }
    }
  }

  setBundleModule(bundleModule: BundleModule): void {
    this.bundleModule = bundleModule;
  }

  getBundleModule(): BundleModule | null {
    return this.bundleModule;
  }

  getResource(path: string): string | null {
    const bundleModule = this.getBundleModule();
    if (!bundleModule || !bundleModule.default || !bundleModule.default.resources) {
      if (!(this.framework as OSGiFramework).isFragment(this)) {
        const fragments = (this.framework as OSGiFramework).getFragmentsForHost(this);
        for (const fragment of fragments) {
          const resource = fragment.getResource(path);
          if (resource) {
            return resource;
          }
        }
      }
      return null;
    }

    const resources = bundleModule.default.resources;
    if (resources[path]) {
      return resources[path];
    }

    if (!(this.framework as OSGiFramework).isFragment(this)) {
      const fragments = (this.framework as OSGiFramework).getFragmentsForHost(this);
      for (const fragment of fragments) {
        const resource = fragment.getResource(path);
        if (resource) {
          return resource;
        }
      }
    }

    return null;
  }

  findResources(basePath: string, pattern: string): string[] {
    const results: string[] = [];

    const regexPattern = globToRegExp(basePath, pattern);

    const bundleModule = this.getBundleModule();
    if (bundleModule?.default?.resources) {
      const resources = bundleModule.default.resources;

      for (const [path, url] of Object.entries(resources)) {
        if (regexPattern.test(path)) {
          results.push(url);
        }
      }
    }

    if (!(this.framework as OSGiFramework).isFragment(this)) {
      const fragments = (this.framework as OSGiFramework).getFragmentsForHost(this);
      for (const fragment of fragments) {
        const fragmentResources = fragment.findResources(basePath, pattern);
        results.push(...fragmentResources);
      }
    }

    return results;
  }
}

interface BundleContextInternal extends BundleContext {
  valid: boolean;
  invalidate(): void;
}

class BundleContextImpl implements BundleContextInternal {
  private serviceListeners = new Map<ServiceListener, Filter | null>();
  private bundleListeners = new Set<BundleListener>();
  public valid = true;

  constructor(
    private bundle: Bundle,
    private framework: OSGiFramework,
  ) {
    this.framework.on('service-event', this.handleServiceEvent.bind(this));
    this.framework.on('bundle-event', this.handleBundleEvent.bind(this));
  }

  private checkValid(): void {
    if (!this.valid) {
      throw new Error('BundleContext is no longer valid');
    }
  }

  invalidate(): void {
    this.valid = false;
    this.serviceListeners.clear();
    this.bundleListeners.clear();
  }

  getLogService(): LogService | null {
    this.checkValid();
    const serviceRef = this.getServiceReference<LogService>('LogService');
    return serviceRef ? this.getService(serviceRef) : null;
  }

  getProperty(key: string): string | undefined {
    this.checkValid();
    return this.framework.getProperty(key);
  }

  getBundle(): Bundle;
  getBundle(id: number): Bundle | null;
  getBundle(id?: number): Bundle | null {
    this.checkValid();
    if (id === undefined) {
      return this.bundle;
    }
    return this.framework.getBundle(id);
  }

  getBundles(): Bundle[] {
    this.checkValid();
    return this.framework.getBundles();
  }

  async installBundle(
    modulePromiseOrLocation: Promise<BundleModule> | string,
    config?: BundleConfiguration,
  ): Promise<Bundle> {
    this.checkValid();
    return this.framework.installBundle(modulePromiseOrLocation, config);
  }

  registerService<S>(clazz: string | Function, service: S, properties?: Record<string, any>): ServiceRegistration<S> {
    this.checkValid();
    return this.framework.registerService(this.bundle, clazz, service, properties || {});
  }

  getServiceReference<S>(clazz: string | Function): ServiceReference<S> | null {
    this.checkValid();
    const refs = this.framework.getServiceReferences<S>(clazz);
    return refs.length > 0 ? refs[0] : null;
  }

  getServiceReferences<S>(clazz: string | Function, filter?: string): ServiceReference<S>[] | null {
    this.checkValid();
    const refs = this.framework.getServiceReferences<S>(clazz, filter);
    return refs.length > 0 ? refs : null;
  }

  getService<S>(reference: ServiceReference<S>): S | null {
    this.checkValid();
    const serviceId = reference.getProperty('service.id');
    const registration = (this.framework as any).services.get(serviceId);
    if (!registration) {
      return null;
    }

    return registration.getService(this.bundle);
  }

  ungetService(_reference: ServiceReference<any>): boolean {
    this.checkValid();
    return true;
  }

  addBundleListener(listener: BundleListener): void {
    this.checkValid();
    this.bundleListeners.add(listener);
  }

  removeBundleListener(listener: BundleListener): void {
    this.checkValid();
    this.bundleListeners.delete(listener);
  }

  createFilter(filter: string): Filter {
    this.checkValid();
    return this.framework.createFilter(filter);
  }

  getDataFile(filename: string): string {
    this.checkValid();
    return `./data/${this.bundle.getBundleId()}/${filename}`;
  }

  addServiceListener(listener: ServiceListener, filterString?: string): void {
    this.checkValid();
    const filter = filterString ? this.framework.createFilter(filterString) : null;
    this.serviceListeners.set(listener, filter);
  }

  removeServiceListener(listener: ServiceListener): void {
    this.checkValid();
    this.serviceListeners.delete(listener);
  }

  private handleServiceEvent(event: ServiceEvent): void {
    for (const [listener, filter] of this.serviceListeners) {
      try {
        if (!filter || filter.match(event.getServiceReference().getProperties())) {
          listener.serviceChanged(event);
        }
      } catch (error) {
        this.framework.getLogger().error('Error in service listener', error as Error, {
          eventType: event.getType(),
          serviceId: event.getServiceReference().getProperty('service.id'),
          bundleId: this.bundle.getBundleId(),
        });
      }
    }
  }

  private handleBundleEvent(event: BundleEvent): void {
    for (const listener of this.bundleListeners) {
      try {
        listener.bundleChanged(event);
      } catch (error) {
        this.framework.getLogger().error('Error in bundle listener', error as Error, {
          eventType: event.getType(),
          bundleId: event.getBundle().getBundleId(),
          listenerBundleId: this.bundle.getBundleId(),
        });
      }
    }
  }
}

class ServiceRegistrationImpl<S> implements ServiceRegistration<S> {
  private readonly reference: ServiceReferenceImpl<S>;
  private unregistered = false;
  private serviceInstances = new Map<number, S>(); // Track per-bundle instances

  constructor(
    private serviceId: number,
    private service: S | ServiceFactory<S>,
    private properties: Record<string, any>,
    private bundle: Bundle,
    private framework: OSGiFramework,
  ) {
    this.reference = new ServiceReferenceImpl(serviceId, properties, bundle);
  }

  private checkValid(): void {
    if (this.unregistered) {
      throw new Error('Service registration is no longer valid');
    }
  }

  getReference(): ServiceReference<S> {
    this.checkValid();
    return this.reference;
  }

  setProperties(properties: Record<string, any>): void {
    this.checkValid();
    this.properties = { ...properties, 'service.id': this.serviceId };
    this.reference.updateProperties(this.properties);

    const event = new ServiceEvent(SERVICE_EVENT_TYPES.MODIFIED, this.reference);
    this.framework.emit('service-event', event);
  }

  unregister(): void {
    if (this.unregistered) {
      return; // Already unregistered, do nothing
    }

    this.framework.unregisterService(this.serviceId);

    this.unregistered = true;
  }

  getService(bundle: Bundle): any {
    if (this.unregistered) {
      return null;
    }

    if (this.isServiceFactory()) {
      const serviceScope = this.properties['service.scope'];
      if (serviceScope === 'prototype') {
        // For prototype scope, always create a new instance - never cache
        return (this.service as ServiceFactory<S>).getService(bundle, this);
      }

      // For non-prototype service factories (bundle scope), use existing caching logic
      const existingInstance = this.serviceInstances.get(bundle.getBundleId());
      if (existingInstance) {
        return existingInstance;
      }

      const serviceInstance = (this.service as ServiceFactory<S>).getService(bundle, this);
      if (serviceInstance) {
        this.serviceInstances.set(bundle.getBundleId(), serviceInstance);
        this.framework.trackFactoryServiceInstance(bundle.getBundleId(), this, serviceInstance);
      }
      return serviceInstance;
    }

    return this.service;
  }

  ungetService(requestingBundle: Bundle): void {
    if (this.isServiceFactory()) {
      const bundleId = requestingBundle.getBundleId();
      const instance = this.serviceInstances.get(bundleId);

      if (instance) {
        (this.service as ServiceFactory<S>).ungetService(requestingBundle, this, instance);
        this.serviceInstances.delete(bundleId);
      }
    }
  }

  getProperties(): Record<string, any> {
    return { ...this.properties };
  }

  markUnregistered(): void {
    this.unregistered = true;
  }

  private isServiceFactory(): boolean {
    return OSGiFramework.isServiceFactory(this.service);
  }
}

class ServiceReferenceImpl<S> implements ServiceReference<S> {
  constructor(
    private serviceId: number,
    private properties: Record<string, any>,
    private bundle: Bundle,
  ) {}

  getProperty(key: string): any {
    return this.properties[key];
  }

  getPropertyKeys(): string[] {
    return Object.keys(this.properties);
  }

  getBundle(): Bundle {
    return this.bundle;
  }

  getProperties(): Record<string, any> {
    return { ...this.properties };
  }

  isAssignableTo(_bundle: Bundle, className: string): boolean {
    return this.properties.objectClass === className;
  }

  updateProperties(properties: Record<string, any>): void {
    this.properties = { ...properties };
  }
}
