import {
  Bundle,
  OBJECTCLASS,
  PrototypeServiceFactory,
  SCOPE_PROTOTYPE,
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

  it('registerService() general use-cases', () => {
    const reg: ServiceRegistration<HelloService> = sr.registerService(
      bundle1,
      '@pandino/pandino/hello-impl',
      helloService,
    );
    const ref: ServiceReference<HelloService> = reg.getReference();

    expect(sr.getRegisteredServices(bundle1).length).toEqual(1);
    expect(sr.getService(bundle1, ref)).toEqual(helloService);
    expect(sr.getService(bundle2, ref)).toEqual(helloService);

    expect(reg.getPropertyKeys()).toEqual([...defaultPropKeys]);
    expect(reg.getProperty(OBJECTCLASS)).toEqual('@pandino/pandino/hello-impl');
    expect(reg.getProperty(SERVICE_ID)).toEqual(1);
    expect(reg.getProperty(SERVICE_BUNDLEID)).toEqual(2);
    expect(reg.getProperty(SERVICE_SCOPE)).toEqual(SCOPE_SINGLETON);

    expect(ref.getBundle()).toEqual(bundle1);
    expect(ref.getUsingBundles()).toEqual([bundle1, bundle2]);
  });

  it('registerService() with custom props', () => {
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

  it('multiple service registrations', () => {
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

  it('unregisterService()', () => {
    const reg: ServiceRegistration<HelloService> = sr.registerService(
      bundle1,
      '@pandino/pandino/hello-impl',
      helloService,
    );
    const ref: ServiceReference<HelloService> = reg.getReference();

    sr.getService(bundle1, ref);
    sr.getService(bundle2, ref);

    expect(sr.getRegisteredServices(bundle1).length).toEqual(1);
    expect(ref.getUsingBundles()).toEqual([bundle1, bundle2]);

    sr.unregisterService(bundle1, reg);

    expect(sr.getRegisteredServices(bundle1).length).toEqual(0);
    expect(ref.getUsingBundles()).toEqual([]);
  });

  it('unregisterServices()', () => {
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
    const refHello: ServiceReference<HelloService> = regHello.getReference();
    const refWelcome: ServiceReference<WelcomeService> = regWelcome.getReference();

    sr.getService(bundle1, refHello);
    sr.getService(bundle1, refWelcome);

    expect(sr.getRegisteredServices(bundle1).length).toEqual(2);
    expect(refHello.getUsingBundles()).toEqual([bundle1]);
    expect(refWelcome.getUsingBundles()).toEqual([bundle1]);

    sr.unregisterServices(bundle1);

    expect(sr.getRegisteredServices(bundle1).length).toEqual(0);
    expect(refHello.getUsingBundles()).toEqual([]);
    expect(refWelcome.getUsingBundles()).toEqual([]);
  });

  it('usageCount calculation', () => {
    const reg: ServiceRegistration<HelloService> = sr.registerService(
      bundle1,
      '@pandino/pandino/hello-impl',
      helloService,
    );
    const ref: ServiceReference<HelloService> = reg.getReference();
    const uc1 = sr.obtainUsageCount(bundle1, ref, helloService);
    const uc2 = sr.obtainUsageCount(bundle2, ref, helloService);

    sr.getService(bundle1, ref);
    sr.getService(bundle1, ref);
    sr.getService(bundle2, ref);

    expect(uc1.getCount()).toEqual(2);
    expect(uc2.getCount()).toEqual(1);

    sr.unregisterService(bundle1, reg);

    expect(uc1.getCount()).toEqual(0);
    expect(uc2.getCount()).toEqual(0);
  });

  it('getService() returns singleton service', () => {
    const reg: ServiceRegistration<HelloService> = sr.registerService(
      bundle1,
      '@pandino/pandino/hello-impl',
      helloService,
    );
    const ref: ServiceReference<HelloService> = reg.getReference();

    const service1 = sr.getService<HelloService>(bundle1, ref);
    const service2 = sr.getService<HelloService>(bundle1, ref);

    expect(service1.sayHello()).toEqual('hello');
    expect(service2.sayHello()).toEqual('hello');
    expect(service1).toEqual(service2);
  });

  it('unregister() removes Reference from ServiceRegistration', () => {
    const reg: ServiceRegistration<HelloService> = sr.registerService(
      bundle1,
      '@pandino/pandino/hello-impl',
      helloService,
    );
    const ref: ServiceReference<HelloService> = reg.getReference();

    reg.unregister();

    const service = sr.getService(bundle1, ref);

    expect(service).toEqual(undefined);
  });

  it('service properties modified triggers event', () => {
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

  it('register() prototype factory', () => {
    const prototypeFactory: PrototypeServiceFactory<HelloService> = {
      factoryType: 'service-prototype',
      getService(bundle: Bundle, registration: ServiceRegistration<HelloService>): HelloService {
        return {
          sayHello(): string {
            return 'Created by factory service!';
          },
        };
      },
      ungetService(bundle: Bundle, registration: ServiceRegistration<HelloService>, service: HelloService) {},
    };
    const reg: ServiceRegistration<HelloService> = sr.registerService(
      bundle1,
      '@pandino/pandino/hello-impl',
      prototypeFactory,
      {
        [SERVICE_SCOPE]: SCOPE_PROTOTYPE,
      },
    );
    const ref: ServiceReference<HelloService> = reg.getReference();
    const service1 = sr.getService(bundle1, ref, true);
    const service2 = sr.getService(bundle1, ref, true);

    expect(service1.sayHello()).toEqual('Created by factory service!');
    expect(service2.sayHello()).toEqual('Created by factory service!');
    expect(service1).not.toEqual(service2);
  });

  it('usageCount calculation for prototype factory', () => {
    const prototypeFactory: PrototypeServiceFactory<string> = {
      factoryType: 'service-prototype',
      getService(bundle: Bundle, registration: ServiceRegistration<HelloService>): string {
        return 'Created by factory service!';
      },
      ungetService(bundle: Bundle, registration: ServiceRegistration<string>, service: string) {},
    };
    const reg: ServiceRegistration<string> = sr.registerService(
      bundle1,
      '@pandino/pandino/hello-impl',
      prototypeFactory,
      {
        [SERVICE_SCOPE]: SCOPE_PROTOTYPE,
      },
    );
    const ref: ServiceReference<string> = reg.getReference();

    sr.getService(bundle1, ref, true);
    sr.getService(bundle1, ref, true);

    const uc = (sr as ServiceRegistryImpl).getInUseMap(bundle1);

    expect(uc.length).toEqual(1);
    expect(uc[0].getServiceObjectsCount()).toEqual(2);

    sr.unregisterService(bundle1, reg);

    expect(uc.length).toEqual(0);
  });
});
