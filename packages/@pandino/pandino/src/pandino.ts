import {
  BUNDLE_ACTIVATOR,
  BUNDLE_NAME,
  BUNDLE_SYMBOLICNAME,
  BUNDLE_TYPE,
  BUNDLE_VERSION,
  DEPLOYMENT_ROOT_PROP,
  FRAMEWORK_BUNDLE_IMPORTER,
  FRAMEWORK_EVALUATE_FILTER,
  FRAMEWORK_LOGGER,
  FRAMEWORK_MANIFEST_FETCHER,
  FRAMEWORK_SERVICE_UTILS,
  LOG_LEVEL_PROP,
  LOG_LOGGER_PROP,
  OBJECTCLASS,
  PANDINO_ACTIVATOR_RESOLVERS,
  PANDINO_BUNDLE_IMPORTER_PROP,
  PANDINO_MANIFEST_FETCHER_PROP,
  SYSTEM_BUNDLE_LOCATION,
  SYSTEM_BUNDLE_SYMBOLICNAME,
  SYSTEMBUNDLE_ACTIVATORS_PROP,
  LogLevel,
} from '@pandino/pandino-api';
import type {
  ActivatorResolver,
  Bundle,
  BundleActivator,
  BundleContext,
  BundleEventType,
  BundleImporter,
  BundleListener,
  BundleManifestHeaders,
  BundleState,
  BundleType,
  FrameworkConfigMap,
  FrameworkEventType,
  FrameworkListener,
  Logger,
  ManifestFetcher,
  ServiceEvent,
  ServiceFactory,
  ServiceListener,
  ServiceProperties,
  ServiceReference,
  ServiceRegistration,
  ServiceUtils,
} from '@pandino/pandino-api';
import { evaluateFilter } from '@pandino/filters';
import type { FilterEvaluator } from '@pandino/filters';
import { ConsoleLogger, VoidFetcher, VoidImporter, serviceUtilsImpl } from './lib/utils';
import {
  BundleContextImpl,
  BundleEventImpl,
  BundleImpl,
  BundleRevisionImpl,
  EsmActivatorResolver,
  EventDispatcher,
  FrameworkEventImpl,
  ServiceEventImpl,
  ServiceRegistryImpl,
  StatefulResolver,
} from './lib/framework';
import type { Framework, ServiceRegistry, ServiceRegistryCallbacks } from './lib/framework';

export class Pandino extends BundleImpl implements Framework {
  private readonly fetcher: ManifestFetcher;
  private readonly importer: BundleImporter;
  private readonly configMap: Map<string, any> = new Map<string, any>();
  private readonly bundles: Bundle[] = [];
  private readonly activatorsList: BundleActivator[] = [];
  private readonly dispatcher: EventDispatcher;
  private readonly resolver: StatefulResolver;
  private readonly registry: ServiceRegistry;
  private nextId = 1;

