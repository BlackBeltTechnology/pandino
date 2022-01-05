import {
  Bundle,
  Importer,
  FrameworkEventType,
  FrameworkListener,
  BundleActivator,
  BundleContext,
  BundleEventType,
  BundleListener,
  BundleManifestHeaders,
  ServiceEvent,
  ServiceProperties,
  BundleState,
  Logger,
  Fetcher,
  BUNDLE_ACTIVATOR,
  BUNDLE_NAME,
  BUNDLE_SYMBOLICNAME,
  BUNDLE_VERSION,
  FRAMEWORK_FETCHER,
  FRAMEWORK_UUID,
  SYSTEMBUNDLE_ACTIVATORS_PROP,
  LOG_LOGGER_PROP,
  LOG_LEVEL_PROP,
  LogLevel,
  ServiceListener,
  FilterApi,
  ServiceReference,
  ServiceRegistration,
  OBJECTCLASS,
  SYSTEM_BUNDLE_SYMBOLICNAME,
  PANDINO_IMPORTER_PROP,
  PANDINO_FETCHER_PROP,
  FRAMEWORK_IMPORTER,
  FRAMEWORK_LOGGER,
} from '@pandino/pandino-api';
import { BundleImpl } from './lib/framework/bundle-impl';
import { EventDispatcher } from './lib/framework/event-dispatcher';
import { BundleContextImpl } from './lib/framework/bundle-context-impl';
import { BundleEventImpl } from './lib/framework/bundle-event-impl';
import { BundleRevisionDependencies } from './lib/framework/bundle-revision-dependencies';
import { isAllPresent, isAnyMissing } from './lib/utils/helpers';
import { StatefulResolver } from './lib/framework/stateful-resolver';
import { ServiceRegistryImpl } from './lib/framework/service-registry-impl';
import { FrameworkEventImpl } from './lib/framework/framework-event-impl';
import { SemVer } from 'semver';
import { ConsoleLogger } from './lib/utils/console-logger';
import Filter from './lib/filter/filter';
import { ServiceEventImpl } from './lib/framework/service-event-impl';
import { BundleRevisionImpl } from './lib/framework/bundle-revision-impl';
import { VoidFetcher } from './lib/utils/void-fetcher';
import { VoidImporter } from './lib/utils/void-importer';
import { Framework } from './lib/framework/framework';
import { ServiceRegistry } from './lib/framework/service-registry';
import { ServiceRegistryCallbacks } from './lib/framework/service-registry-callbacks';

export default class Pandino extends BundleImpl implements Framework {
  private readonly fetcher: Fetcher;
  private readonly importer: Importer;
  private readonly configMap: Map<string, any> = new Map<string, any>();
  private readonly installedBundles: Bundle[] = [];
  private readonly activatorsList: BundleActivator[] = [];
  private readonly dispatcher: EventDispatcher;
  private readonly dependencies = new BundleRevisionDependencies();
  private readonly resolver: StatefulResolver;
  private readonly registry: ServiceRegistry;
  private nextId = 1;

