import { SemVer } from 'semver';
import {
  Bundle,
  BundleContext,
  Logger,
  SemverFactory,
  SERVICE_PID,
  ServiceProperties,
  ServiceReference,
} from '@pandino/pandino-api';
import {
  Configuration,
  ConfigurationEvent,
  ConfigurationEventType,
  ConfigurationListener,
  ManagedService,
  CONFIGURATION_LISTENER_INTERFACE_KEY,
  MANAGED_SERVICE_INTERFACE_KEY,
} from '@pandino/pandino-configuration-management-api';
import { MockBundleContext } from './__mocks__/mock-bundle-context';
import { MockBundle } from './__mocks__/mock-bundle';
import { MockPersistenceManager } from './__mocks__/mock-persistence-manager';
import { ConfigurationAdminImpl } from './configuration-admin-impl';
import { ConfigurationManager } from './configuration-manager';

describe('ConfigurationImpl', () => {
  const semverFactory: SemverFactory = (version) => new SemVer(version);
  let context: BundleContext;
  let bundle: Bundle;
  let configAdmin: ConfigurationAdminImpl;
  let cm: ConfigurationManager;
  let mockFilterParser = jest.fn();
  let mockDebug = jest.fn();
  let logger: Logger = {
    debug: mockDebug,
  } as unknown as Logger;

  beforeEach(() => {
    mockDebug.mockClear();
    context = new MockBundleContext();
    bundle = new MockBundle(
      context as MockBundleContext,
      'test.bundle.location',
      '@test/my-bundle',
      new SemVer('0.0.0'),
    );
    cm = new ConfigurationManager(context, logger, mockFilterParser, new MockPersistenceManager('{}'), semverFactory);
    context.addServiceListener(cm);
    configAdmin = new ConfigurationAdminImpl(cm, bundle, logger);
  });

  it('basic creation of configuration', () => {
    const configuration: Configuration = configAdmin.getConfiguration('test.pid');

    testConfiguration(configuration, 'test.pid', undefined, undefined);
  });

  it('location with initial value', () => {
    const configuration: Configuration = configAdmin.getConfiguration('test.pid', bundle.getLocation());

    testConfiguration(configuration, 'test.pid', bundle.getLocation(), undefined);
  });

  it('location updates at first registration after initially missing', () => {
    const configuration: Configuration = configAdmin.getConfiguration('test.pid');
    const mockUpdated = jest.fn();
    const service: ManagedService = {
      updated: mockUpdated,
    };
    configuration.update();

    // configuration didn't register a location
    testConfiguration(configuration, 'test.pid', undefined, undefined);

    context.registerService(MANAGED_SERVICE_INTERFACE_KEY, service, {
      [SERVICE_PID]: 'test.pid',
    });

    // CM uses first registering service's location if location was missing
    testConfiguration(configuration, 'test.pid', bundle.getLocation(), undefined);

    configuration.update({
      prop1: true,
    });

    // location stays the same
    testConfiguration(configuration, 'test.pid', bundle.getLocation(), {
      [SERVICE_PID]: 'test.pid',
      prop1: true,
    });
  });

  it('equals check', () => {
    const configuration: Configuration = configAdmin.getConfiguration('test.pid');
    const configuration2: Configuration = configAdmin.getConfiguration('test.pid.two');
    const configuration3: Configuration = configAdmin.getConfiguration('test.pid');
    configuration.update({});
    configuration2.update({});
    configuration3.update({});
    const configs = configAdmin.listConfigurations();

    expect(configs.length).toEqual(2);
    expect(configuration).toEqual(configuration3);
    expect(configuration.equals(configuration2)).toEqual(false);
    expect(configuration.equals(configuration3)).toEqual(true);
    expect(configuration2.equals(configuration3)).toEqual(false);
  });

  it('registration and configuration after', () => {
    const mockUpdated = jest.fn();
    const service: ManagedService = {
      updated: mockUpdated,
    };
    context.registerService(MANAGED_SERVICE_INTERFACE_KEY, service, {
      [SERVICE_PID]: 'test.pid',
    });

    const configuration: Configuration = configAdmin.getConfiguration('test.pid');
    configuration.update({});

    testUpdateCalls(mockUpdated, [
      undefined,
      {
        [SERVICE_PID]: 'test.pid',
      },
    ]);

    // If a ManagedService is registered first, and configuration comes after, the created Configuration object gets
    // the Bundle's location which hosts the Service.
    testConfiguration(configuration, 'test.pid', bundle.getLocation(), {
      [SERVICE_PID]: 'test.pid',
    });
  });

  it('configuration and registration after', () => {
    const configuration: Configuration = configAdmin.getConfiguration('test.pid');
    const mockUpdated = jest.fn();
    const service: ManagedService = {
      updated: mockUpdated,
    };
    configuration.update();
    context.registerService(MANAGED_SERVICE_INTERFACE_KEY, service, {
      [SERVICE_PID]: 'test.pid',
    });

    testUpdateCalls(mockUpdated, [undefined]);
    testConfiguration(configuration, 'test.pid', bundle.getLocation(), undefined);
  });

  it('configuration and registration after and update after that', () => {
    const configuration: Configuration = configAdmin.getConfiguration('test.pid');
    configuration.update();
    const mockUpdated = jest.fn();
    const service: ManagedService = {
      updated: mockUpdated,
    };
    const registration = context.registerService(MANAGED_SERVICE_INTERFACE_KEY, service, {
      [SERVICE_PID]: 'test.pid',
    });

    configuration.update({
      prop1: true,
      prop2: 'test',
    });

    testUpdateCalls(mockUpdated, [
      undefined,
      {
        [SERVICE_PID]: 'test.pid',
        prop1: true,
        prop2: 'test',
      },
    ]);

    testConfiguration(configuration, 'test.pid', bundle.getLocation(), {
      [SERVICE_PID]: 'test.pid',
      prop1: true,
      prop2: 'test',
    });

    expect(registration.getProperties()).toEqual({
      [SERVICE_PID]: 'test.pid',
    });
  });

  it('multiple services register for the same PID', () => {
    const configuration: Configuration = configAdmin.getConfiguration('test.pid');
    configuration.update();
    const mockUpdated1 = jest.fn();
    const mockUpdated2 = jest.fn();
    const service1: ManagedService = {
      updated: mockUpdated1,
    };
    const service2: ManagedService = {
      updated: mockUpdated2,
    };
    const registration1 = context.registerService(MANAGED_SERVICE_INTERFACE_KEY, service1, {
      [SERVICE_PID]: 'test.pid',
      name: 'service1',
    });
    const registration2 = context.registerService(MANAGED_SERVICE_INTERFACE_KEY, service2, {
      [SERVICE_PID]: 'test.pid',
      name: 'service2',
    });

    configuration.update({
      prop1: true,
      prop2: 'test',
    });

    testUpdateCalls(mockUpdated1, [
      undefined,
      {
        [SERVICE_PID]: 'test.pid',
        prop1: true,
        prop2: 'test',
      },
    ]);
    testUpdateCalls(mockUpdated2, [
      undefined,
      {
        [SERVICE_PID]: 'test.pid',
        prop1: true,
        prop2: 'test',
      },
    ]);
    testConfiguration(configuration, 'test.pid', bundle.getLocation(), {
      [SERVICE_PID]: 'test.pid',
      prop1: true,
      prop2: 'test',
    });

    expect(registration1.getProperties()).toEqual({
      name: 'service1',
      [SERVICE_PID]: 'test.pid',
    });
    expect(registration2.getProperties()).toEqual({
      name: 'service2',
      [SERVICE_PID]: 'test.pid',
    });
  });

  it('delete configuration', () => {
    const configuration: Configuration = configAdmin.getConfiguration('test.pid');
    const mockUpdated = jest.fn();
    const service: ManagedService = {
      updated: mockUpdated,
    };
    context.registerService(MANAGED_SERVICE_INTERFACE_KEY, service, {
      [SERVICE_PID]: 'test.pid',
    });

    configuration.update({
      prop1: true,
      prop2: 'test',
    });

    configuration.delete();

    testUpdateCalls(mockUpdated, [
      undefined,
      {
        [SERVICE_PID]: 'test.pid',
        prop1: true,
        prop2: 'test',
      },
      undefined,
    ]);
    expect(() => configuration.getProperties()).toThrow();
    expect(() => configuration.update()).toThrow();
    expect(() => configuration.setBundleLocation()).toThrow();
  });

  it('events', () => {
    const mockConfigurationEvent = jest.fn();
    const listener: ConfigurationListener = {
      configurationEvent: mockConfigurationEvent,
    };
    context.registerService<ConfigurationListener>(CONFIGURATION_LISTENER_INTERFACE_KEY, listener, {
      [SERVICE_PID]: 'test.pid',
    });

    const configuration: Configuration = configAdmin.getConfiguration('test.pid');

    testConfigurationEvent(mockConfigurationEvent, 0);

    const service: ManagedService = {
      updated: jest.fn(),
    };
    const registration = context.registerService(MANAGED_SERVICE_INTERFACE_KEY, service, {
      [SERVICE_PID]: 'test.pid',
    });
    const reference = registration.getReference();

    testConfigurationEvent(mockConfigurationEvent, 1, 'UPDATED', reference);

    configuration.update({
      prop1: true,
      prop2: 'test',
    });

    testConfigurationEvent(mockConfigurationEvent, 2, 'UPDATED', reference);

    configuration.delete();

    testConfigurationEvent(mockConfigurationEvent, 3, 'DELETED', reference);
  });

  it('targetpid matching use-case based on bundle symbolic name', () => {
    const configuration: Configuration = configAdmin.getConfiguration(`test.pid|${bundle.getSymbolicName()}`);
    const mockUpdated = jest.fn();
    const service: ManagedService = {
      updated: mockUpdated,
    };
    const registration = context.registerService(MANAGED_SERVICE_INTERFACE_KEY, service, {
      [SERVICE_PID]: 'test.pid',
    });

    configuration.update({
      prop1: true,
      prop2: 'test',
    });

    // even though the service's pid was "test.pid", the updated callback PID param has the value of the actual
    // configured PID value
    testUpdateCalls(mockUpdated, [
      undefined,
      {
        [SERVICE_PID]: `test.pid|${bundle.getSymbolicName()}`,
        prop1: true,
        prop2: 'test',
      },
    ]);

    testConfiguration(configuration, `test.pid|${bundle.getSymbolicName()}`, undefined, {
      [SERVICE_PID]: `test.pid|${bundle.getSymbolicName()}`,
      prop1: true,
      prop2: 'test',
    });

    expect(registration.getProperties()).toEqual({
      [SERVICE_PID]: 'test.pid',
    });
  });

  it('targetpid not matching use-case based on bundle symbolic name', () => {
    const configuration: Configuration = configAdmin.getConfiguration('test.pid|@scope/some-other-package');
    const mockUpdated = jest.fn();
    const service: ManagedService = {
      updated: mockUpdated,
    };
    const registration = context.registerService(MANAGED_SERVICE_INTERFACE_KEY, service, {
      [SERVICE_PID]: 'test.pid',
    });

    configuration.update({
      prop1: true,
      prop2: 'test',
    });

    // +1 update is not called since registered config PID's bundle symbolic name doesn't match the mocked BSN
    testUpdateCalls(mockUpdated, [undefined]);

    // even though the update() event is not triggered, the config it self gets updated
    testConfiguration(configuration, 'test.pid|@scope/some-other-package', undefined, {
      [SERVICE_PID]: 'test.pid|@scope/some-other-package',
      prop1: true,
      prop2: 'test',
    });

    expect(registration.getProperties()).toEqual({
      [SERVICE_PID]: 'test.pid',
    });
  });

  function testUpdateCalls(mockUpdated: any, callbackParams: any[]): void {
    expect(mockUpdated).toHaveBeenCalledTimes(callbackParams.length);
    expect(mockUpdated.mock.calls.length).toEqual(callbackParams.length);

    for (let idxParam = 0; idxParam < callbackParams.length; idxParam++) {
      expect(mockUpdated.mock.calls[idxParam][0]).toEqual(callbackParams[idxParam]);
    }
  }

  function testConfiguration(
    configuration: Configuration,
    pid: string,
    location?: string,
    properties?: ServiceProperties,
  ): void {
    expect(configuration).toBeDefined();
    expect(configuration.getPid()).toEqual(pid);
    expect(configuration.getBundleLocation()).toEqual(location);
    expect(configuration.getProperties()).toEqual(properties);
  }

  function testConfigurationEvent(
    mockConfigurationEvent: any,
    totalCalls: number,
    eventType?: ConfigurationEventType,
    reference?: ServiceReference<any>,
  ): void {
    expect(mockConfigurationEvent).toHaveBeenCalledTimes(totalCalls);

    if (totalCalls > 0) {
      const event: ConfigurationEvent = mockConfigurationEvent.mock.calls[totalCalls - 1][0];
      expect(event.getType()).toEqual(eventType);
      expect(event.getReference()).toEqual(reference);
    }
  }
});