  constructor(configMap: FrameworkConfigMap) {
    const deploymentRoot: string | undefined = configMap[DEPLOYMENT_ROOT_PROP];
    const logger: Logger = configMap[LOG_LOGGER_PROP] ? configMap[LOG_LOGGER_PROP]! : new ConsoleLogger();
    const fetcher: ManifestFetcher = configMap[PANDINO_MANIFEST_FETCHER_PROP]
      ? configMap[PANDINO_MANIFEST_FETCHER_PROP]
      : new VoidFetcher();
    const importer: BundleImporter = configMap[PANDINO_BUNDLE_IMPORTER_PROP]
      ? configMap[PANDINO_BUNDLE_IMPORTER_PROP]
      : new VoidImporter();
    logger.setLogLevel(configMap[LOG_LEVEL_PROP] || LogLevel.LOG);

    if (!configMap[PANDINO_ACTIVATOR_RESOLVERS]) {
      // @ts-ignore
      configMap[PANDINO_ACTIVATOR_RESOLVERS] = {
        esm: new EsmActivatorResolver(),
      };
    }

    if (!configMap[PANDINO_ACTIVATOR_RESOLVERS].esm) {
      configMap[PANDINO_ACTIVATOR_RESOLVERS].esm = new EsmActivatorResolver();
    }

    super(
      logger,
      0,
      {
        [BUNDLE_SYMBOLICNAME]: SYSTEM_BUNDLE_SYMBOLICNAME,
        [BUNDLE_VERSION]: '0.1.0',
        [BUNDLE_NAME]: 'Pandino Framework',
      },
      '',
      deploymentRoot,
    );

    this.fetcher = fetcher;
    this.importer = importer;
    Object.keys(configMap).forEach((configKey) => {
      this.configMap.set(configKey, configMap[configKey]);
    });
    if (deploymentRoot) {
      this.configMap.set(DEPLOYMENT_ROOT_PROP, deploymentRoot);
    }
    this.activatorsList = this.configMap.get(SYSTEMBUNDLE_ACTIVATORS_PROP) || [];
    this.registry = new ServiceRegistryImpl(
      this.logger,
      ((pandino) =>
        new (class implements ServiceRegistryCallbacks {
          serviceChanged(event: ServiceEvent, oldProps: ServiceProperties): void {
            pandino.fireServiceEvent(event, oldProps);
          }
        })())(this),
    );
    this.resolver = new StatefulResolver(this.logger, this, this.registry);
    this.dispatcher = new EventDispatcher(this.logger);
    const rev = new BundleRevisionImpl(this, '0', {
      [BUNDLE_SYMBOLICNAME]: SYSTEM_BUNDLE_SYMBOLICNAME,
      [BUNDLE_VERSION]: '0.1.0',
      [BUNDLE_NAME]: 'Pandino Framework',
    });
    this.addRevision(rev);
  }

  getBundleId(): number {
    return 0;
  }

  getFramework(): Pandino {
    return this;
  }

  getSymbolicName(): string {
    return this.getHeaders()[BUNDLE_SYMBOLICNAME];
  }

  getVersion(): string {
    return this.getHeaders()[BUNDLE_VERSION]!;
  }

  async start(): Promise<void> {
    try {
      if (this.getState() === 'INSTALLED') {
        await this.init();
      }
      if (this.getState() === 'STARTING') {
        this.getBundleContext().registerService<Logger>(FRAMEWORK_LOGGER, this.logger);
        this.getBundleContext().registerService<ManifestFetcher>(FRAMEWORK_MANIFEST_FETCHER, this.fetcher);
        this.getBundleContext().registerService<BundleImporter>(FRAMEWORK_BUNDLE_IMPORTER, this.importer);
        this.getBundleContext().registerService<FilterEvaluator>(FRAMEWORK_EVALUATE_FILTER, evaluateFilter);
        this.getBundleContext().registerService<ServiceUtils>(FRAMEWORK_SERVICE_UTILS, serviceUtilsImpl);
        this.setBundleStateAndNotify(this, 'ACTIVE');
      }
    } catch (err) {
      this.logger.error(err);
    }

    this.fireBundleEvent('STARTED', this);
    this.fireFrameworkEvent('STARTED', this);
  }

  async init(...listeners: FrameworkListener[]): Promise<void> {
    try {
      if (this.getState() === 'INSTALLED') {
        this.setBundleContext(new BundleContextImpl(this.logger, this, this));
        this.setState('STARTING');
        for (const listener of listeners) {
          this.addFrameworkListener(this, listener);
        }
        // try {
        //   await this.getActivator().start(this.getBundleContext());
        // } catch (ex) {
        //   throw new Error('Unable to start system bundle.');
        // }
      }
    } catch (err) {
      await this.stopBundle(this);

      this.setState('INSTALLED');
    }
  }

