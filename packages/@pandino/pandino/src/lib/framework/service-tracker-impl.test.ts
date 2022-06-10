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
  FrameworkConfigMap,
  LOG_LEVEL_PROP,
  LogLevel,
  OBJECTCLASS,
  PANDINO_BUNDLE_IMPORTER_PROP,
  PANDINO_MANIFEST_FETCHER_PROP,
  SERVICE_BUNDLEID,
  SERVICE_ID,
  SERVICE_RANKING,
  SERVICE_SCOPE,
  ServiceProperties,
  ServiceReference,
} from '@pandino/pandino-api';
import { Pandino } from '../../pandino';
import { ServiceTrackerImpl } from './service-tracker-impl';
import Filter from '../filter/filter';

interface TestService {
  sayHello(): string;
}

describe('ServiceTrackerImpl', () => {
  let params: FrameworkConfigMap;
  let pandino: Pandino;

  const SERVICE_IDENTIFIER = '@scope/test-service';
  const expectedBaseProps: ServiceProperties = {
    [OBJECTCLASS]: SERVICE_IDENTIFIER,
    [SERVICE_BUNDLEID]: 1,
    [SERVICE_ID]: 6,
    [SERVICE_SCOPE]: 'singleton',
  };
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
  });

  afterEach(() => {
    pandino = undefined;
  });

  it('basic tracking', async () => {
    await preparePandino();

    const service: TestService = {
      sayHello(): string {
        return 'Hello!';
      },
    };
    const addingData: [ServiceProperties?, TestService?] = [];
    const modifyingData: [ServiceProperties?, TestService?] = [];
    const removingData: [ServiceProperties?, TestService?] = [];
    const bundle1 = await installBundle(bundle1Headers);

    const tracker = bundle1.getBundleContext().trackService(SERVICE_IDENTIFIER, {
      addingService(reference: ServiceReference<TestService>): TestService {
        addingData.push({ ...reference.getProperties() }, service);
        return service;
      },
      modifiedService(reference: ServiceReference<TestService>, service: TestService) {
        modifyingData.push({ ...reference.getProperties() }, service);
      },
      removedService(reference: ServiceReference<TestService>, service: TestService) {
        removingData.push({ ...reference.getProperties() }, service);
      },
    });

    tracker.open();

    const reg = bundle1.getBundleContext().registerService<TestService>(SERVICE_IDENTIFIER, service, {
      prop1: 'test',
    });

    reg.setProperties({
      ...reg.getProperties(),
      prop2: 'added-prop',
    });

    reg.unregister();

    tracker.close();

    const [addProps, addServ] = addingData;
    const [modProps, modServ] = modifyingData;
    const [remProps, remServ] = removingData;

    expect(addProps).toEqual({
      ...expectedBaseProps,
      prop1: 'test',
    });
    expect(addServ).toEqual(service);
    expect(modProps).toEqual({
      ...expectedBaseProps,
      prop1: 'test',
      prop2: 'added-prop',
    });
    expect(modServ).toEqual(service);
    expect(remProps).toEqual({
      ...expectedBaseProps,
      prop1: 'test',
      prop2: 'added-prop',
    });
    expect(remServ).toEqual(service);
  });

  it('stopping bundle triggers tracker', async () => {
    await preparePandino();

    const service: TestService = {
      sayHello(): string {
        return 'Hello!';
      },
    };
    const removingData: [ServiceProperties?, TestService?] = [];
    const bundle1 = await installBundle(bundle1Headers);
    const tracker = bundle1.getBundleContext().trackService(SERVICE_IDENTIFIER, {
      removedService(reference: ServiceReference<TestService>, service: TestService) {
        removingData.push({ ...reference.getProperties() }, service);
      },
    });

    tracker.open();

    bundle1.getBundleContext().registerService<TestService>(SERVICE_IDENTIFIER, service);

    await bundle1.stop();

    tracker.close();

    const [remProps, remServ] = removingData;

    expect(remProps).toEqual({
      ...expectedBaseProps,
    });
    expect(remServ).toEqual(service);
  });

  it('closed tracker does not record anything', async () => {
    await preparePandino();

    const service: TestService = {
      sayHello(): string {
        return 'Hello!';
      },
    };
    const addingData: [ServiceProperties?, TestService?] = [];
    const bundle1 = await installBundle(bundle1Headers);
    const tracker = bundle1.getBundleContext().trackService(SERVICE_IDENTIFIER, {
      addingService(reference: ServiceReference<TestService>): TestService {
        const service = super.addingService(reference);
        addingData.push({ ...reference.getProperties() }, service);
        return service;
      },
      modifiedService(reference: ServiceReference<TestService>, service: TestService) {},
      removedService(reference: ServiceReference<TestService>, service: TestService) {},
    });

    tracker.open();
    tracker.close();

    bundle1.getBundleContext().registerService<TestService>(SERVICE_IDENTIFIER, service, {
      prop1: 'test',
    });

    const [addProps, addServ] = addingData;

    expect(addProps).toEqual(undefined);
    expect(addServ).toEqual(undefined);
  });

  it('track by filter', async () => {
    await preparePandino();

    const service: TestService = {
      sayHello(): string {
        return 'Hello!';
      },
    };
    const addingData: [ServiceProperties?, TestService?] = [];
    const bundle1 = await installBundle(bundle1Headers);
    const tracker = bundle1.getBundleContext().trackService(Filter.parse('(prop1=test)'), {
      addingService(reference: ServiceReference<TestService>): TestService {
        const service = bundle1.getBundleContext().getService(reference);
        addingData.push({ ...reference.getProperties() }, service);
        return service;
      },
    });

    tracker.open();

    bundle1.getBundleContext().registerService<TestService>(SERVICE_IDENTIFIER, service, {
      prop1: 'test',
    });

    tracker.close();

    const [addProps, addServ] = addingData;

    expect(addProps).toEqual({
      ...expectedBaseProps,
      prop1: 'test',
    });
    expect(addServ).toEqual(service);
  });

  it('tracker methods', async () => {
    await preparePandino();

    const service: TestService = {
      sayHello(): string {
        return 'Hello!';
      },
    };
    const service2: any = {
      test: () => true,
    };
    const bundle1 = await installBundle(bundle1Headers);
    const tracker = new ServiceTrackerImpl(bundle1.getBundleContext(), SERVICE_IDENTIFIER);

    tracker.open();
    tracker.open(); // second call skips open init logic

    const reg = bundle1.getBundleContext().registerService<TestService>(SERVICE_IDENTIFIER, service, {
      prop1: 'test',
    });
    const reg2 = bundle1.getBundleContext().registerService<any>(SERVICE_IDENTIFIER, service2, {
      [SERVICE_RANKING]: 90,
    });

    expect(tracker.getServiceReferences()).toEqual([reg.getReference(), reg2.getReference()]);
    expect(tracker.getService()).toEqual(service2);
    expect(tracker.getService()).toEqual(service2); // second call tests cache
    expect(tracker.getServiceReference()).toEqual(reg2.getReference());
    expect(tracker.getServices()).toEqual([service, service2]);
    expect(tracker.size()).toEqual(2);
    expect(tracker.getTrackingCount()).toEqual(2);
    expect(tracker.isEmpty()).toEqual(false);

    tracker.close();
    tracker.close(); // second call skips close logic

    expect(tracker.getServiceReferences()).toEqual([]);
    expect(tracker.getService()).toEqual(undefined);
    expect(tracker.getServiceReference()).toEqual(undefined);
    expect(tracker.getServices()).toEqual([]);
    expect(tracker.size()).toEqual(0);
    expect(tracker.getTrackingCount()).toEqual(-1);
    expect(tracker.isEmpty()).toEqual(true);

    tracker.remove(reg.getReference());

    expect(tracker.size()).toEqual(0);
    expect(tracker.getTrackingCount()).toEqual(-1);
  });

  async function preparePandino() {
    await pandino.init();
    await pandino.start();
  }

  async function installBundle(headers: BundleManifestHeaders): Promise<Bundle> {
    return pandino.getBundleContext().installBundle(headers);
  }
});
