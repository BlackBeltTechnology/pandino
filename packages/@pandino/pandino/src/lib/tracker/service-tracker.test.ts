import {
  Bundle,
  BUNDLE_ACTIVATOR,
  BUNDLE_DESCRIPTION,
  BUNDLE_NAME,
  BUNDLE_SYMBOLICNAME,
  BUNDLE_VERSION,
  BundleActivator,
  BundleImporter,
  BundleManifestHeaders,
  DEPLOYMENT_ROOT_PROP,
  FrameworkConfigMap,
  LOG_LOGGER_PROP,
  Logger,
  OBJECTCLASS,
  PANDINO_BUNDLE_IMPORTER_PROP,
  PANDINO_MANIFEST_FETCHER_PROP,
  ServiceReference,
  ServiceTrackerCustomizer,
} from '@pandino/pandino-api';
import { Pandino } from '../../pandino';
import { BundleContextImpl } from '../framework/bundle-context-impl';
import { MuteLogger } from '../../__mocks__/mute-logger';
import { BundleImpl } from '../framework/bundle-impl';
import { ServiceTracker } from './service-tracker';
import Filter from '../filter/filter';

interface MockService {
  execute(): boolean;
}

describe('ServiceTracker', () => {
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
  let params: FrameworkConfigMap;
  let logger: Logger;
  let pandino: Pandino;
  let bundle: Bundle;
  let bundleContext: BundleContextImpl;
  let mockService: MockService;

  beforeEach(async () => {
    logger = new MuteLogger();
    params = {
      [DEPLOYMENT_ROOT_PROP]: '',
      [PANDINO_MANIFEST_FETCHER_PROP]: jest.fn() as any,
      [PANDINO_BUNDLE_IMPORTER_PROP]: importer,
      [LOG_LOGGER_PROP]: logger,
    };
    pandino = new Pandino(params);
    mockService = {
      execute: () => true,
    };

    await pandino.init();
    await pandino.start();
    await pandino.getBundleContext().installBundle(bundle1Headers);

    bundle = pandino.getBundleContext().getBundles()[0];
    bundleContext = new BundleContextImpl(logger, bundle as BundleImpl, pandino);
  });

  describe('with customizer', () => {
    let addingServiceMock = jest
      .fn()
      .mockImplementation((reference: ServiceReference<any>) => bundleContext.getService(reference));
    let modifiedServiceMock = jest.fn();
    let removedServiceMock = jest.fn();
    let customizer: ServiceTrackerCustomizer<any, any>;
    let tracker: ServiceTracker<any, any>;

    beforeEach(() => {
      addingServiceMock.mockClear();
      addingServiceMock.mockImplementation((reference: ServiceReference<any>) => bundleContext.getService(reference));
      modifiedServiceMock.mockClear();
      removedServiceMock.mockClear();
      customizer = {
        addingService: addingServiceMock,
        modifiedService: modifiedServiceMock,
        removedService: removedServiceMock,
      };
    });

    afterEach(() => {
      tracker.close();
    });

    it('identification mismatch result in no event triggering', async () => {
      tracker = new ServiceTracker<any, any>(bundleContext, customizer, {
        clazz: 'path.for.nothing',
      });
      tracker.open();
      await bundleContext.registerService<MockService>('test.mock-service', mockService);

      testCallTimes([addingServiceMock, 0], [modifiedServiceMock, 0], [removedServiceMock, 0]);
    });

    it('test with identification match on objectClass', async () => {
      tracker = new ServiceTracker<any, any>(bundleContext, customizer, {
        clazz: 'test.mock-service',
      });
      tracker.open();

      const registration = await bundleContext.registerService<MockService>('test.mock-service', mockService);
      const reference = registration.getReference();

      const [addingCall] = addingServiceMock.mock.calls;
      testCallTimes([addingServiceMock, 1], [modifiedServiceMock, 0], [removedServiceMock, 0]);
      testCall(addingCall, reference);

      registration.setProperties({
        'new-prop': 'new-value',
      });

      const [modifyingCall] = modifiedServiceMock.mock.calls;
      testCallTimes([addingServiceMock, 1], [modifiedServiceMock, 1], [removedServiceMock, 0]);
      testCall(modifyingCall, reference, mockService, {
        'new-prop': 'new-value',
      });

      registration.unregister();

      const [removeCall] = removedServiceMock.mock.calls;
      testCallTimes([addingServiceMock, 1], [modifiedServiceMock, 1], [removedServiceMock, 1]);
      testCall(removeCall, reference, mockService, {
        'new-prop': 'new-value',
      });
    });

    it('test with identification match on FilterAPI', async () => {
      tracker = new ServiceTracker<any, any>(bundleContext, customizer, {
        filter: Filter.parse(`(${OBJECTCLASS}=test.mock-service)`),
      });
      tracker.open();

      const registration = await bundleContext.registerService<MockService>('test.mock-service', mockService);
      const reference = registration.getReference();

      const [addingCall] = addingServiceMock.mock.calls;
      testCallTimes([addingServiceMock, 1], [modifiedServiceMock, 0], [removedServiceMock, 0]);
      testCall(addingCall, reference);

      registration.setProperties({
        'new-prop': 'new-value',
      });

      const [modifyingCall] = modifiedServiceMock.mock.calls;
      testCallTimes([addingServiceMock, 1], [modifiedServiceMock, 1], [removedServiceMock, 0]);
      testCall(modifyingCall, reference, mockService, {
        'new-prop': 'new-value',
      });

      registration.unregister();

      const [removeCall] = removedServiceMock.mock.calls;
      testCallTimes([addingServiceMock, 1], [modifiedServiceMock, 1], [removedServiceMock, 1]);
      testCall(removeCall, reference, mockService, {
        'new-prop': 'new-value',
      });
    });

    it('test with identification match on reference', async () => {
      const registration = await bundleContext.registerService<MockService>('test.mock-service', mockService);
      const reference = registration.getReference();
      tracker = new ServiceTracker<any, any>(bundleContext, customizer, {
        reference,
      });
      tracker.open();

      registration.setProperties({
        'new-prop': 'new-value',
      });

      const [addingCall] = addingServiceMock.mock.calls;
      const [modifyingCall] = modifiedServiceMock.mock.calls;
      testCallTimes([addingServiceMock, 1], [modifiedServiceMock, 1], [removedServiceMock, 0]);
      testCall(addingCall, reference);
      testCall(modifyingCall, reference, mockService, {
        'new-prop': 'new-value',
      });

      registration.unregister();

      const [removeCall] = removedServiceMock.mock.calls;
      testCallTimes([addingServiceMock, 1], [modifiedServiceMock, 1], [removedServiceMock, 1]);
      testCall(removeCall, reference, mockService, {
        'new-prop': 'new-value',
      });
    });
  });
});

function testCall(call: any, reference: ServiceReference<any>, serviceObj?: any, propCheck = {}) {
  const [serviceReference, instance] = call;
  expect(serviceReference).toEqual(reference);
  expect(instance).toEqual(serviceObj);
  Object.keys(propCheck).forEach((p) => {
    // @ts-ignore
    expect(serviceReference.getProperty(p)).toEqual(propCheck[p]);
  });
}

function testCallTimes(...pairs: any[]) {
  for (const inner of pairs) {
    expect(inner[0]).toHaveBeenCalledTimes(inner[1]);
  }
}