  async installBundle(origin: Bundle, locationOrHeaders: string | BundleManifestHeaders): Promise<Bundle | undefined> {
    if (this.getState() === 'STOPPING' || this.getState() === 'UNINSTALLED') {
      throw new Error('The framework has been shutdown.');
    }

    const resolvedHeaders: BundleManifestHeaders =
      typeof locationOrHeaders === 'string'
        ? await this.fetcher.fetch(locationOrHeaders, this.getDeploymentRoot())
        : locationOrHeaders;
    let bundle: BundleImpl;
    let existing = this.isBundlePresent(resolvedHeaders);

    if (!existing) {
      const id = this.getNextId();
      // FIXME: this could cause issues for loading JS via explicit Header spec!
      const manifestLocation = typeof locationOrHeaders === 'string' ? locationOrHeaders : '';
      bundle = new BundleImpl(
        this.logger,
        id,
        resolvedHeaders,
        manifestLocation,
        this.getDeploymentRoot(),
        this,
        origin,
      );
      this.bundles.push(bundle);
      this.fireBundleEvent('INSTALLED', bundle, origin);
      this.logger.info(`Installed Bundle: ${resolvedHeaders[BUNDLE_SYMBOLICNAME]}: ${resolvedHeaders[BUNDLE_VERSION]}`);
      await this.resolver.resolveOne(bundle.getCurrentRevision());
      return bundle;
    } else {
      try {
        await this.updateBundle(existing as BundleImpl, resolvedHeaders, origin);
        await this.resolver.resolveOne((existing as BundleImpl).getCurrentRevision());
        return existing;
      } catch (err) {
        this.logger.error(err);
        return Promise.resolve(undefined);
      }
    }
  }

  async updateBundle(bundle: BundleImpl, headers: BundleManifestHeaders, origin?: Bundle): Promise<Bundle> {
    if (bundle.getState() === 'STARTING' || bundle.getState() === 'STOPPING') {
      throw new Error(
        'Bundle ' + bundle.getUniqueIdentifier() + ' cannot be updated, since it is either STARTING or STOPPING.',
      );
    }
    let rethrow: Error | undefined;
    const oldState: BundleState = bundle.getState();

    if (oldState === 'ACTIVE') {
      await this.stopBundle(bundle);
    }

    try {
      bundle.revise(headers);
    } catch (ex: any) {
      this.logger.error('Unable to update the bundle.', ex);
      rethrow = ex;
    }

    if (!rethrow) {
      this.setBundleStateAndNotify(bundle, 'INSTALLED');
      this.fireBundleEvent('UNRESOLVED', bundle, origin);
      this.fireBundleEvent('UPDATED', bundle, origin);
    }

    if (oldState === 'ACTIVE') {
      await this.startBundle(bundle);
    }

    return bundle;
  }

  async startBundle(bundle: BundleImpl): Promise<void> | never {
    this.logger.info(`Starting Bundle: ${bundle.getSymbolicName()}: ${bundle.getVersion()}`);
    let rethrow: Error | undefined;
    const validStates: BundleState[] = ['INSTALLED'];
    if (!validStates.includes(bundle.getState())) {
      throw new Error(
        `Cannot start ${bundle.getUniqueIdentifier()}, because it\'s not in any of the valid states: ${validStates.join(
          ', ',
        )}.`,
      );
    }

    bundle.setBundleContext(new BundleContextImpl(this.logger, bundle, this));
    this.setBundleStateAndNotify(bundle, 'STARTING');

    try {
      const revision = bundle.getCurrentRevision();
      const wiring = revision.getWiring() || this.resolver.createWiringForRevision(revision);
      if (wiring && wiring.allWireProvidersInAnyState(['ACTIVE'])) {
        await this.activateBundle(bundle, false);
      }
    } catch (ex: any) {
      rethrow = ex;
      this.logger.error(`Error while starting Bundle: ${bundle.getSymbolicName()}: ${bundle.getVersion()}`, ex);
    }

    if (bundle.getState() === 'ACTIVE') {
      this.fireBundleEvent('STARTED', bundle);
      this.logger.info(`Started Bundle: ${bundle.getSymbolicName()}: ${bundle.getVersion()}`);
      await this.resolver.resolveRemaining();
    } else {
      bundle.setState('INSTALLED');
      this.fireBundleEvent('STOPPED', bundle);
      if (rethrow) {
        throw rethrow;
      }
    }
  }

