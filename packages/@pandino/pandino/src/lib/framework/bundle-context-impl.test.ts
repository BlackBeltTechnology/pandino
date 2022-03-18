import { Pandino } from '../../pandino';
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
  BundleImporter,
  LOG_LEVEL_PROP,
  Logger,
  LogLevel,
  OBJECTCLASS,
  PANDINO_BUNDLE_IMPORTER_PROP,
  ServiceListener,
  ServiceReference,
  FrameworkConfigMap,
  DEPLOYMENT_ROOT_PROP,
  PANDINO_MANIFEST_FETCHER_PROP,
  SERVICE_RANKING,
} from '@pandino/pandino-api';
import { MuteLogger } from '../../__mocks__/mute-logger';
import { BundleContextImpl } from './bundle-context-impl';
import { BundleImpl } from './bundle-impl';
import { BundleEventImpl } from './bundle-event-impl';
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
  const importer: BundleImporter = {
    import: (root: string, activator: string, manifest: string) =>
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
    [BUNDLE_SYMBOLICNAME]: '@scope/other/bundle',
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
  let params: FrameworkConfigMap;
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
    params = {
      [DEPLOYMENT_ROOT_PROP]: '',
      [PANDINO_MANIFEST_FETCHER_PROP]: jest.fn() as any,
      [PANDINO_BUNDLE_IMPORTER_PROP]: importer,
      [LOG_LEVEL_PROP]: LogLevel.WARN,
      'custom-prop': 'custom-value',
    };
    pandino = new Pandino(params);

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

  it('initialization', async () => {
    expect(bundle.getSymbolicName()).toEqual('@scope/bundle');
    expect(bundle.getVersion().toString()).toEqual('1.2.3');
    expect(bundleContext).toBeDefined();

    await new Promise((r) => setTimeout(r, 100));

    expect(frameworkEvent).toHaveBeenCalledTimes(1);
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

  it('removeFrameworkListener()', async () => {
    frameworkEvent.mockClear();
    pandino = new Pandino(params);

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
    await new Promise((r) => setTimeout(r, 100));
    const event0: BundleEventImpl = bundleChanged.mock.calls[0][0];
    const event1: BundleEventImpl = bundleChanged.mock.calls[1][0];
    const event2: BundleEventImpl = bundleChanged.mock.calls[2][0];
    const event3: BundleEventImpl = bundleChanged.mock.calls[3][0];

    expect(bundleChanged).toHaveBeenCalledTimes(4);

    expect(event0.getBundle().getSymbolicName()).toEqual('@scope/other/bundle');
    expect(event0.getType()).toEqual('INSTALLED');

    expect(event1.getBundle().getSymbolicName()).toEqual('@scope/other/bundle');
    expect(event1.getType()).toEqual('RESOLVED');

    expect(event2.getBundle().getSymbolicName()).toEqual('@scope/other/bundle');
    expect(event2.getType()).toEqual('STARTING');

    expect(event3.getBundle().getSymbolicName()).toEqual('@scope/other/bundle');
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
    bundleContext.registerService<MockService>('@scope/bundle/some/service', mockService);
    const event0: ServiceEventImpl = serviceChanged.mock.calls[0][0];

    expect(serviceChanged).toHaveBeenCalledTimes(1);

    expect(event0.getServiceReference().getBundle().getSymbolicName()).toEqual('@scope/bundle');
    expect(event0.getServiceReference().getProperty(OBJECTCLASS)).toEqual('@scope/bundle/some/service');
    expect(event0.getType()).toEqual('REGISTERED');
  });

  it('addServiceListener() with filter', () => {
    bundleContext.addServiceListener(serviceChangedListener, '(objectClass=@scope/some/filtered/service)');
    bundleContext.registerService<MockService>('@scope/some/filtered/service', mockService);
    const event0: ServiceEventImpl = serviceChanged.mock.calls[0][0];

    expect(serviceChanged).toHaveBeenCalledTimes(1);

    expect(event0.getServiceReference().getBundle().getSymbolicName()).toEqual('@scope/bundle');
    expect(event0.getServiceReference().getProperty(OBJECTCLASS)).toEqual('@scope/some/filtered/service');
    expect(event0.getType()).toEqual('REGISTERED');
  });

  it('removeServiceListener()', () => {
    bundleContext.addServiceListener(serviceChangedListener);
    bundleContext.removeServiceListener(serviceChangedListener);
    bundleContext.registerService<MockService>('@scope/bundle/service', mockService);

    expect(serviceChanged).toHaveBeenCalledTimes(0);
  });

  it('getServiceReference()', () => {
    bundleContext.registerService<MockService>('@scope/bundle/service', mockService, {
      'prop-one': 'val-one',
      'prop-two': 2,
    });
    const reference: ServiceReference<MockService> = bundleContext.getServiceReference('@scope/bundle/service');

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
    bundleContext.registerService<MockService>('@scope/bundle/service', mockService, {
      'prop-one': 'val-one',
    });
    bundleContext.registerService<MockService>('@scope/bundle/service', otherMockService, {
      'prop-one': 'val-two',
    });
    const references = bundleContext.getServiceReferences('@scope/bundle/service', '(prop-one=val-two)');
    const ref1 = references[0];

    expect(references.length).toEqual(1);
    expect(ref1.getProperty('prop-one')).toEqual('val-two');
  });

  it('getService()', () => {
    bundleContext.registerService<MockService>('@scope/bundle/service', mockService);
    const reference: ServiceReference<MockService> = bundleContext.getServiceReference('@scope/bundle/service');
    const service = bundleContext.getService<MockService>(reference);

    expect(service.execute()).toEqual(true);
  });

  it('unGetService()', () => {
    bundleContext.registerService<MockService>('@scope/bundle/service', mockService);
    const reference: ServiceReference<MockService> = bundleContext.getServiceReference('@scope/bundle/service');
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

    bundleContext.registerService<MockService>('@scope/bundle/service', mockService);

    const reference: ServiceReference<MockService> = otherContext.getServiceReference('@scope/bundle/service');
    const service = otherContext.getService<MockService>(reference);

    expect(reference.getBundle().getSymbolicName()).toEqual('@scope/bundle');
    expect(reference.getUsingBundles()[0].getSymbolicName()).toEqual('@scope/other/bundle');
    expect(reference.getUsingBundles().length).toEqual(1);
    expect(service.execute()).toEqual(true);
  });

  it('Service with a higher ranking overrides Service with a lower ranking', () => {
    const mock1: MockService = {
      execute: () => true,
    };
    const mock2: MockService = {
      execute: () => false,
    };
    const serviceRegistration1 = bundleContext.registerService<MockService>('@scope/bundle/service', mock1);
    const serviceRegistration2 = bundleContext.registerService<MockService>('@scope/bundle/service', mock2, {
      [SERVICE_RANKING]: 150,
    });

    const reference: ServiceReference<MockService> = bundleContext.getServiceReference('@scope/bundle/service');
    const service = bundleContext.getService<MockService>(reference);

    expect(serviceRegistration1.getProperty(SERVICE_RANKING)).toEqual(undefined);
    expect(serviceRegistration2.getProperty(SERVICE_RANKING)).toEqual(150);
    expect(reference.getProperty(SERVICE_RANKING)).toEqual(150);
    expect(service.execute()).toEqual(false);
  });

  it('Service with a lower ranking does not override Service with a higher ranking', () => {
    const mock1: MockService = {
      execute: () => true,
    };
    const mock2: MockService = {
      execute: () => false,
    };
    const serviceRegistration1 = bundleContext.registerService<MockService>('@scope/bundle/service', mock1, {
      [SERVICE_RANKING]: 150,
    });
    const serviceRegistration2 = bundleContext.registerService<MockService>('@scope/bundle/service', mock2);

    const reference: ServiceReference<MockService> = bundleContext.getServiceReference('@scope/bundle/service');
    const service = bundleContext.getService<MockService>(reference);

    expect(serviceRegistration1.getProperty(SERVICE_RANKING)).toEqual(150);
    expect(serviceRegistration2.getProperty(SERVICE_RANKING)).toEqual(undefined);
    expect(reference.getProperty(SERVICE_RANKING)).toEqual(150);
    expect(service.execute()).toEqual(true);
  });

  it('Service with a higher ranking overrides Service with a higher ranking', () => {
    const mock1: MockService = {
      execute: () => true,
    };
    const mock2: MockService = {
      execute: () => false,
    };
    const serviceRegistration1 = bundleContext.registerService<MockService>('@scope/bundle/service', mock1);
    const serviceRegistration2 = bundleContext.registerService<MockService>('@scope/bundle/service', mock2, {
      [SERVICE_RANKING]: 150,
    });

    const reference: ServiceReference<MockService> = bundleContext.getServiceReference('@scope/bundle/service');
    const service = bundleContext.getService<MockService>(reference);

    expect(serviceRegistration1.getProperty(SERVICE_RANKING)).toEqual(undefined);
    expect(serviceRegistration2.getProperty(SERVICE_RANKING)).toEqual(150);
    expect(reference.getProperty(SERVICE_RANKING)).toEqual(150);
    expect(service.execute()).toEqual(false);
  });
});
