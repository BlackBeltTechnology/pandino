import {
  Bundle,
  Importer,
  Framework,
  FrameworkEventType,
  FrameworkListener,
  BundleActivator,
  BundleContext,
  BundleEventType,
  BundleListener,
  BundleManifestHeaders,
  ServiceEvent,
  ServiceProperties,
  ServiceRegistry,
  ServiceRegistryCallbacks,
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
import { pandinoFetcher } from './lib/framework/util/fetcher';
import { ConsoleLogger } from './lib/utils/console-logger';

export default class Pandino extends BundleImpl implements Framework {
  private readonly fetcher: Fetcher;
  private readonly importer: Importer;
  private readonly configMap: Map<string, any>;
  private readonly bundleLocationMap: Map<string, Bundle> = new Map<string, Bundle>();
  private readonly installedBundles: Bundle[] = [];
  private readonly activatorsList: BundleActivator[] = [];
  // private readonly registry: ServiceRegistryImpl;
  private readonly dispatcher: EventDispatcher;
  private readonly dependencies = new BundleRevisionDependencies();
  private readonly resolver: StatefulResolver;
  private readonly registry: ServiceRegistry;
  private nextId = 1;

  constructor(importer: Importer, configMap: Map<string, any> = new Map<string, any>()) {
    const logger: Logger = configMap.has(LOG_LOGGER_PROP) ? configMap.get(LOG_LOGGER_PROP) : new ConsoleLogger();
    try {
      logger.setLogLevel(configMap.get(LOG_LEVEL_PROP) || LogLevel.INFO);
    } catch (ex) {
      // Ignore and just use the default logging level.
    }
    super(logger, 0, {
      [BUNDLE_SYMBOLICNAME]: 'io.pandino.framework',
      [BUNDLE_VERSION]: '0.1.0',
      [BUNDLE_NAME]: 'Pandino Framework',
    });

    this.importer = importer;
    this.configMap = configMap;
    this.installedBundles = [];
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
    this.fetcher = configMap.get(FRAMEWORK_FETCHER) || pandinoFetcher;
    this.resolver = new StatefulResolver(this.logger, this, this.registry);
    this.dispatcher = new EventDispatcher(this.logger);
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
        this.setBundleStateAndNotify(this, 'ACTIVE');
      }
    } finally {
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
    } finally {
      for (const listener of listeners) {
        this.removeFrameworkListener(this, listener);
      }
    }
  }

  async registerDocumentDefinedManifests(): Promise<void> {
    const documentDefinedManifest = document.querySelector('script[type="pandino-manifests"]');
    let locations: string[] = [];
    if (documentDefinedManifest.hasAttribute('src')) {
      locations = await this.fetcher(documentDefinedManifest.getAttribute('src'));
    } else {
      locations = documentDefinedManifest ? JSON.parse(documentDefinedManifest.textContent) : [];
    }

    locations.forEach((manifestLocation) => this.getBundleContext().installBundle(manifestLocation));
  }

  async installBundle(origin: Bundle, locationOrHeaders: string | BundleManifestHeaders): Promise<Bundle> {
    if (this.getState() === 'STOPPING' || this.getState() === 'UNINSTALLED') {
      throw new Error('The framework has been shutdown.');
    }

    const resolvedHeaders: BundleManifestHeaders =
      typeof locationOrHeaders === 'string' ? await this.fetcher(locationOrHeaders) : locationOrHeaders;
    let bundle: BundleImpl;
    let existing: Bundle = this.isBundleInstalled(resolvedHeaders);

    if (!existing) {
      const id = this.getNextId();
      bundle = new BundleImpl(this.logger, id, resolvedHeaders, this, origin);
      this.installedBundles.push(bundle);
      this.fireBundleEvent('INSTALLED', bundle, origin);
      this.logger.info(`Installed Bundle: ${resolvedHeaders[BUNDLE_SYMBOLICNAME]}: ${resolvedHeaders[BUNDLE_VERSION]}`);
      await this.resolver.resolveAll();
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
    this.dispatcher.fireServiceEvent(event, this, oldProps);
  }

  setBundleStateAndNotify(bundle: BundleImpl, state: BundleState): void {
    bundle.setState(state);
  }

  getResolver(): StatefulResolver {
    return this.resolver;
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
      activatorDefinition = activatorDefinition.trim();
      let activatorInstance: any;
      try {
        activatorInstance = (await this.importer(activatorDefinition)).default;
      } catch (ex) {
        return Promise.reject('Not found: ' + activatorDefinition + ': ' + ex);
      }
      activator =
        typeof activatorInstance === 'function' ? (new activatorInstance() as BundleActivator) : activatorInstance;
    } else {
      return Promise.resolve(impl.getActivator());
    }

    return Promise.resolve(activator);
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

  // registerService<S>(context: BundleContextImpl, identifier: string, svcObj: S, dict: Record<any, any>): ServiceRegistration<S> {
  //   let reg = this.registry.registerService(context.getBundle(), identifier, svcObj, dict);
  //
  //   this.fireServiceEvent(new ServiceEventImpl('REGISTERED', reg.getReference()), {});
  //
  //   return reg;
  // }

  // private fireServiceEvent(event: ServiceEvent, oldProps: Record<string, any>): void {
  //   this.dispatcher.fireServiceEvent(event, oldProps, this);
  // }
}