  async activateBundle(bundle: BundleImpl, fireEvent: boolean): Promise<void> | never {
    this.logger.info(`Activating Bundle: ${bundle.getSymbolicName()}: ${bundle.getVersion()}`);
    if (bundle.getState() === 'ACTIVE') {
      return;
    }

    let rethrow: Error | undefined;
    try {
      const activator = await this.createBundleActivator(bundle);
      bundle.setActivator(activator);
    } catch (th: any) {
      rethrow = th;
    }

    try {
      this.fireBundleEvent('STARTING', bundle);

      if (rethrow) {
        throw rethrow;
      }

      if (bundle.getActivator()) {
        await bundle.getActivator().start(bundle.getBundleContext());
      }

      this.setBundleStateAndNotify(bundle, 'ACTIVE');
      if (fireEvent) {
        this.fireBundleEvent('STARTED', bundle);
      }
    } catch (th) {
      this.logger.error(th);
      this.fireBundleEvent('STOPPING', bundle);

      this.setBundleStateAndNotify(bundle, 'INSTALLED');

      bundle.setActivator(undefined);

      const bci: BundleContextImpl = bundle.getBundleContext() as BundleContextImpl;
      bci.invalidate();
      bci.closeTrackers();
      bundle.setBundleContext(undefined);

      this.registry.unregisterServices(bundle);
      this.registry.ungetServices(bundle);
      this.dispatcher.removeListeners(bci as BundleContext);

      // Rethrow all other exceptions as a BundleException.
      throw new Error('Activator start error in bundle ' + bundle + ': ' + th);
    }
  }

  async stopBundle(bundle: BundleImpl): Promise<void> | never {
    try {
      let error: Error | undefined;
      let wasActive = false;

      switch (bundle.getState()) {
        case 'UNINSTALLED':
          throw new Error('Cannot stop an uninstalled bundle.');
        case 'STARTING':
        case 'STOPPING':
          throw new Error('Stopping a starting or stopping bundle is currently not supported.');
        case 'INSTALLED':
          return;
        case 'ACTIVE':
          wasActive = true;
          break;
      }

      this.logger.info(`Stopping Bundle: ${bundle.getUniqueIdentifier()}...`);
      bundle.setState('STOPPING');
      this.fireBundleEvent('STOPPING', bundle);

      if (wasActive || bundle.getBundleId() === 0) {
        try {
          if (typeof bundle.getActivator()?.stop === 'function') {
            await bundle.getActivator().stop(bundle.getBundleContext());
          }
        } catch (err: any) {
          error = err;
        }
      }

      if (bundle.getBundleId() !== 0) {
        bundle.setActivator(undefined);
        const bci: BundleContextImpl = bundle.getBundleContext() as BundleContextImpl;
        bci.invalidate();
        bci.closeTrackers();
        bundle.setBundleContext(undefined);

        // Unregister any services offered by this bundle.
        this.registry.unregisterServices(bundle);

        // Release any services being used by this bundle.
        this.registry.ungetServices(bundle);

        // The spec says that we must remove all event listeners for a bundle when it is stopped.
        this.dispatcher.removeListeners(bci as BundleContext);

        bundle.setState('INSTALLED');
      }

      if (!!error) {
        throw new Error('Activator stop error in bundle ' + bundle + ': ' + error);
      }
    } finally {
    }

    for (const requirer of this.resolver.getActiveRequirers(bundle)) {
      await this.stopBundle(requirer);
    }

    this.logger.info(`Stopped Bundle: ${bundle.getUniqueIdentifier()}...`);
    this.fireBundleEvent('STOPPED', bundle);
  }

  getBundle(id: number): Bundle | undefined {
    return this.bundles.find((b) => b.getBundleId() === id);
  }

  isBundlePresent(headers: BundleManifestHeaders): Bundle | undefined {
    return this.bundles.find((b) => b.getSymbolicName() === headers[BUNDLE_SYMBOLICNAME]);
  }

  fireBundleEvent(type: BundleEventType, bundle: Bundle, origin?: Bundle): void {
    this.dispatcher.fireBundleEvent(new BundleEventImpl(bundle, type, origin), this);
  }

