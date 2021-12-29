import Pandino from '../../pandino';
import {
  Bundle,
  BUNDLE_ACTIVATOR,
  BUNDLE_DESCRIPTION,
  BUNDLE_NAME,
  BUNDLE_SYMBOLICNAME,
  BUNDLE_VERSION,
  BundleActivator,
  BundleListener,
  BundleManifestHeaders,
  FrameworkListener,
  LOG_LOGGER_PROP,
  Logger,
  OBJECTCLASS,
  ServiceListener,
  ServiceReference,
} from '@pandino/pandino-api';
import { MuteLogger } from '../../__mocks__/mute-logger';
import { BundleContextImpl } from './bundle-context-impl';
import { BundleImpl } from './bundle-impl';
import { BundleEventImpl } from './bundle-event-impl';
import { FrameworkEventImpl } from './framework-event-impl';
import Filter from '../filter/filter';
import { ServiceEventImpl } from './service-event-impl';

interface MockService {
  execute(): boolean;
}

describe('BundleContextImpl', () => {
  const dummyActivator: BundleActivator = {
    start: jest.fn(),
    stop: jest.fn(),
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
    [BUNDLE_SYMBOLICNAME]: 'my.other.bundle',
    [BUNDLE_VERSION]: '1.0.0',
    [BUNDLE_ACTIVATOR]: 'https://some.url/does-not-exist.js',
    [BUNDLE_NAME]: 'Other Bundle',
  };
  const frameworkEvent = jest.fn().mockImplementation();
  const frameworkEventListener: FrameworkListener = {
    frameworkEvent,
  };
  const bundleChanged = jest.fn().mockImplementation();
  const bundleChangedListener: BundleListener = {
    bundleChanged,
  };
  const serviceChanged = jest.fn().mockImplementation();
  const serviceChangedListener: ServiceListener = {
    serviceChanged,
  };
  let params: Map<string, any>;
  let logger: Logger;
  let pandino: Pandino;
  let bundle: Bundle;
  let bundleContext: BundleContextImpl;
  let mockService: MockService;

  beforeEach(async () => {
    frameworkEvent.mockClear();
    bundleChanged.mockClear();
    serviceChanged.mockClear();
    logger = new MuteLogger();
    params = new Map<string, any>([
      [LOG_LOGGER_PROP, new MuteLogger()],
      ['custom-prop', 'custom-value'],
    ]);
    pandino = new Pandino(importer, params);

    await pandino.init(frameworkEventListener);
    await pandino.start();
    await pandino.getBundleContext().installBundle(bundle1Headers);

    bundle = pandino.getBundleContext().getBundles()[0];
    bundleContext = new BundleContextImpl(logger, bundle as BundleImpl, pandino);
    mockService = {
      execute(): boolean {
        return true;
      },
    };
  });

  it('initialization', () => {
    expect(bundle.getSymbolicName()).toEqual('my.bundle');
    expect(bundle.getVersion().toString()).toEqual('1.2.3');
    expect(bundleContext).toBeDefined();
  });

  it('getBundles()', () => {
    expect(bundleContext.getBundles().length).toEqual(1);
  });

  it('getBundle() with and without param', () => {
    expect(bundleContext.getBundle()).toEqual(bundle);
    expect(bundleContext.getBundle(1)).toEqual(bundle);
  });

  it('getProperty()', () => {
    expect(bundleContext.getProperty('custom-prop')).toEqual('custom-value');
  });

  it('valid and invalidate()', () => {
    expect(bundleContext.isValid()).toEqual(true);

    bundleContext.invalidate();

    expect(bundleContext.isValid()).toEqual(false);
  });

  it('addFrameworkListener() fails for invalid Context', () => {
    bundleContext.invalidate();

    expect(() => {
      bundleContext.addFrameworkListener(frameworkEventListener);
    }).toThrow();
  });

  it('addFrameworkListener()', () => {
    const event0: FrameworkEventImpl = frameworkEvent.mock.calls[0][0];

    expect(frameworkEvent).toHaveBeenCalledTimes(1);

    expect(event0.getBundle().getSymbolicName()).toEqual('io.pandino.framework');
    expect(event0.getType()).toEqual('STARTED');
  });

  it('removeFrameworkListener()', async () => {
    frameworkEvent.mockClear();
    pandino = new Pandino(importer, params);

    await pandino.init(frameworkEventListener);
    pandino.getBundleContext().removeFrameworkListener(frameworkEventListener);
    await pandino.start();

    expect(frameworkEvent).toHaveBeenCalledTimes(0);
  });

  it('addBundleListener() fails for invalid Context', () => {
    bundleContext.invalidate();

    expect(() => {
      bundleContext.addBundleListener(bundleChangedListener);
    }).toThrow();
  });

  it('addBundleListener()', async () => {
    bundleContext.addBundleListener(bundleChangedListener);
    await bundleContext.installBundle(bundle2Headers);
    const event0: BundleEventImpl = bundleChanged.mock.calls[0][0];
    const event1: BundleEventImpl = bundleChanged.mock.calls[1][0];
    const event2: BundleEventImpl = bundleChanged.mock.calls[2][0];
    const event3: BundleEventImpl = bundleChanged.mock.calls[3][0];

    expect(bundleChanged).toHaveBeenCalledTimes(4);

    expect(event0.getBundle().getSymbolicName()).toEqual('my.other.bundle');
    expect(event0.getType()).toEqual('INSTALLED');

    expect(event1.getBundle().getSymbolicName()).toEqual('my.other.bundle');
    expect(event1.getType()).toEqual('RESOLVED');

    expect(event2.getBundle().getSymbolicName()).toEqual('my.other.bundle');
    expect(event2.getType()).toEqual('STARTING');

    expect(event3.getBundle().getSymbolicName()).toEqual('my.other.bundle');
    expect(event3.getType()).toEqual('STARTED');
  });

  it('removeBundleListener()', async () => {
    bundleContext.addBundleListener(bundleChangedListener);
    bundleContext.removeBundleListener(bundleChangedListener);
    await bundleContext.installBundle(bundle2Headers);

    expect(bundleChanged).toHaveBeenCalledTimes(0);
  });

  it('createFilter()', () => {
    const filter = bundleContext.createFilter('(&(sn=jensen)(gn=jenny))');

    expect(filter).toBeDefined();
    expect(filter instanceof Filter).toEqual(true);
  });

  it('addServiceListener() fails for invalid Context', () => {
    bundleContext.invalidate();

    expect(() => {
      bundleContext.addServiceListener(serviceChangedListener);
    }).toThrow();
  });

  it('addServiceListener()', () => {
    bundleContext.addServiceListener(serviceChangedListener);
    bundleContext.registerService<MockService>('some.service', mockService);
    const event0: ServiceEventImpl = serviceChanged.mock.calls[0][0];

    expect(serviceChanged).toHaveBeenCalledTimes(1);

    expect(event0.getServiceReference().getBundle().getSymbolicName()).toEqual('my.bundle');
    expect(event0.getServiceReference().getProperty(OBJECTCLASS)).toEqual('some.service');
    expect(event0.getType()).toEqual('REGISTERED');
  });

  it('removeServiceListener()', () => {
    bundleContext.addServiceListener(serviceChangedListener);
    bundleContext.removeServiceListener(serviceChangedListener);
    bundleContext.registerService<MockService>('some.service', mockService);

    expect(serviceChanged).toHaveBeenCalledTimes(0);
  });

  it('getServiceReference()', () => {
    bundleContext.registerService<MockService>('some.service', mockService, {
      'prop-one': 'val-one',
      'prop-two': 2,
    });
    const reference: ServiceReference<MockService> = bundleContext.getServiceReference('some.service');

    expect(reference.getProperty('prop-one')).toEqual('val-one');
    expect(reference.getProperty('prop-two')).toEqual(2);
    expect(reference.getUsingBundles().length).toEqual(0);
  });

  it('getServiceReferences() with proper filter', () => {
    const otherMockService: MockService = {
      execute(): boolean {
        return false;
      },
    };
    bundleContext.registerService<MockService>('some.service', mockService, {
      'prop-one': 'val-one',
    });
    bundleContext.registerService<MockService>('some.service', otherMockService, {
      'prop-one': 'val-two',
    });
    const references = bundleContext.getServiceReferences('some.service', '(prop-one=val-two)');
    const ref1 = references[0];

    expect(references.length).toEqual(1);
    expect(ref1.getProperty('prop-one')).toEqual('val-two');
  });

  it('getService()', () => {
    bundleContext.registerService<MockService>('some.service', mockService);
    const reference: ServiceReference<MockService> = bundleContext.getServiceReference('some.service');
    const service = bundleContext.getService<MockService>(reference);

    expect(service.execute()).toEqual(true);
  });

  it('unGetService()', () => {
    bundleContext.registerService<MockService>('some.service', mockService);
    const reference: ServiceReference<MockService> = bundleContext.getServiceReference('some.service');
    const service = bundleContext.getService<MockService>(reference);

    expect(reference.getUsingBundles().length).toEqual(1);
    expect(service.execute()).toEqual(true);

    const firstUnGet = bundleContext.ungetService(reference);

    expect(reference.getUsingBundles().length).toEqual(0);
    expect(firstUnGet).toEqual(true);

    const secondUnGet = bundleContext.ungetService(reference);

    expect(reference.getUsingBundles().length).toEqual(0);
    expect(secondUnGet).toEqual(false);
  });

  it('Cross Bundle Service Access', async () => {
    bundleContext.addBundleListener(bundleChangedListener);
    const otherBundle = await bundleContext.installBundle(bundle2Headers);
    const otherContext = otherBundle.getBundleContext();

    bundleContext.registerService<MockService>('some.service', mockService);

    const reference: ServiceReference<MockService> = otherContext.getServiceReference('some.service');
    const service = otherContext.getService<MockService>(reference);

    expect(reference.getBundle().getSymbolicName()).toEqual('my.bundle');
    expect(reference.getUsingBundles()[0].getSymbolicName()).toEqual('my.other.bundle');
    expect(reference.getUsingBundles().length).toEqual(1);
    expect(service.execute()).toEqual(true);
  });
});
