import {
  Bundle,
  OBJECTCLASS,
  SCOPE_SINGLETON,
  SERVICE_BUNDLEID,
  SERVICE_ID,
  SERVICE_SCOPE,
  ServiceEvent,
  ServiceProperties,
  ServiceReference,
  ServiceRegistration,
} from '@pandino/pandino-api';
import { ServiceRegistryImpl } from './service-registry-impl';
import { ServiceRegistry } from './service-registry';
import { ServiceRegistryCallbacks } from './service-registry-callbacks';

interface HelloService {
  sayHello(): string;
}

interface WelcomeService {
  welcome(): void;
}

describe('ServiceRegistryImpl', () => {
  let sr: ServiceRegistry;
  const defaultPropKeys: string[] = [OBJECTCLASS, SERVICE_ID, SERVICE_BUNDLEID, SERVICE_SCOPE];
  let bundle1: Bundle;
  let bundle2: Bundle;
  let helloService: HelloService;
  let welcomeService: WelcomeService;

  beforeEach(() => {
    sr = new ServiceRegistryImpl(null, null);
    bundle1 = {
      getBundleId: () => 2,
    } as Bundle;
    bundle2 = {
      getBundleId: () => 3,
    } as Bundle;
    helloService = {
      sayHello: () => 'hello',
    };
    welcomeService = {
      welcome: () => {},
    };
  });

  it('getRegisteredServices() returns empty list initially', async () => {
    const mockBundle: Bundle = {} as Bundle;

    expect(sr.getRegisteredServices(mockBundle).length).toEqual(0);
  });

  it('registerService() general use-cases', async () => {
    const reg: ServiceRegistration<HelloService> = sr.registerService(
      bundle1,
      '@pandino/pandino/hello-impl',
      helloService,
    );
    const ref: ServiceReference<HelloService> = reg.getReference();

    expect(sr.getRegisteredServices(bundle1).length).toEqual(1);
    expect(sr.getService(bundle1, ref, false)).toEqual(helloService);
    expect(sr.getService(bundle2, ref, false)).toEqual(helloService);

    expect(reg.getPropertyKeys()).toEqual([...defaultPropKeys]);
    expect(reg.getProperty(OBJECTCLASS)).toEqual('@pandino/pandino/hello-impl');
    expect(reg.getProperty(SERVICE_ID)).toEqual(1);
    expect(reg.getProperty(SERVICE_BUNDLEID)).toEqual(2);
    expect(reg.getProperty(SERVICE_SCOPE)).toEqual(SCOPE_SINGLETON);

    expect(ref.getBundle()).toEqual(bundle1);
    expect(ref.getUsingBundles()).toEqual([bundle1, bundle2]);
  });

  it('registerService() with custom props', async () => {
    const reg: ServiceRegistration<HelloService> = sr.registerService(
      bundle1,
      '@pandino/pandino/hello-impl',
      helloService,
      {
        propNum: 1,
        propBool: true,
        propStr: 'yayy',
      },
    );
    const ref: ServiceReference<HelloService> = reg.getReference();

    expect(ref.getPropertyKeys()).toEqual(['propNum', 'propBool', 'propStr', ...defaultPropKeys]);
    expect(ref.getProperty('propNum')).toEqual(1);
    expect(ref.getProperty('propBool')).toEqual(true);
    expect(ref.getProperty('propStr')).toEqual('yayy');
  });

  it('multiple service registrations', async () => {
    const regHello: ServiceRegistration<HelloService> = sr.registerService(
      bundle1,
      '@pandino/pandino/hello-impl',
      helloService,
    );
    const regWelcome: ServiceRegistration<WelcomeService> = sr.registerService(
      bundle1,
      '@pandino/pandino/welcome-impl',
      welcomeService,
    );

    expect(sr.getRegisteredServices(bundle1).length).toEqual(2);

    expect(regHello.getProperty(OBJECTCLASS)).toEqual('@pandino/pandino/hello-impl');
    expect(regWelcome.getProperty(OBJECTCLASS)).toEqual('@pandino/pandino/welcome-impl');
  });

  it('unregisterService()', async () => {
    const reg: ServiceRegistration<HelloService> = sr.registerService(
      bundle1,
      '@pandino/pandino/hello-impl',
      helloService,
    );
    const ref: ServiceReference<HelloService> = reg.getReference();

    sr.getService(bundle1, ref, false);
    sr.getService(bundle2, ref, false);

    expect(sr.getRegisteredServices(bundle1).length).toEqual(1);
    expect(ref.getUsingBundles()).toEqual([bundle1, bundle2]);

    sr.unregisterService(bundle1, reg);

    expect(sr.getRegisteredServices(bundle1).length).toEqual(0);
    expect(ref.getUsingBundles()).toEqual([]);
  });

  it('usageCount calculation', async () => {
    const reg: ServiceRegistration<HelloService> = sr.registerService(
      bundle1,
      '@pandino/pandino/hello-impl',
      helloService,
    );
    const ref: ServiceReference<HelloService> = reg.getReference();
    const uc1 = sr.obtainUsageCount(bundle1, ref, helloService);
    const uc2 = sr.obtainUsageCount(bundle2, ref, helloService);

    sr.getService(bundle1, ref, false);
    sr.getService(bundle1, ref, false);
    sr.getService(bundle2, ref, false);

    expect(uc1.getCount()).toEqual(2);
    expect(uc2.getCount()).toEqual(1);

    sr.unregisterService(bundle1, reg);

    expect(uc1.getCount()).toEqual(0);
    expect(uc2.getCount()).toEqual(0);
  });

  it('getService() returns working service', async () => {
    const reg: ServiceRegistration<HelloService> = sr.registerService(
      bundle1,
      '@pandino/pandino/hello-impl',
      helloService,
    );
    const ref: ServiceReference<HelloService> = reg.getReference();

    const service = sr.getService(bundle1, ref, false);

    expect(service.sayHello()).toEqual('hello');
  });

  it('unregister() removes Reference from ServiceRegistration', async () => {
    const reg: ServiceRegistration<HelloService> = sr.registerService(
      bundle1,
      '@pandino/pandino/hello-impl',
      helloService,
    );
    const ref: ServiceReference<HelloService> = reg.getReference();

    reg.unregister();

    const service = sr.getService(bundle1, ref, false);

    expect(service).toEqual(null);
  });

  it('service properties modified triggers event', async () => {
    let serviceEvent: ServiceEvent;
    let oldServiceProps: ServiceProperties;
    const mockServiceChanged = jest.fn().mockImplementation((eventObj, oldProps) => {
      serviceEvent = eventObj;
      oldServiceProps = oldProps;
    });
    const callbacks: ServiceRegistryCallbacks = {
      serviceChanged: mockServiceChanged,
    };
    sr = new ServiceRegistryImpl(null, callbacks);
    const reg: ServiceRegistration<HelloService> = sr.registerService(
      bundle1,
      '@pandino/pandino/hello-impl',
      helloService,
    );
    const ref: ServiceReference<HelloService> = reg.getReference();
    const oldProps = {
      objectClass: '@pandino/pandino/hello-impl',
      'service.bundleid': 2,
      'service.id': 1,
      'service.scope': 'singleton',
    };

    reg.setProperties({
      'new-prop': 'new value!',
    });

    expect(mockServiceChanged).toHaveBeenCalledTimes(1);
    expect(serviceEvent.getType()).toEqual('MODIFIED');
    expect(serviceEvent.getServiceReference()).toEqual(ref);
    expect(oldServiceProps).toEqual(oldProps);
    expect(ref.getProperties()).toEqual({
      'new-prop': 'new value!',
      ...oldProps,
    });
  });
});