  fireFrameworkEvent(type: FrameworkEventType, bundle: Bundle, error?: Error): void {
    this.dispatcher.fireFrameworkEvent(new FrameworkEventImpl(type, bundle, error), this);
  }

  getProperty(key: string): string {
    return this.configMap.get(key);
  }

  getBundles(bc?: BundleContext): Bundle[] {
    return [...this.bundles];
  }

  addBundleListener(bundle: BundleImpl, l: BundleListener): void {
    this.dispatcher.addListener?.(bundle.getBundleContext(), 'BUNDLE', l, undefined);
  }

  removeBundleListener(bundle: BundleImpl, l: BundleListener): void {
    this.dispatcher.removeListener(bundle.getBundleContext(), 'BUNDLE', l);
  }

  addServiceListener(bundle: BundleImpl, listener: ServiceListener, filter?: string): void {
    this.dispatcher.addListener(bundle.getBundleContext(), 'SERVICE', listener, filter);
  }

  removeServiceListener(bundle: BundleImpl, l: ServiceListener): void {
    this.dispatcher.removeListener(bundle.getBundleContext(), 'SERVICE', l);
  }

  addFrameworkListener(bundle: BundleImpl, l: FrameworkListener): void {
    this.dispatcher.addListener(bundle.getBundleContext(), 'FRAMEWORK', l, undefined);
  }

  removeFrameworkListener(bundle: BundleImpl, l: FrameworkListener): void {
    this.dispatcher.removeListener(bundle.getBundleContext(), 'FRAMEWORK', l);
  }

  getConfig(): Record<string, any> {
    return this.configMap;
  }

  getActivatorsList(): BundleActivator[] {
    return this.activatorsList;
  }

  fireServiceEvent(event: ServiceEvent, oldProps: Record<string, any>): void {
    this.dispatcher.fireServiceEvent(event, oldProps);
  }

  setBundleStateAndNotify(bundle: BundleImpl, state: BundleState): void {
    bundle.setState(state);
  }

  getResolver(): StatefulResolver {
    return this.resolver;
  }

  async uninstallBundle(bundle: BundleImpl): Promise<void> {
    this.logger.info(`Uninstalling Bundle: ${bundle.getUniqueIdentifier()}...`);
    const desiredStates: BundleState[] = ['INSTALLED', 'STARTING', 'ACTIVE', 'STOPPING'];

    if (!desiredStates.includes(bundle.getState())) {
      if (bundle.getState() === 'UNINSTALLED') {
        throw new Error('Cannot uninstall an uninstalled bundle.');
      } else {
        throw new Error(
          `Bundle ${bundle.getUniqueIdentifier()} cannot be uninstalled because it is in an undesired state: ${bundle.getState()}`,
        );
      }
    }

    if (bundle.getState() === 'STARTING' || bundle.getState() === 'STOPPING') {
      throw new Error(
        'Bundle ' + bundle.getUniqueIdentifier() + ' cannot be uninstalled, since it is either STARTING or STOPPING.',
      );
    }

    let errored = null;

    if (bundle.getState() === 'ACTIVE') {
      try {
        await this.stopBundle(bundle);
      } catch (err: any) {
        this.logger.error(`Error stopping bundle: ${bundle.getUniqueIdentifier()}`, err);
        this.fireFrameworkEvent('ERROR', bundle, err);
        errored = err;
      }
    }

    this.fireBundleEvent('UNRESOLVED', bundle);
    if (!errored) {
      bundle.setState('UNINSTALLED');
      this.fireBundleEvent('UNINSTALLED', bundle);
      this.logger.info(`Uninstalled bundle: ${bundle.getUniqueIdentifier()}`);
    }
  }

  getAllowedServiceReferences(
    bundle: BundleImpl,
    className?: string,
    filter?: string,
    checkAssignable = false,
  ): ServiceReference<any>[] {
    const refs: ServiceReference<any>[] = this.getServiceReferences(bundle, className, filter, checkAssignable);

    return refs ?? [];
  }

