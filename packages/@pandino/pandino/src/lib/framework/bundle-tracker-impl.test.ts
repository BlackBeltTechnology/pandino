import {
  Bundle,
  BUNDLE_ACTIVATOR,
  BUNDLE_DESCRIPTION,
  BUNDLE_NAME,
  BUNDLE_SYMBOLICNAME,
  BUNDLE_VERSION,
  BundleActivator,
  BundleContext,
  BundleEvent,
  BundleImporter,
  BundleManifestHeaders,
  BundleTracker,
  BundleTrackerCustomizer,
  LOG_LEVEL_PROP,
  LogLevel,
  PANDINO_BUNDLE_IMPORTER_PROP,
  PANDINO_MANIFEST_FETCHER_PROP,
} from '@pandino/pandino-api';
import { BundleTrackerImpl } from './bundle-tracker-impl';
import { Pandino } from '../../pandino';

describe('BundleTrackerImpl', () => {
  const mockAddingBundle = jest.fn().mockImplementation((bundle: Bundle, event: BundleEvent) => bundle);
  const mockModifiedBundle = jest
    .fn()
    .mockImplementation((bundle: Bundle, event: BundleEvent, object: any) => undefined);
  const mockRemovedBundle = jest
    .fn()
    .mockImplementation((bundle: Bundle, event: BundleEvent, object: any) => undefined);
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
  let pandino: Pandino;
  let bundleContext: BundleContext;

  beforeEach(async () => {
    mockAddingBundle.mockClear();
    mockModifiedBundle.mockClear();
    mockRemovedBundle.mockClear();
    mockStart.mockClear();
    mockStop.mockClear();

    pandino = new Pandino({
      [PANDINO_MANIFEST_FETCHER_PROP]: jest.fn() as any,
      [PANDINO_BUNDLE_IMPORTER_PROP]: importer,
      [LOG_LEVEL_PROP]: LogLevel.WARN,
    });

    await pandino.init();
    await pandino.start();

    bundleContext = pandino.getBundleContext();
  });

  it('basic tracking', async () => {
    const customizer: BundleTrackerCustomizer<any> = {
      addingBundle: mockAddingBundle,
      modifiedBundle: mockModifiedBundle,
      removedBundle: mockRemovedBundle,
    };
    const tracker: BundleTracker<Bundle> = new BundleTrackerImpl(bundleContext, ['ACTIVE', 'STARTING'], customizer);

    tracker.open();

    const installedBundle = await bundleContext.installBundle(bundle1Headers);

    expect(mockAddingBundle).toHaveBeenCalledTimes(1);
    expect(mockModifiedBundle).toHaveBeenCalledTimes(1);

    await installedBundle.uninstall();

    expect(mockRemovedBundle).toHaveBeenCalledTimes(1);
  });

  it('closed tracker does not record anything', async () => {
    const customizer: BundleTrackerCustomizer<any> = {
      addingBundle: mockAddingBundle,
      modifiedBundle: mockModifiedBundle,
      removedBundle: mockRemovedBundle,
    };
    const tracker: BundleTracker<Bundle> = new BundleTrackerImpl(bundleContext, ['ACTIVE', 'STARTING'], customizer);

    tracker.open();
    tracker.close();

    await bundleContext.installBundle(bundle1Headers);

    expect(mockAddingBundle).toHaveBeenCalledTimes(0);
    expect(mockModifiedBundle).toHaveBeenCalledTimes(0);
    expect(mockRemovedBundle).toHaveBeenCalledTimes(0);
  });
});
