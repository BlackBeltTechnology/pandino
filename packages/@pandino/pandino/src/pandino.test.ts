import Pandino from './pandino';
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
  FRAMEWORK_UUID,
  PROVIDE_CAPABILITY,
  REQUIRE_CAPABILITY,
  LOG_LOGGER_PROP,
  SYSTEM_BUNDLE_SYMBOLICNAME,
} from '@pandino/pandino-api';
import { BundleImpl } from './lib/framework/bundle-impl';
import { MuteLogger } from './__mocks__/mute-logger';

describe('Pandino', () => {
  let params: Record<string, any>;
  let pandino: Pandino;
  const mockStart = jest.fn().mockReturnValue(Promise.resolve());
  const mockStop = jest.fn().mockReturnValue(Promise.resolve());
  const dummyActivator: BundleActivator = {
    start: mockStart,
    stop: mockStop,
  };
  const importer = jest.fn().mockReturnValue(
    Promise.resolve({
      default: dummyActivator,
    }),
  );
  const bundle1Headers: BundleManifestHeaders = {
    [BUNDLE_SYMBOLICNAME]: 'my.bundle',
    [BUNDLE_VERSION]: '1.2.3',
    [BUNDLE_ACTIVATOR]: 'https://some.url/does-not-exist.js',
    [BUNDLE_NAME]: 'My Bundle',
    [BUNDLE_DESCRIPTION]: 'Test!',
  };
  const bundle2Headers: BundleManifestHeaders = {
    [BUNDLE_SYMBOLICNAME]: 'hu.bundle.cats',
    [BUNDLE_VERSION]: '1.0.0',
    [BUNDLE_ACTIVATOR]: 'https://some.url/does-not-exist.js',
    [BUNDLE_NAME]: 'Cat Bundle',
    [BUNDLE_DESCRIPTION]: 'Test!',
  };
  const bundle3Headers: BundleManifestHeaders = {
    [BUNDLE_SYMBOLICNAME]: 'my.independent.bundle',
    [BUNDLE_VERSION]: '1.0.0',
    [BUNDLE_ACTIVATOR]: 'https://some.url/does-not-exist.js',
    [BUNDLE_NAME]: 'My Independent Bundle',
  };
  const bundleRequiresCapability = 'pet.grooming;filter:="(&(type=cat)(rate<=20))"';
  const bundleProvidesCapability =
    'pet.grooming;type:Array="dog,cat";length:number=800;soap="organic";rate:number="10"';

  beforeEach(() => {
    mockStart.mockClear();
    mockStop.mockClear();
    params = {
      [LOG_LOGGER_PROP]: new MuteLogger(),
    };
    pandino = new Pandino(importer, params);
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
    expect(ctx.getProperty(FRAMEWORK_UUID)).toEqual('pandino-uuid-todo');
  });

  it('install bundle', async () => {
    await preparePandino();
    await installBundle(bundle1Headers);
    const [myBundle] = pandino.getBundleContext().getBundles();

    expect(mockStart).toHaveBeenCalledTimes(1);
    expect(myBundle.getBundleId()).toEqual(1);
    expect(myBundle.getState()).toEqual('ACTIVE');
    expect(myBundle.getSymbolicName()).toEqual('my.bundle');
    expect(myBundle.getVersion().toString()).toEqual('1.2.3');
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
    expect(myBundle.getSymbolicName()).toEqual('my.bundle');
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

    expect(myBundle.getSymbolicName()).toEqual('my.bundle');
    expect(myBundle.getVersion().toString()).toEqual('1.2.3');
    expect(myBundle.getState()).toEqual('ACTIVE');
    expect(catsBundle.getSymbolicName()).toEqual('hu.bundle.cats');
    expect(catsBundle.getVersion().toString()).toEqual('1.0.0');
    expect(catsBundle.getState()).toEqual('ACTIVE');
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

    expect(myBundle.getSymbolicName()).toEqual('my.bundle');
    expect(myBundle.getVersion().toString()).toEqual('1.2.3');
    expect(myBundle.getState()).toEqual('ACTIVE');
    expect(catsBundle.getSymbolicName()).toEqual('hu.bundle.cats');
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

    expect(myBundle.getState()).toEqual('RESOLVED');
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

    expect(requiredBundle.getSymbolicName()).toEqual('hu.bundle.cats');
    expect(requiredBundle.getState()).toEqual('RESOLVED');
    expect(requirerBundle.getSymbolicName()).toEqual('my.bundle');
    expect(requirerBundle.getState()).toEqual('RESOLVED');
    expect(independentBundle.getSymbolicName()).toEqual('my.independent.bundle');
    expect(independentBundle.getState()).toEqual('ACTIVE');
    expect(mockStop).toHaveBeenCalledTimes(2);
  });

  it('restart bundle', async () => {
    await preparePandino();
    await installBundle(bundle1Headers);
    const [myBundle] = pandino.getBundleContext().getBundles();
    const mockBundleChangedListener = jest.fn();
    const bundleListener: BundleListener = {
      bundleChanged: mockBundleChangedListener,
    };
    myBundle.getBundleContext().addBundleListener(bundleListener);

    expect(myBundle.getState()).toEqual('ACTIVE');

    await myBundle.stop();

    expect(myBundle.getState()).toEqual('RESOLVED');
    expect(myBundle.getBundleContext()).toEqual(null);
    expect((myBundle as BundleImpl).getActivator()).toEqual(null);
    expect(mockStop).toHaveBeenCalledTimes(1);
    expect(mockBundleChangedListener).toHaveBeenCalledTimes(1); // only 1, since listeners are removed after stop

    await myBundle.start();

    expect(myBundle.getState()).toEqual('ACTIVE');
    expect(myBundle.getBundleContext()).toBeDefined();
    expect((myBundle as BundleImpl).getActivator()).toBeDefined();
    expect(mockStart).toHaveBeenCalledTimes(2); // 1 original start + 1 restart
  });

  it('update bundle', async () => {
    await preparePandino();
    await installBundle(bundle1Headers);
    const [myBundle] = pandino.getBundleContext().getBundles();

    expect(myBundle.getVersion().toString()).toEqual('1.2.3');
    expect(myBundle.getState()).toEqual('ACTIVE');

    await installBundle({
      ...bundle1Headers,
      [BUNDLE_VERSION]: '1.4.0',
      [REQUIRE_CAPABILITY]: bundleRequiresCapability,
    });

    expect(myBundle.getVersion().toString()).toEqual('1.4.0');
    expect(myBundle.getState()).toEqual('STARTING');

    await installBundle({
      ...bundle2Headers,
      [PROVIDE_CAPABILITY]: bundleProvidesCapability,
    });

    expect(myBundle.getState()).toEqual('ACTIVE');
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

    expect(pandino.getBundleContext().getBundles().length).toEqual(1);
    expect(requiredBundle.getState()).toEqual('UNINSTALLED');
    expect(requirerBundle.getState()).toEqual('RESOLVED');
    expect(mockStop).toHaveBeenCalledTimes(2);
  });

  async function preparePandino() {
    await pandino.init();
    await pandino.start();
  }

  async function installBundle(headers: BundleManifestHeaders): Promise<Bundle> {
    return pandino.getBundleContext().installBundle(headers);
  }
});