  constructor(configMap: Record<string, any> = {}) {
    const logger: Logger = isAllPresent(configMap[LOG_LOGGER_PROP]) ? configMap[LOG_LOGGER_PROP] : new ConsoleLogger();
    const fetcher: Fetcher = isAllPresent(configMap[PANDINO_FETCHER_PROP])
      ? configMap[PANDINO_FETCHER_PROP]
      : new VoidFetcher();
    const importer: Importer = isAllPresent(configMap[PANDINO_IMPORTER_PROP])
      ? configMap[PANDINO_IMPORTER_PROP]
      : new VoidImporter();
    logger.setLogLevel(configMap[LOG_LEVEL_PROP] || LogLevel.LOG);

    super(logger, 0, {
      [BUNDLE_SYMBOLICNAME]: SYSTEM_BUNDLE_SYMBOLICNAME,
      [BUNDLE_VERSION]: '0.1.0',
      [BUNDLE_NAME]: 'Pandino Framework',
    }, '');

    this.fetcher = fetcher;
    this.importer = importer;
    Object.keys(configMap).forEach((configKey) => {
      this.configMap.set(configKey, configMap[configKey]);
    });
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

  getVersion(): SemVer {
    return new SemVer(this.getHeaders()[BUNDLE_VERSION]);
  }

  async start(): Promise<void> {
    try {
      if (this.getState() === 'INSTALLED' || this.getState() === 'RESOLVED') {
        await this.init();
      }
      if (this.getState() === 'STARTING') {
        // TODO: implement missing parts!
        this.getBundleContext().registerService(FRAMEWORK_LOGGER, this.logger);
        this.getBundleContext().registerService(FRAMEWORK_FETCHER, this.fetcher);
        this.getBundleContext().registerService(FRAMEWORK_IMPORTER, this.importer);
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
      if (this.getState() === 'INSTALLED' || this.getState() === 'RESOLVED') {
        this.configMap.set(FRAMEWORK_UUID, 'pandino-uuid-todo');
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

  async installBundle(origin: Bundle, locationOrHeaders: string | BundleManifestHeaders): Promise<Bundle> {
    if (this.getState() === 'STOPPING' || this.getState() === 'UNINSTALLED') {
      throw new Error('The framework has been shutdown.');
    }

    const resolvedHeaders: BundleManifestHeaders =
      typeof locationOrHeaders === 'string' ? await this.fetcher.fetch(locationOrHeaders) : locationOrHeaders;
    let bundle: BundleImpl;
    let existing: Bundle = this.isBundleInstalled(resolvedHeaders);

    if (!existing) {
      const id = this.getNextId();
      // FIXME: this could cause issues for loading JS via explicit Header spec!
      const manifestLocation = typeof locationOrHeaders === 'string' ? locationOrHeaders : '';
      bundle = new BundleImpl(this.logger, id, resolvedHeaders, manifestLocation, this, origin);
      this.installedBundles.push(bundle);
      this.fireBundleEvent('INSTALLED', bundle, origin);
      this.logger.info(`Installed Bundle: ${resolvedHeaders[BUNDLE_SYMBOLICNAME]}: ${resolvedHeaders[BUNDLE_VERSION]}`);
      await this.resolver.resolveOne(bundle.getCurrentRevision());
      return bundle;
    } else {
      await this.updateBundle(existing as BundleImpl, resolvedHeaders, origin);
      return existing;
    }
  }

  private async updateBundle(bundle: BundleImpl, headers: BundleManifestHeaders, origin: Bundle): Promise<Bundle> {
    if (bundle.getState() === 'STARTING' || bundle.getState() === 'STOPPING') {
      throw new Error('Bundle ' + bundle.toString() + ' cannot be updated, since it is either STARTING or STOPPING.');
    }
    let rethrow: Error;
    const oldState: BundleState = bundle.getState();

    if (oldState === 'ACTIVE') {
      await this.stopBundle(bundle);
    }

    try {
      bundle.revise(headers);
    } catch (ex) {
      this.logger.error('Unable to update the bundle.', ex);
      rethrow = ex;
    }

    if (isAnyMissing(rethrow)) {
      this.setBundleStateAndNotify(bundle, 'INSTALLED');
      this.fireBundleEvent('UNRESOLVED', bundle, origin);
      this.fireBundleEvent('UPDATED', bundle, origin);
    }

    if (oldState === 'ACTIVE') {
      await this.startBundle(bundle);
    }

    return bundle;
  }

  async startBundle(bundle: BundleImpl): Promise<void> {
    this.logger.info(`Starting Bundle: ${bundle.getSymbolicName()}: ${bundle.getVersion()}`);
    let rethrow: Error;
    const validStates: BundleState[] = ['RESOLVED', 'INSTALLED'];
    if (!['RESOLVED', 'INSTALLED'].includes(bundle.getState())) {
      throw new Error(
        `Cannot start ${bundle.getUniqueIdentifier()}, because it\'s not in any of the valid states: ${validStates.join(
          ', ',
        )}.`,
      );
    }

    bundle.setBundleContext(new BundleContextImpl(this.logger, bundle, this));
    this.setBundleStateAndNotify(bundle, 'STARTING');

    try {
      if (isAllPresent(bundle.getCurrentRevision().getWiring())) {
        await this.activateBundle(bundle, false);
      }
    } catch (ex) {
      rethrow = ex;
      this.logger.error(`Error while starting Bundle: ${bundle.getSymbolicName()}: ${bundle.getVersion()}`, ex);
    }

    if (isAnyMissing(rethrow)) {
      this.fireBundleEvent('STARTED', bundle);
      this.logger.info(`Started Bundle: ${bundle.getSymbolicName()}: ${bundle.getVersion()}`);
    } else {
      this.fireBundleEvent('STOPPED', bundle);
      throw rethrow;
    }
  }

  async activateBundle(bundle: BundleImpl, fireEvent: boolean): Promise<void> {
    this.logger.info(`Activating Bundle: ${bundle.getSymbolicName()}: ${bundle.getVersion()}`);
    if (bundle.getState() === 'ACTIVE') {
      return;
    }

    let rethrow: Error = null;
    try {
      const activator = await this.createBundleActivator(bundle);
      bundle.setActivator(activator);
    } catch (th) {
      rethrow = th;
    }

    try {
      this.fireBundleEvent('STARTING', bundle);

      if (isAllPresent(rethrow)) {
        throw rethrow;
      }

      if (isAllPresent(bundle.getActivator())) {
        await bundle.getActivator().start(bundle.getBundleContext());
      }

      this.setBundleStateAndNotify(bundle, 'ACTIVE');
      if (fireEvent) {
        this.fireBundleEvent('STARTED', bundle);
      }
    } catch (th) {
      this.logger.error(th);
      this.fireBundleEvent('STOPPING', bundle);

      this.setBundleStateAndNotify(bundle, 'RESOLVED');

      bundle.setActivator(null);

      const bci: BundleContextImpl = bundle.getBundleContext() as BundleContextImpl;
      bci.invalidate();
      bundle.setBundleContext(null);

      // this.registry.unregisterServices(bundle);
      // this.registry.ungetServices(bundle);

      this.dispatcher.removeListeners(bci);

      // Rethrow all other exceptions as a BundleException.
      throw new Error('Activator start error in bundle ' + bundle + ': ' + th);
    }
  }

  async stopBundle(bundle: BundleImpl): Promise<void> {
    // TODO: implement missing pieces

    try {
      let error: Error;
      let wasActive = false;

      switch (bundle.getState()) {
        case 'UNINSTALLED':
          throw new Error('Cannot stop an uninstalled bundle.');
        case 'STARTING':
        case 'STOPPING':
          throw new Error('Stopping a starting or stopping bundle is currently not supported.');
        case 'INSTALLED':
        case 'RESOLVED':
          return;
        case 'ACTIVE':
          wasActive = true;
          break;
      }

      bundle.setState('STOPPING');
      this.fireBundleEvent('STOPPING', bundle);

      if (wasActive || bundle.getBundleId() === 0) {
        try {
          if (typeof bundle.getActivator()?.stop === 'function') {
            await bundle.getActivator().stop(bundle.getBundleContext());
          }
        } catch (err) {
          error = err;
        }
      }

      if (bundle.getBundleId() !== 0) {
        bundle.setActivator(null);
        const bci: BundleContextImpl = bundle.getBundleContext() as BundleContextImpl;
        bci.invalidate();
        bundle.setBundleContext(null);
        this.dispatcher.removeListeners(bci);
        bundle.setState('RESOLVED');
      }

      if (!!error) {
        throw new Error('Activator stop error in bundle ' + bundle + ': ' + error);
      }
    } finally {
    }

    this.fireBundleEvent('STOPPED', bundle);

    for (const requirer of this.resolver.getActiveRequirers(bundle)) {
      await this.stopBundle(requirer);
    }
  }

  getBundle(id: number): Bundle {
    return this.installedBundles.find((b) => b.getBundleId() === id);
  }

  isBundleInstalled(headers: BundleManifestHeaders): Bundle | undefined {
    return this.installedBundles.find((b) => b.getSymbolicName() === headers['Bundle-SymbolicName']);
  }

  fireBundleEvent(type: BundleEventType, bundle: Bundle, origin?: Bundle): void {
    this.dispatcher.fireBundleEvent(new BundleEventImpl(bundle, type, origin), this);
  }

  fireFrameworkEvent(type: FrameworkEventType, bundle: Bundle, error?: Error): void {
    this.dispatcher.fireFrameworkEvent(new FrameworkEventImpl(type, bundle, error), this);
  }

  getProperty(key: string): string {
    // TODO: add fallback getter source, e.g.: LocalStorage or SessionStorage
    return this.configMap.get(key);
  }

  getBundles(bc?: BundleContext): Bundle[] {
    return [...this.installedBundles];
  }

  addBundleListener(bundle: BundleImpl, l: BundleListener): void {
    this.dispatcher.addListener(bundle.getBundleContext(), 'BUNDLE', l, null);
  }

  removeBundleListener(bundle: BundleImpl, l: BundleListener): void {
    this.dispatcher.removeListener(bundle.getBundleContext(), 'BUNDLE', l);
  }

  addServiceListener(bundle: BundleImpl, listener: ServiceListener, filter?: string): void {
    const newFilter: FilterApi = isAnyMissing(filter) ? null : Filter.parse(filter);

    this.dispatcher.addListener(bundle.getBundleContext(), 'SERVICE', listener, newFilter);
  }

  removeServiceListener(bundle: BundleImpl, l: ServiceListener): void {
    this.dispatcher.removeListener(bundle.getBundleContext(), 'SERVICE', l);
  }

  addFrameworkListener(bundle: BundleImpl, l: FrameworkListener): void {
    this.dispatcher.addListener(bundle.getBundleContext(), 'FRAMEWORK', l, null);
  }

  removeFrameworkListener(bundle: BundleImpl, l: FrameworkListener): void {
    this.dispatcher.removeListener(bundle.getBundleContext(), 'FRAMEWORK', l);
  }

  getConfig(): Record<string, any> {
    return this.configMap;
  }

  getDependencies(): BundleRevisionDependencies {
    return this.dependencies;
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
    const desiredStates: BundleState[] = ['INSTALLED', 'RESOLVED', 'STARTING', 'ACTIVE', 'STOPPING'];

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

    if (bundle.getState() === 'ACTIVE') {
      try {
        await this.stopBundle(bundle);
      } catch (err) {
        this.fireFrameworkEvent('ERROR', bundle, err);
      }
    }

    const installedIdx = this.installedBundles.findIndex((bnd) => bnd.getBundleId() === bundle.getBundleId());

    if (installedIdx === -1) {
      this.logger.error(
        `Cannot uninstall Bundle ${bundle.getUniqueIdentifier()}, because it was not found in the list of installed bundles!`,
        bundle,
      );
    } else {
      this.installedBundles.splice(installedIdx, 1);
    }

    this.fireBundleEvent('UNRESOLVED', bundle);
    bundle.setState('UNINSTALLED');

    return Promise.resolve();
  }

  getAllowedServiceReferences(
    bundle: BundleImpl,
    className: string,
    expr?: string,
    checkAssignable = false,
  ): ServiceReference<any>[] {
    const refs: ServiceReference<any>[] = this.getServiceReferences(bundle, className, expr, checkAssignable);

    return isAnyMissing(refs) ? [] : [...refs];
  }

  private getServiceReferences(
    bundle: BundleImpl,
    className: string,
    expr?: string,
    checkAssignable = false,
  ): ServiceReference<any>[] {
    let filter: FilterApi = null;
    if (isAllPresent(expr)) {
      filter = Filter.parse(expr);
    }

    const refList = this.registry.getServiceReferences(className, filter) as unknown as ServiceReference<any>[];
    const effectiveRefList: ServiceReference<any>[] = [];

    if (checkAssignable) {
      for (const ref of refList) {
        if (Pandino.isServiceAssignable(bundle, ref)) {
          effectiveRefList.push(ref);
        }
      }
    }

    if (effectiveRefList.length > 0) {
      return effectiveRefList;
    }

    return null;
  }

  private getNextId(): number {
    const n = this.nextId;
    this.nextId++;
    return n;
  }

  private async createBundleActivator(impl: BundleImpl): Promise<BundleActivator> {
    let activator: BundleActivator = null;
    let headerMap: Record<string, any> = impl.getHeaders();
    let activatorDefinition: string | BundleActivator = headerMap[BUNDLE_ACTIVATOR];
    if (isAnyMissing(activatorDefinition)) {
      return Promise.reject('Missing mandatory Bundle Activator!');
    } else if (typeof activatorDefinition === 'string') {
      const activatorPath = Pandino.calculateEffectiveActivatorPath(activatorDefinition, impl.getManifestLocation());
      this.logger.info(`Attempting to load Activator from: ${activatorPath}`);
      let activatorInstance: any;
      try {
        activatorInstance = (await this.importer.import(activatorPath)).default;
      } catch (ex) {
        return Promise.reject('Not found: ' + activatorPath + ': ' + ex);
      }
      activator =
        typeof activatorInstance === 'function' ? (new activatorInstance() as BundleActivator) : activatorInstance;
    } else {
      return Promise.resolve(impl.getActivator());
    }

    return Promise.resolve(activator);
  }

  private static calculateEffectiveActivatorPath(activatorDefinition: string, manifestLocation: string): string {
    // FIXME: this won't work on Windows with NodeJS, consider providing pre-built importer packages!
    const safeActivatorDefinition = activatorDefinition.trim().split('/').pop().trim();
    const lastSlashIndex = manifestLocation.lastIndexOf('/');
    const pathStart = lastSlashIndex > -1 ? manifestLocation.substring(0, lastSlashIndex).trim() : manifestLocation.trim();
    return pathStart.length ? pathStart + '/' + safeActivatorDefinition : safeActivatorDefinition;
  }

  private async refreshBundle(bundle: BundleImpl): Promise<void> {
    try {
      let fire: boolean = bundle.getState() !== 'INSTALLED';
      this.dependencies.removeDependencies(bundle);
      await bundle.refresh();
      if (fire) {
        this.setBundleStateAndNotify(bundle, 'INSTALLED');
        this.fireBundleEvent('UNRESOLVED', bundle);
      }
    } catch (ex) {
      this.fireFrameworkEvent('ERROR', bundle, ex);
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

  getService<S>(bundle: Bundle, ref: ServiceReference<S>, isServiceObjects: boolean): S {
    try {
      return this.registry.getService(bundle, ref, isServiceObjects);
    } catch (ex) {
      this.fireFrameworkEvent('ERROR', bundle, ex);
    }

    return null;
  }

  ungetService(bundle: Bundle, ref: ServiceReference<any>, srvObj: any): boolean {
    return this.registry.ungetService(bundle, ref, srvObj);
  }

  registerService<S>(
    context: BundleContextImpl,
    identifier: string[] | string,
    svcObj: S,
    dict: Record<any, any>,
  ): ServiceRegistration<S> {
    let reg = this.registry.registerService(context.getBundle(), identifier, svcObj, dict);

    this.fireServiceEvent(new ServiceEventImpl('REGISTERED', reg.getReference()), {});

    return reg;
  }
}
