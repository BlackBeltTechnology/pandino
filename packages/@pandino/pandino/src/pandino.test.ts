import {
  Bundle,
  BundleActivator,
  BundleListener,
  BundleManifestHeaders,
  BUNDLE_ACTIVATOR,
  BUNDLE_DESCRIPTION,
  BUNDLE_NAME,
  BUNDLE_SYMBOLICNAME,
  BUNDLE_VERSION,
  PROVIDE_CAPABILITY,
  REQUIRE_CAPABILITY,
  PANDINO_BUNDLE_IMPORTER_PROP,
  SYSTEM_BUNDLE_SYMBOLICNAME,
  BundleImporter,
  LOG_LEVEL_PROP,
  LogLevel,
  FrameworkConfigMap,
  DEPLOYMENT_ROOT_PROP,
  PANDINO_MANIFEST_FETCHER_PROP,
  ServiceRegistration,
  OBJECTCLASS,
  ServiceReference,
} from '@pandino/pandino-api';
import { Pandino } from './pandino';
import { BundleImpl } from './lib/framework/bundle-impl';

interface HelloService {
  sayHello(): string;
}

interface WelcomeService {
  welcome(): void;
}

describe('Pandino', () => {
  let params: FrameworkConfigMap;
  let pandino: Pandino;
  const mockStart = jest.fn().mockReturnValue(Promise.resolve());
  const mockStop = jest.fn().mockReturnValue(Promise.resolve());
  const dummyActivator: BundleActivator = {
    start: mockStart,
    stop: mockStop,
  };
  const importer: BundleImporter = {
    import: (activator: string, manifest: string) =>
      Promise.resolve({
        default: dummyActivator,
      }),
  };
  const bundle1Headers: BundleManifestHeaders = {
    [BUNDLE_SYMBOLICNAME]: '@scope/bundle',
    [BUNDLE_VERSION]: '1.2.3',
    [BUNDLE_ACTIVATOR]: 'https://some.url/does-not-exist.js',
    [BUNDLE_NAME]: 'My Bundle',
    [BUNDLE_DESCRIPTION]: 'Test!',
  };
  const bundle2Headers: BundleManifestHeaders = {
    [BUNDLE_SYMBOLICNAME]: '@scope/cats',
    [BUNDLE_VERSION]: '1.0.0',
    [BUNDLE_ACTIVATOR]: 'https://some.url/does-not-exist.js',
    [BUNDLE_NAME]: 'Cat Bundle',
    [BUNDLE_DESCRIPTION]: 'Test!',
  };
  const bundle3Headers: BundleManifestHeaders = {
    [BUNDLE_SYMBOLICNAME]: '@scope/independent',
    [BUNDLE_VERSION]: '1.0.0',
    [BUNDLE_ACTIVATOR]: 'https://some.url/does-not-exist.js',
    [BUNDLE_NAME]: 'My Independent Bundle',
  };
  const bundleRequiresCapability = 'pet.grooming;filter:="(&(type=cat)(rate<=20))"';
  const bundleProvidesCapability =
    'pet.grooming;type:Array="dog,cat";length:number=800;soap="organic";rate:number="10"';
  let helloService: HelloService;
  let welcomeService: WelcomeService;

  beforeEach(() => {
    mockStart.mockClear();
    mockStart.mockImplementation(() => {});
    mockStop.mockClear();
    params = {
      [PANDINO_MANIFEST_FETCHER_PROP]: jest.fn() as any,
      [PANDINO_BUNDLE_IMPORTER_PROP]: importer,
      [LOG_LEVEL_PROP]: LogLevel.WARN,
    };
    pandino = new Pandino(params);
    helloService = {
      sayHello: () => 'hello',
    };
    welcomeService = {
      welcome: () => {},
    };
  });

  afterEach(() => {
    pandino = undefined;
  });

  it('goes to STARTING state after init()', async () => {
    await pandino.init();

    expect(pandino.getState()).toEqual('STARTING');
  });

  it('goes to ACTIVE state after start()', async () => {
    await pandino.init();
    await pandino.start();

    expect(pandino.getState()).toEqual('ACTIVE');

    const ctx = pandino.getBundleContext();

    expect(ctx.getBundle().getSymbolicName()).toEqual(SYSTEM_BUNDLE_SYMBOLICNAME);
    expect(ctx.getBundle().getVersion().toString()).toEqual('0.1.0');
  });

  it('Pandino APIs', async () => {
    await preparePandino();
    await installBundle(bundle1Headers);

    expect(pandino.getActivatorsList().length).toEqual(0);
  });

  it('install bundle', async () => {
    await preparePandino();
    await installBundle(bundle1Headers);
    const [myBundle] = pandino.getBundleContext().getBundles();

    expect(mockStart).toHaveBeenCalledTimes(1);
    expect(myBundle.getBundleId()).toEqual(1);
    expect(myBundle.getState()).toEqual('ACTIVE');
    expect(myBundle.getSymbolicName()).toEqual('@scope/bundle');
    expect(myBundle.getVersion().toString()).toEqual('1.2.3');
  });

  it('install bundle fails if activator is missing from Bundle Headers', async () => {
    const header = {
      ...bundle1Headers,
    };
    delete header[BUNDLE_ACTIVATOR];
    await preparePandino();
    const bundle = await installBundle(header);

    expect(bundle.getState()).toEqual('INSTALLED');
  });

  it('installed bundle stays INSTALLED if requirement(s) are not satisfied', async () => {
    await preparePandino();
    await installBundle({
      ...bundle1Headers,
      [REQUIRE_CAPABILITY]: bundleRequiresCapability,
    });
    const [myBundle] = pandino.getBundleContext().getBundles();

    expect(mockStart).toHaveBeenCalledTimes(0);
    expect(myBundle.getBundleId()).toEqual(1);
    expect(myBundle.getState()).toEqual('INSTALLED');
    expect(myBundle.getSymbolicName()).toEqual('@scope/bundle');
    expect(myBundle.getVersion().toString()).toEqual('1.2.3');
  });

  it('bundle ends up in an ACTIVATED state when requirement(s) are satisfied', async () => {
    await preparePandino();
    await installBundle({
      ...bundle1Headers,
      [REQUIRE_CAPABILITY]: bundleRequiresCapability,
    });
    let bundles = pandino.getBundleContext().getBundles();

    expect(mockStart).toHaveBeenCalledTimes(0);
    expect(bundles.length).toEqual(1);
    expect(bundles[0].getState()).toEqual('INSTALLED');

    await installBundle({
      ...bundle2Headers,
      [PROVIDE_CAPABILITY]: bundleProvidesCapability,
    });

    bundles = pandino.getBundleContext().getBundles();

    expect(bundles.length).toEqual(2);

    const myBundle = bundles[0];
    const catsBundle = bundles[1];

    expect(myBundle.getSymbolicName()).toEqual('@scope/bundle');
    expect(myBundle.getVersion().toString()).toEqual('1.2.3');
    expect(myBundle.getState()).toEqual('ACTIVE');
    expect(catsBundle.getSymbolicName()).toEqual('@scope/cats');
    expect(catsBundle.getVersion().toString()).toEqual('1.0.0');
    expect(catsBundle.getState()).toEqual('ACTIVE');
    expect(mockStart).toHaveBeenCalledTimes(bundles.length); // we use the same mock for all bundles
  });

  it("bundle ends up in an INSTALLED state when it's activator fails", async () => {
    mockStart.mockImplementation(() => {
      throw new Error('Test throwing in activator!');
    });
    await preparePandino();
    const bundle = await installBundle({
      ...bundle1Headers,
    });
    let bundles = pandino.getBundleContext().getBundles();

    expect(mockStart).toHaveBeenCalledTimes(1);
    expect(bundles.length).toEqual(1);

    expect(bundle.getSymbolicName()).toEqual('@scope/bundle');
    expect(bundle.getVersion().toString()).toEqual('1.2.3');
    expect(bundle.getState()).toEqual('INSTALLED');
    expect(bundle.getBundleContext()).toEqual(null);
  });

  it('multiple requirements case', async () => {
    await preparePandino();
    await installBundle({
      ...bundle1Headers,
      [REQUIRE_CAPABILITY]: ['cap.test;filter:="(type=one)"', 'cap.other;filter:="(num<=50)"'],
    });
    let bundles = pandino.getBundleContext().getBundles();

    expect(mockStart).toHaveBeenCalledTimes(0);
    expect(bundles.length).toEqual(1);
    expect(bundles[0].getState()).toEqual('INSTALLED');

    await installBundle({
      [BUNDLE_SYMBOLICNAME]: '@scope/one',
      [BUNDLE_VERSION]: '0.0.1',
      [BUNDLE_ACTIVATOR]: 'https://some.url/does-not-exist-2.js',
      [PROVIDE_CAPABILITY]: 'cap.test;type=one',
    });
    await installBundle({
      [BUNDLE_SYMBOLICNAME]: '@scope/two',
      [BUNDLE_VERSION]: '0.1.0',
      [BUNDLE_ACTIVATOR]: 'https://some.url/does-not-exist-3.js',
      [PROVIDE_CAPABILITY]: 'cap.other;num:number=22',
    });

    bundles = pandino.getBundleContext().getBundles();

    expect(bundles.length).toEqual(3);

    const myBundle = bundles[0];
    const oneBundle = bundles[1];
    const twoBundle = bundles[2];

    expect(myBundle.getSymbolicName()).toEqual('@scope/bundle');
    expect(myBundle.getVersion().toString()).toEqual('1.2.3');
    expect(myBundle.getState()).toEqual('ACTIVE');
    expect(oneBundle.getSymbolicName()).toEqual('@scope/one');
    expect(oneBundle.getState()).toEqual('ACTIVE');
    expect(twoBundle.getSymbolicName()).toEqual('@scope/two');
    expect(twoBundle.getState()).toEqual('ACTIVE');
    expect(mockStart).toHaveBeenCalledTimes(bundles.length); // we use the same mock for all bundles
  });

  it('all bundles go to ACTIVE state (in order)', async () => {
    await preparePandino();
    await installBundle({
      ...bundle1Headers,
      [PROVIDE_CAPABILITY]: bundleProvidesCapability,
    });
    let bundles = pandino.getBundleContext().getBundles();

    expect(mockStart).toHaveBeenCalledTimes(1);
    expect(bundles.length).toEqual(1);
    expect(bundles[0].getState()).toEqual('ACTIVE');

    await installBundle({
      ...bundle2Headers,
      [REQUIRE_CAPABILITY]: bundleRequiresCapability,
    });

    bundles = pandino.getBundleContext().getBundles();

    expect(bundles.length).toEqual(2);

    const myBundle = bundles[0];
    const catsBundle = bundles[1];

    expect(myBundle.getSymbolicName()).toEqual('@scope/bundle');
    expect(myBundle.getVersion().toString()).toEqual('1.2.3');
    expect(myBundle.getState()).toEqual('ACTIVE');
    expect(catsBundle.getSymbolicName()).toEqual('@scope/cats');
    expect(catsBundle.getVersion().toString()).toEqual('1.0.0');
    expect(catsBundle.getState()).toEqual('ACTIVE');
    expect(mockStart).toHaveBeenCalledTimes(bundles.length); // we use the same mock for all bundles
  });

  it('stop bundle', async () => {
    await preparePandino();
    await installBundle(bundle1Headers);
    const [myBundle] = pandino.getBundleContext().getBundles();

    expect(myBundle.getState()).toEqual('ACTIVE');

    await myBundle.stop();

    expect(myBundle.getState()).toEqual('INSTALLED');
    expect(myBundle.getBundleContext()).toEqual(null);
    expect((myBundle as BundleImpl).getActivator()).toEqual(null);
    expect(mockStop).toHaveBeenCalledTimes(1);
  });

  it('stopping bundle stops requiring bundle(s) as well', async () => {
    await preparePandino();
    await installBundle({
      ...bundle1Headers,
      [REQUIRE_CAPABILITY]: bundleRequiresCapability,
    });
    await installBundle({
      ...bundle2Headers,
      [PROVIDE_CAPABILITY]: bundleProvidesCapability,
    });
    await installBundle(bundle3Headers);

    const [requirerBundle, requiredBundle, independentBundle] = pandino.getBundleContext().getBundles();

    await requiredBundle.stop();

    expect(requiredBundle.getSymbolicName()).toEqual('@scope/cats');
    expect(requiredBundle.getState()).toEqual('INSTALLED');
    expect(requirerBundle.getSymbolicName()).toEqual('@scope/bundle');
    expect(requirerBundle.getState()).toEqual('INSTALLED');
    expect(independentBundle.getSymbolicName()).toEqual('@scope/independent');
    expect(independentBundle.getState()).toEqual('ACTIVE');
    expect(mockStop).toHaveBeenCalledTimes(2);
  });

  it('restart bundle', async () => {
    await preparePandino();
    await installBundle(bundle1Headers);
    const [bundle1] = pandino.getBundleContext().getBundles();
    const mockBundleChangedListener = jest.fn();
    const bundleListener: BundleListener = {
      bundleChanged: mockBundleChangedListener,
      isSync: true,
    };
    bundle1.getBundleContext().addBundleListener(bundleListener);

    expect(bundle1.getState()).toEqual('ACTIVE');

    await bundle1.stop();

    expect(bundle1.getState()).toEqual('INSTALLED');
    expect(bundle1.getBundleContext()).toEqual(null);
    expect((bundle1 as BundleImpl).getActivator()).toEqual(null);
    expect(mockStop).toHaveBeenCalledTimes(1);
    expect(mockStart).toHaveBeenCalledTimes(1);

    expect(mockBundleChangedListener).toHaveBeenCalledTimes(1); // only 1, since listeners are removed after stop

    await bundle1.start();

    expect(bundle1.getState()).toEqual('ACTIVE');
    expect(bundle1.getBundleContext()).toBeDefined();
    expect((bundle1 as BundleImpl).getActivator()).toBeDefined();
    expect(mockStart).toHaveBeenCalledTimes(2); // 1 original start + 1 restart/ 1 original start + 1 restart
  });

  it('install - uninstall - install chain', async () => {
    await preparePandino();
    await installBundle({
      ...bundle1Headers,
      [BUNDLE_SYMBOLICNAME]: '@bundle/one',
      [PROVIDE_CAPABILITY]: 'greater.service;name=test',
    });
    await installBundle({
      ...bundle2Headers,
      [BUNDLE_SYMBOLICNAME]: '@bundle/two',
      [REQUIRE_CAPABILITY]: 'greater.service;filter:="(name=test)"',
      [PROVIDE_CAPABILITY]: 'other.service;name=other',
    });
    await installBundle({
      ...bundle2Headers,
      [BUNDLE_SYMBOLICNAME]: '@bundle/three',
      [REQUIRE_CAPABILITY]: 'other.service;filter:="(name=other)"',
    });
    await installBundle(bundle3Headers);

    let [bundle1, bundle2, bundle3, independentBundle] = pandino.getBundleContext().getBundles();

    expect(bundle1.getState()).toEqual('ACTIVE');
    expect(bundle2.getState()).toEqual('ACTIVE');
    expect(bundle3.getState()).toEqual('ACTIVE');
    expect(independentBundle.getState()).toEqual('ACTIVE');

    await bundle1.uninstall();

    expect(bundle1.getState()).toEqual('UNINSTALLED');
    expect(bundle2.getState()).toEqual('INSTALLED');
    expect(bundle3.getState()).toEqual('INSTALLED');
    expect(independentBundle.getState()).toEqual('ACTIVE');
    expect(mockStart).toHaveBeenCalledTimes(4);
    expect(mockStop).toHaveBeenCalledTimes(3);

    bundle1 = await installBundle({
      ...bundle1Headers,
      [BUNDLE_SYMBOLICNAME]: '@bundle/one',
      [PROVIDE_CAPABILITY]: 'greater.service;name=test',
    });

    expect(bundle1.getState()).toEqual('ACTIVE');
    expect(bundle2.getState()).toEqual('ACTIVE');
    expect(bundle3.getState()).toEqual('ACTIVE');
    expect(independentBundle.getState()).toEqual('ACTIVE');
    expect(mockStart).toHaveBeenCalledTimes(7);
    expect(mockStop).toHaveBeenCalledTimes(3);
  });

  it('install - stop - start chain', async () => {
    await preparePandino();
    await installBundle({
      ...bundle1Headers,
      [BUNDLE_SYMBOLICNAME]: '@bundle/one',
      [PROVIDE_CAPABILITY]: 'greater.service;name=test',
    });
    await installBundle({
      ...bundle2Headers,
      [BUNDLE_SYMBOLICNAME]: '@bundle/two',
      [REQUIRE_CAPABILITY]: 'greater.service;filter:="(name=test)"',
      [PROVIDE_CAPABILITY]: 'other.service;name=other',
    });
    await installBundle({
      ...bundle2Headers,
      [BUNDLE_SYMBOLICNAME]: '@bundle/three',
      [REQUIRE_CAPABILITY]: 'other.service;filter:="(name=other)"',
    });
    await installBundle(bundle3Headers);

    const [bundle1, bundle2, bundle3, independentBundle] = pandino.getBundleContext().getBundles();

    expect(bundle1.getState()).toEqual('ACTIVE');
    expect(bundle2.getState()).toEqual('ACTIVE');
    expect(bundle3.getState()).toEqual('ACTIVE');
    expect(independentBundle.getState()).toEqual('ACTIVE');

    await bundle1.stop();

    expect(bundle1.getState()).toEqual('INSTALLED');
    expect(bundle2.getState()).toEqual('INSTALLED');
    expect(bundle3.getState()).toEqual('INSTALLED');
    expect(independentBundle.getState()).toEqual('ACTIVE');
    expect(mockStart).toHaveBeenCalledTimes(4);
    expect(mockStop).toHaveBeenCalledTimes(3);

    await bundle1.start();

    expect(bundle1.getState()).toEqual('ACTIVE');
    expect(bundle2.getState()).toEqual('ACTIVE');
    expect(bundle3.getState()).toEqual('ACTIVE');
    expect(independentBundle.getState()).toEqual('ACTIVE');
    expect(mockStart).toHaveBeenCalledTimes(7);
    expect(mockStop).toHaveBeenCalledTimes(3);
  });

  it('update bundle', async () => {
    await preparePandino();
    await installBundle(bundle1Headers);
    const [myBundle] = pandino.getBundleContext().getBundles();

    expect(myBundle.getVersion().toString()).toEqual('1.2.3');
    expect(myBundle.getState()).toEqual('ACTIVE');
    expect(mockStart).toHaveBeenCalledTimes(1);
    expect(mockStop).toHaveBeenCalledTimes(0);

    await installBundle({
      ...bundle1Headers,
      [BUNDLE_VERSION]: '1.4.0',
      [REQUIRE_CAPABILITY]: bundleRequiresCapability,
    });

    expect(myBundle.getVersion().toString()).toEqual('1.4.0');
    expect(myBundle.getState()).toEqual('INSTALLED');
    expect(mockStart).toHaveBeenCalledTimes(1); // Bundle 1 should not start, given updated version brought a requirement
    expect(mockStop).toHaveBeenCalledTimes(1); // Bundle 1 stopping, given a new requirement arrived without a provider

    await installBundle({
      ...bundle2Headers,
      [PROVIDE_CAPABILITY]: bundleProvidesCapability,
    });

    expect(myBundle.getState()).toEqual('ACTIVE');
    expect(mockStart).toHaveBeenCalledTimes(3); // Bundle 1 starting again + Bundle 2 starting
    expect(mockStop).toHaveBeenCalledTimes(1);
  });

  it('uninstall bundle', async () => {
    await preparePandino();
    await installBundle({
      ...bundle1Headers,
      [REQUIRE_CAPABILITY]: bundleRequiresCapability,
    });
    await installBundle({
      ...bundle2Headers,
      [PROVIDE_CAPABILITY]: bundleProvidesCapability,
    });

    const [requirerBundle, requiredBundle] = pandino.getBundleContext().getBundles();

    expect(pandino.getBundleContext().getBundles().length).toEqual(2);
    expect(requiredBundle.getState()).toEqual('ACTIVE');
    expect(requirerBundle.getState()).toEqual('ACTIVE');

    await requiredBundle.uninstall();

    expect((requiredBundle as BundleImpl).getCurrentRevision().getWiring()).toEqual(undefined);
    expect(pandino.getBundleContext().getBundles().length).toEqual(2);
    expect(requiredBundle.getState()).toEqual('UNINSTALLED');
    expect(requirerBundle.getState()).toEqual('INSTALLED');
    expect(mockStop).toHaveBeenCalledTimes(2);
  });

  it('multiple requirements', async () => {
    await preparePandino();
    const multiRequireBundle = await installBundle({
      ...bundle1Headers,
      [REQUIRE_CAPABILITY]: ['pet.grooming;filter:="(&(type=cat)(rate<=20))"', 'super.hero;filter:="(laser=true)"'],
    });

    expect(multiRequireBundle.getState()).toEqual('INSTALLED');

    await installBundle({
      ...bundle2Headers,
      [PROVIDE_CAPABILITY]: 'pet.grooming;type:Array="dog,cat";length:number=800;soap="organic";rate:number="10"',
    });

    expect(multiRequireBundle.getState()).toEqual('INSTALLED');

    await installBundle({
      ...bundle3Headers,
      [PROVIDE_CAPABILITY]: 'super.hero;laser=true',
    });

    const [requirerBundle, requiredBundle1, requiredBundle2] = pandino.getBundleContext().getBundles();
    const THREE_BUNDLES_PRESENT = 3;

    expect(pandino.getBundleContext().getBundles().length).toEqual(THREE_BUNDLES_PRESENT);
    expect(requiredBundle1.getState()).toEqual('ACTIVE');
    expect(requiredBundle2.getState()).toEqual('ACTIVE');
    expect(requirerBundle.getState()).toEqual('ACTIVE');

    await requiredBundle1.uninstall();

    expect(pandino.getBundleContext().getBundles().length).toEqual(THREE_BUNDLES_PRESENT);
    expect(requiredBundle1.getState()).toEqual('UNINSTALLED');
    expect(requiredBundle2.getState()).toEqual('ACTIVE');
    expect(requirerBundle.getState()).toEqual('INSTALLED');

    await requiredBundle2.uninstall();

    expect(pandino.getBundleContext().getBundles().length).toEqual(THREE_BUNDLES_PRESENT);
    expect(requiredBundle1.getState()).toEqual('UNINSTALLED');
    expect(requiredBundle2.getState()).toEqual('UNINSTALLED');
    expect(requirerBundle.getState()).toEqual('INSTALLED');

    expect(mockStop).toHaveBeenCalledTimes(3);
  });

  it('uninstall bundle fails if Bundle is already in UNINSTALLED state', async () => {
    await preparePandino();
    const bundle = await installBundle({
      ...bundle1Headers,
    });
    (bundle as BundleImpl).setState('UNINSTALLED');

    expect(bundle.uninstall()).rejects.toThrow('Cannot uninstall an uninstalled bundle.');
  });

  it('uninstall bundle fails if Bundle is in STARTING or STOPPING state', async () => {
    await preparePandino();
    const bundle = await installBundle({
      ...bundle1Headers,
    });
    (bundle as BundleImpl).setState('STARTING');

    expect(bundle.uninstall()).rejects.toThrow(
      'Bundle @scope/bundle-1.2.3 cannot be uninstalled, since it is either STARTING or STOPPING.',
    );

    (bundle as BundleImpl).setState('STOPPING');

    expect(bundle.uninstall()).rejects.toThrow(
      'Bundle @scope/bundle-1.2.3 cannot be uninstalled, since it is either STARTING or STOPPING.',
    );
  });

  it('stopping bundle unregisters all services', async () => {
    await preparePandino();
    await installBundle(bundle1Headers);

    const bundle = pandino.getBundleContext().getBundles()[0];
    const context = bundle.getBundleContext();

    const regHello: ServiceRegistration<HelloService> = context.registerService(
      '@pandino/pandino/hello-impl',
      helloService,
    );
    const regWelcome: ServiceRegistration<WelcomeService> = context.registerService(
      '@pandino/pandino/welcome-impl',
      welcomeService,
    );

    const refHello: ServiceReference<HelloService> = regHello.getReference();
    const refWelcome: ServiceReference<WelcomeService> = regWelcome.getReference();

    expect(bundle.getRegisteredServices().length).toEqual(2);
    expect(regHello.getProperty(OBJECTCLASS)).toEqual('@pandino/pandino/hello-impl');
    expect(regWelcome.getProperty(OBJECTCLASS)).toEqual('@pandino/pandino/welcome-impl');
    expect(refHello.getBundle()).toEqual(bundle);
    expect(refWelcome.getBundle()).toEqual(bundle);

    await bundle.stop();

    expect(bundle.getRegisteredServices().length).toEqual(0);
    expect(refHello.getBundle()).toBeUndefined();
    expect(refWelcome.getBundle()).toBeUndefined();
  });

  it('uninstalling bundle unregisters all services', async () => {
    await preparePandino();
    await installBundle(bundle1Headers);

    const bundle = pandino.getBundleContext().getBundles()[0];
    const context = bundle.getBundleContext();

    const regHello: ServiceRegistration<HelloService> = context.registerService(
      '@pandino/pandino/hello-impl',
      helloService,
    );
    const regWelcome: ServiceRegistration<WelcomeService> = context.registerService(
      '@pandino/pandino/welcome-impl',
      welcomeService,
    );

    const refHello: ServiceReference<HelloService> = regHello.getReference();
    const refWelcome: ServiceReference<WelcomeService> = regWelcome.getReference();

    expect(bundle.getRegisteredServices().length).toEqual(2);
    expect(regHello.getProperty(OBJECTCLASS)).toEqual('@pandino/pandino/hello-impl');
    expect(regWelcome.getProperty(OBJECTCLASS)).toEqual('@pandino/pandino/welcome-impl');
    expect(refHello.getBundle()).toEqual(bundle);
    expect(refWelcome.getBundle()).toEqual(bundle);

    await bundle.uninstall();

    expect(() => bundle.getRegisteredServices()).toThrow(Error);
    expect(() => bundle.getRegisteredServices()).toThrow('The bundle is uninstalled.');
    expect(refHello.getBundle()).toBeUndefined();
    expect(refWelcome.getBundle()).toBeUndefined();
  });

  it('uninstalled dependency blocks starting of dependent bundle', async () => {
    await preparePandino();

    const bundle1 = {
      [BUNDLE_SYMBOLICNAME]: '@scope/prov',
      [BUNDLE_VERSION]: '1.0.0',
      [BUNDLE_ACTIVATOR]: 'https://some.url/does-not-exist.js',
      [BUNDLE_NAME]: 'Provider1',
      [PROVIDE_CAPABILITY]: '@scope/feature1;type:Array="test,bundle"',
    };

    const bundle2 = {
      [BUNDLE_SYMBOLICNAME]: '@scope/cons',
      [BUNDLE_VERSION]: '1.0.0',
      [BUNDLE_ACTIVATOR]: 'https://some.url/does-not-exist.js',
      [BUNDLE_NAME]: 'Consumer1',
      [REQUIRE_CAPABILITY]: '@scope/feature1;filter:=(type=test)',
    };

    const b1 = await installBundle(bundle1);
    const b2 = await installBundle(bundle2);

    await b1.uninstall();

    expect(b1.getState()).toEqual('UNINSTALLED');
    expect(b2.getState()).toEqual('INSTALLED');

    await b2.start();

    expect(b1.getState()).toEqual('UNINSTALLED');
    expect(b2.getState()).toEqual('INSTALLED');
  });

  async function preparePandino() {
    await pandino.init();
    await pandino.start();
  }

  async function installBundle(headers: BundleManifestHeaders): Promise<Bundle> {
    return pandino.getBundleContext().installBundle(headers);
  }
});