  private getServiceReferences(
    bundle: BundleImpl,
    className?: string,
    filter?: string,
    checkAssignable = false,
  ): ServiceReference<any>[] {
    const refList = this.registry.getServiceReferences(className, filter) as unknown as ServiceReference<any>[];
    const effectiveRefList: ServiceReference<any>[] = [];

    if (checkAssignable) {
      for (const ref of refList) {
        if (Pandino.isServiceAssignable(bundle, ref)) {
          effectiveRefList.push(ref);
        }
      }
    } else {
      effectiveRefList.push(...refList);
    }

    if (effectiveRefList.length > 0) {
      return effectiveRefList;
    }

    return [];
  }

  private getNextId(): number {
    const n = this.nextId;
    this.nextId++;
    return n;
  }

  private async createBundleActivator(impl: BundleImpl): Promise<BundleActivator> | never {
    let headerMap: BundleManifestHeaders = impl.getHeaders();
    let activatorDefinition = headerMap[BUNDLE_ACTIVATOR];

    if (!activatorDefinition) {
      throw new Error('Missing mandatory Bundle Activator!');
    } else if (typeof activatorDefinition === 'string') {
      this.logger.debug(`Attempting to load Activator from: ${activatorDefinition}`);

      let activatorInstance: any;
      const activatorModule = await this.importer.import(
        activatorDefinition,
        impl.getLocation(),
        impl.getDeploymentRoot(),
      );
      const bundleType: BundleType = impl.getHeaders()[BUNDLE_TYPE] || 'esm';
      const activatorResolver: ActivatorResolver = this.configMap.get(PANDINO_ACTIVATOR_RESOLVERS)[bundleType];

      if (!activatorResolver) {
        throw new Error(`No ActivatorResolver can be found in configuration for BundleType: ${bundleType}!`);
      }

      activatorInstance = activatorResolver.resolve(activatorModule, impl.getHeaders());

      if (!activatorInstance) {
        throw new Error(
          `Activator for ${impl
            .getCurrentRevision()
            .getSymbolicName()} could not be loaded! Resolver probably returned undefined. Please check corresponding ActivatorResolver!`,
        );
      }

      return typeof activatorInstance === 'function' ? (new activatorInstance() as BundleActivator) : activatorInstance;
    } else {
      return impl.getActivator();
    }
  }

  private static isServiceAssignable(requester: Bundle, ref: ServiceReference<any>): boolean {
    let allow = true;
    const objectClass: string[] | string = ref.getProperty(OBJECTCLASS);

    if (Array.isArray(objectClass)) {
      for (let classIdx = 0; allow && classIdx < objectClass.length; classIdx++) {
        if (!ref.isAssignableTo(requester, objectClass[classIdx])) {
          allow = false;
        }
      }
    } else {
      if (!ref.isAssignableTo(requester, objectClass)) {
        allow = false;
      }
    }

    return allow;
  }

  getService<S>(bundle: Bundle, ref: ServiceReference<S>, isServiceObjects: boolean): S | undefined {
    try {
      return this.registry.getService(bundle, ref, isServiceObjects);
    } catch (ex: any) {
      this.fireFrameworkEvent('ERROR', bundle, ex);
    }

    return undefined;
  }

  ungetService(bundle: Bundle, ref: ServiceReference<any>, srvObj: any): boolean {
    return this.registry.ungetService(bundle, ref, srvObj);
  }

  registerService<S>(
    context: BundleContextImpl,
    identifier: string[] | string,
    svcObj: S | ServiceFactory<S>,
    dict: Record<any, any>,
  ): ServiceRegistration<S> {
    let reg = this.registry.registerService(context.getBundle()!, identifier, svcObj, dict);

    this.fireServiceEvent(new ServiceEventImpl('REGISTERED', reg.getReference()), {});

    return reg;
  }

  getLocation(): string {
    return SYSTEM_BUNDLE_LOCATION;
  }

  getBundleRegisteredServices(bundle: BundleImpl): ServiceReference<any>[] {
    if (bundle.getState() === 'UNINSTALLED') {
      throw new Error('The bundle is uninstalled.');
    }

    return this.registry.getRegisteredServices(bundle);
  }
}
