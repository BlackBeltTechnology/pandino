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
  LOG_LEVEL_PROP,
  LogLevel, OBJECTCLASS,
  PANDINO_BUNDLE_IMPORTER_PROP,
  PANDINO_MANIFEST_FETCHER_PROP,
  SERVICE_BUNDLEID,
  SERVICE_ID,
  SERVICE_SCOPE,
  ServiceProperties,
  ServiceReference,
} from '@pandino/pandino-api';
import { Pandino } from '../../pandino';
import { ServiceTracker } from './service-tracker';

interface TestService {
  sayHello(): string;
}

describe('ServiceTracker', () => {
  let params: FrameworkConfigMap;
  let pandino: Pandino;

  const SERVICE_IDENTIFIER = '@scope/test-service';
  const mockStart = jest.fn().mockReturnValue(Promise.resolve());
  const mockStop = jest.fn().mockReturnValue(Promise.resolve());
  const dummyActivator: BundleActivator = {
    start: mockStart,
    stop: mockStop,
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

  beforeEach(() => {
    mockStart.mockClear();
    mockStart.mockImplementation(() => {});
    mockStop.mockClear();
    params = {
      [DEPLOYMENT_ROOT_PROP]: '',
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
    const expectedBaseProps: ServiceProperties = {
      [OBJECTCLASS]: SERVICE_IDENTIFIER,
      [SERVICE_BUNDLEID]: 1,
      [SERVICE_ID]: 6,
      [SERVICE_SCOPE]: 'singleton',
    };

    const addingData: [ServiceProperties?, TestService?] = [];
    const modifyingData: [ServiceProperties?, TestService?] = [];
    const removingData: [ServiceProperties?, TestService?] = [];

    const bundle1 = await installBundle(bundle1Headers);

    const tracker = new (class extends ServiceTracker<TestService, TestService> {
      constructor() {
        super(bundle1.getBundleContext(), SERVICE_IDENTIFIER);
      }

      addingService(reference: ServiceReference<TestService>): TestService {
        const service = super.addingService(reference);
        addingData.push({...reference.getProperties()}, service);
        return service;
      }

      modifiedService(reference: ServiceReference<TestService>, service: TestService) {
        super.modifiedService(reference, service);
        modifyingData.push({...reference.getProperties()}, service);
      }

      removedService(reference: ServiceReference<TestService>, service: TestService) {
        super.removedService(reference, service);
        removingData.push({...reference.getProperties()}, service);
      }
    })();

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

  async function preparePandino() {
    await pandino.init();
    await pandino.start();
  }

  async function installBundle(headers: BundleManifestHeaders): Promise<Bundle> {
    return pandino.getBundleContext().installBundle(headers);
  }
});
