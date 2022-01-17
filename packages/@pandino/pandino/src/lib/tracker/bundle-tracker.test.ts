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
  BundleEventType,
  BundleImporter,
  BundleManifestHeaders,
  BundleState,
  BundleTrackerCustomizer,
  DEPLOYMENT_ROOT_PROP,
  FrameworkConfigMap,
  LOG_LOGGER_PROP,
  Logger,
  PANDINO_BUNDLE_IMPORTER_PROP,
  PANDINO_MANIFEST_FETCHER_PROP,
} from '@pandino/pandino-api';
import { BundleTracker } from './bundle-tracker';
import { Pandino } from '../../pandino';
import { BundleContextImpl } from '../framework/bundle-context-impl';
import { MuteLogger } from '../../__mocks__/mute-logger';
import { BundleImpl } from '../framework/bundle-impl';

describe('BundleTracker', () => {
  const dummyActivator: BundleActivator = {
    start: jest.fn(),
    stop: jest.fn(),
  };
  const importer: BundleImporter = {
    import: (root: string, activator: string, manifest: string) =>
      Promise.resolve({
        default: dummyActivator,
      }),
  };
  const bundle1Headers: BundleManifestHeaders = {
    [BUNDLE_SYMBOLICNAME]: 'my.bundle',
    [BUNDLE_VERSION]: '1.2.3',
    [BUNDLE_ACTIVATOR]: 'https://some.url/does-not-exist.js',
    [BUNDLE_NAME]: 'My Bundle',
    [BUNDLE_DESCRIPTION]: 'Test!',
  };
  const bundle2Headers: BundleManifestHeaders = {
    [BUNDLE_SYMBOLICNAME]: 'my.other.bundle',
    [BUNDLE_VERSION]: '1.0.0',
    [BUNDLE_ACTIVATOR]: 'https://some.url/does-not-exist.js',
    [BUNDLE_NAME]: 'Other Bundle',
  };
  let params: FrameworkConfigMap;
  let logger: Logger;
  let pandino: Pandino;
  let bundle: Bundle;
  let bundle2: Bundle;
  let bundleContext: BundleContextImpl;

  beforeEach(async () => {
    logger = new MuteLogger();
    params = {
      [DEPLOYMENT_ROOT_PROP]: '',
      [PANDINO_MANIFEST_FETCHER_PROP]: jest.fn() as any,
      [PANDINO_BUNDLE_IMPORTER_PROP]: importer,
      [LOG_LOGGER_PROP]: logger,
    };
    pandino = new Pandino(params);

    await pandino.init();
    await pandino.start();
    await pandino.getBundleContext().installBundle(bundle1Headers);

    bundle = pandino.getBundleContext().getBundles()[0];
    bundleContext = new BundleContextImpl(logger, bundle as BundleImpl, pandino);
  });

  describe('with customizer', () => {
    let addingBundleMock = jest.fn().mockImplementation((bundle: Bundle, event: BundleEvent) => bundle);
    let modifiedBundleMock = jest.fn();
    let removedBundleMock = jest.fn();
    let customizer: BundleTrackerCustomizer<any>;
    let tracker: BundleTracker<Bundle>;

    beforeEach(() => {
      addingBundleMock.mockClear();
      addingBundleMock.mockImplementation((bundle: Bundle, event: BundleEvent) => bundle);
      modifiedBundleMock.mockClear();
      removedBundleMock.mockClear();
      customizer = {
        addingBundle: addingBundleMock,
        modifiedBundle: modifiedBundleMock,
        removedBundle: removedBundleMock,
      };
      tracker = new BundleTracker<Bundle>(bundleContext, ['ACTIVE', 'STARTING', 'STOPPING', 'UNINSTALLED'], customizer);
      tracker.open();
    });

    afterEach(() => {
      tracker.close();
    });

    it('install', async () => {
      bundle2 = await bundleContext.installBundle(bundle2Headers);

      testCallTimes([addingBundleMock, 2], [modifiedBundleMock, 1], [removedBundleMock, 0]);

      const [initialCall, startingCall] = addingBundleMock.mock.calls;
      const [startedCall] = modifiedBundleMock.mock.calls;

      testCall(initialCall, bundle.getSymbolicName(), undefined, undefined);
      testCall(startingCall, bundle2.getSymbolicName(), 'ACTIVE', 'STARTING');

      testCall(startedCall, bundle2.getSymbolicName(), 'ACTIVE', 'STARTED');
    });

    it('stop', async () => {
      bundle2 = await bundleContext.installBundle(bundle2Headers);
      await pandino.stopBundle(bundle2 as BundleImpl);

      testCallTimes([addingBundleMock, 2], [modifiedBundleMock, 2], [removedBundleMock, 1]);

      const [initialCall, startingCall] = addingBundleMock.mock.calls;
      const [startedCall, stoppingCall] = modifiedBundleMock.mock.calls;
      const [stoppedCall] = removedBundleMock.mock.calls;

      testCall(initialCall, bundle.getSymbolicName(), undefined, undefined);
      testCall(startingCall, bundle2.getSymbolicName(), 'RESOLVED', 'STARTING');
      testCall(startedCall, bundle2.getSymbolicName(), 'RESOLVED', 'STARTED');
      testCall(stoppingCall, bundle2.getSymbolicName(), 'RESOLVED', 'STOPPING');
      testCall(stoppedCall, bundle2.getSymbolicName(), 'RESOLVED', 'STOPPED');
    });

    it('uninstall', async () => {
      bundle2 = await bundleContext.installBundle(bundle2Headers);
      await pandino.uninstallBundle(bundle2 as BundleImpl);

      testCallTimes([addingBundleMock, 2], [modifiedBundleMock, 2], [removedBundleMock, 1]);

      const [initialCall, startingCall] = addingBundleMock.mock.calls;
      const [startedCall, stoppingCall] = modifiedBundleMock.mock.calls;
      const [uninstallCall] = removedBundleMock.mock.calls;

      testCall(initialCall, bundle.getSymbolicName(), undefined, undefined);
      testCall(startingCall, bundle2.getSymbolicName(), 'UNINSTALLED', 'STARTING');
      testCall(startedCall, bundle2.getSymbolicName(), 'UNINSTALLED', 'STARTED');
      testCall(stoppingCall, bundle2.getSymbolicName(), 'UNINSTALLED', 'STOPPING');
      testCall(uninstallCall, bundle2.getSymbolicName(), 'UNINSTALLED', 'STOPPED');
    });
  });

  describe('with customizer, skipping states to monitor', () => {
    let addingBundleMock = jest.fn().mockImplementation((bundle: Bundle, event: BundleEvent) => bundle);
    let modifiedBundleMock = jest.fn();
    let removedBundleMock = jest.fn();
    let customizer: BundleTrackerCustomizer<any>;
    let tracker: BundleTracker<Bundle>;

    beforeEach(() => {
      addingBundleMock.mockClear();
      addingBundleMock.mockImplementation((bundle: Bundle, event: BundleEvent) => bundle);
      modifiedBundleMock.mockClear();
      removedBundleMock.mockClear();
      customizer = {
        addingBundle: addingBundleMock,
        modifiedBundle: modifiedBundleMock,
        removedBundle: removedBundleMock,
      };
      tracker = new BundleTracker<Bundle>(bundleContext, [], customizer);
      tracker.open();
    });

    afterEach(() => {
      tracker.close();
    });

    it('full lifecycle', async () => {
      bundle2 = await bundleContext.installBundle(bundle2Headers);
      await pandino.uninstallBundle(bundle2 as BundleImpl);

      testCallTimes([addingBundleMock, 2], [modifiedBundleMock, 6], [removedBundleMock, 0]);

      const [call0, call1] = addingBundleMock.mock.calls;
      const [call2, call3, call4, call5, call6, call7] = modifiedBundleMock.mock.calls;

      testCall(call0, bundle.getSymbolicName(), undefined, undefined);
      testCall(call1, bundle2.getSymbolicName(), 'UNINSTALLED', 'INSTALLED');
      testCall(call2, bundle2.getSymbolicName(), 'UNINSTALLED', 'RESOLVED');
      testCall(call3, bundle2.getSymbolicName(), 'UNINSTALLED', 'STARTING');
      testCall(call4, bundle2.getSymbolicName(), 'UNINSTALLED', 'STARTED');
      testCall(call5, bundle2.getSymbolicName(), 'UNINSTALLED', 'STOPPING');
      testCall(call6, bundle2.getSymbolicName(), 'UNINSTALLED', 'STOPPED');
      testCall(call7, bundle2.getSymbolicName(), 'UNINSTALLED', 'UNRESOLVED');
    });
  });

  describe('via extending', () => {
    let addingBundleMock = jest.fn().mockImplementation((bundle: Bundle, event: BundleEvent) => bundle);
    let modifiedBundleMock = jest.fn();
    let removedBundleMock = jest.fn();
    let tracker: BundleTracker<Bundle>;

    class CustomTracker extends BundleTracker<any> {
      constructor(context: BundleContext, statesToMonitor: BundleState[], customizer?: BundleTrackerCustomizer<any>) {
        super(context, statesToMonitor, customizer);
      }

      addingBundle(bundle: Bundle, event: BundleEvent): any {
        return addingBundleMock(bundle, event);
      }

      modifiedBundle(bundle: Bundle, event: BundleEvent, object: any) {
        modifiedBundleMock(bundle, event, object);
      }

      remove(bundle: Bundle) {
        removedBundleMock(bundle);
      }
    }

    beforeEach(() => {
      addingBundleMock.mockClear();
      addingBundleMock.mockImplementation((bundle: Bundle, event: BundleEvent) => bundle);
      modifiedBundleMock.mockClear();
      removedBundleMock.mockClear();
      tracker = new CustomTracker(bundleContext, ['ACTIVE', 'STARTING', 'STOPPING', 'UNINSTALLED']);
      tracker.open();
    });

    afterEach(() => {
      tracker.close();
    });

    it('install', async () => {
      bundle2 = await bundleContext.installBundle(bundle2Headers);

      testCallTimes([addingBundleMock, 2], [modifiedBundleMock, 1], [removedBundleMock, 0]);

      const [initialCall, startingCall] = addingBundleMock.mock.calls;
      const [startedCall] = modifiedBundleMock.mock.calls;

      testCall(initialCall, bundle.getSymbolicName(), undefined, undefined);
      testCall(startingCall, bundle2.getSymbolicName(), 'ACTIVE', 'STARTING');
      testCall(startedCall, bundle2.getSymbolicName(), 'ACTIVE', 'STARTED');
    });

    it('stop', async () => {
      bundle2 = await bundleContext.installBundle(bundle2Headers);
      await pandino.stopBundle(bundle2 as BundleImpl);

      testCallTimes([addingBundleMock, 2], [modifiedBundleMock, 2], [removedBundleMock, 0]);

      const [initialCall, startingCall] = addingBundleMock.mock.calls;
      const [startedCall, stoppingCall] = modifiedBundleMock.mock.calls;

      testCall(initialCall, bundle.getSymbolicName(), undefined, undefined);
      testCall(startingCall, bundle2.getSymbolicName(), 'RESOLVED', 'STARTING');
      testCall(startedCall, bundle2.getSymbolicName(), 'RESOLVED', 'STARTED');
      testCall(stoppingCall, bundle2.getSymbolicName(), 'RESOLVED', 'STOPPING');
    });

    it('uninstall', async () => {
      bundle2 = await bundleContext.installBundle(bundle2Headers);
      await pandino.uninstallBundle(bundle2 as BundleImpl);

      testCallTimes([addingBundleMock, 2], [modifiedBundleMock, 2], [removedBundleMock, 0]);

      const [initialCall, startingCall] = addingBundleMock.mock.calls;
      const [startedCall, stoppingCall] = modifiedBundleMock.mock.calls;

      testCall(initialCall, bundle.getSymbolicName(), undefined, undefined);
      testCall(startingCall, bundle2.getSymbolicName(), 'UNINSTALLED', 'STARTING');
      testCall(startedCall, bundle2.getSymbolicName(), 'UNINSTALLED', 'STARTED');
      testCall(stoppingCall, bundle2.getSymbolicName(), 'UNINSTALLED', 'STOPPING');
    });
  });
});

function testCall(call: any, symName: string, eventBundleState: BundleState, eventType: BundleEventType) {
  const [bundle, event] = call;
  expect(bundle.getSymbolicName()).toEqual(symName);
  expect(event?.getBundle().getState()).toEqual(eventBundleState);
  expect(event?.getType()).toEqual(eventType);
}

function testCallTimes(...pairs: any[]) {
  for (const inner of pairs) {
    expect(inner[0]).toHaveBeenCalledTimes(inner[1]);
  }
}
