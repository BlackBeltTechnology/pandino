import { SemVer } from 'semver';
import { Bundle, BundleContext, Logger, SERVICE_PID, ServiceProperties, ServiceReference } from '@pandino/pandino-api';
import {
  Configuration,
  ConfigurationEvent,
  ConfigurationEventType,
  ConfigurationListener,
  ManagedService,
} from '@pandino/pandino-configuration-management-api';
import { MockBundleContext } from './__mocks__/mock-bundle-context';
import { MockBundle } from './__mocks__/mock-bundle';
import { ConfigurationAdminImpl } from './configuration-admin-impl';
import { ConfigurationManager } from './configuration-manager';

describe('ConfigurationImpl', () => {
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
    cm = new ConfigurationManager(context, logger, mockFilterParser);
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

    // configuration didn't register a location
    testConfiguration(configuration, 'test.pid', undefined, undefined);

    context.registerService('@pandino/pandino-configuration-management-api/ManagedService', service, {
      [SERVICE_PID]: 'test.pid',
    });

    // CM uses first registering service's location if location was missing
    testConfiguration(configuration, 'test.pid', bundle.getLocation(), undefined);

    configuration.update({
      prop1: true,
    });

    // location stays the same
    testConfiguration(configuration, 'test.pid', bundle.getLocation(), {
      prop1: true,
    });
  });

  it('equals check', () => {
    const configuration: Configuration = configAdmin.getConfiguration('test.pid');
    const configuration2: Configuration = configAdmin.getConfiguration('test.pid.two');
    const configuration3: Configuration = configAdmin.getConfiguration('test.pid');
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
    context.registerService('@pandino/pandino-configuration-management-api/ManagedService', service, {
      [SERVICE_PID]: 'test.pid',
    });

    const configuration: Configuration = configAdmin.getConfiguration('test.pid');

    testUpdateCalls(mockUpdated, [undefined, undefined]);

    // If a ManagedService is registered first, and configuration comes after, the created Configuration object gets
    // the Bundle's location which hosts the Service.
    testConfiguration(configuration, 'test.pid', bundle.getLocation(), undefined);
  });

  it('configuration and registration after', () => {
    const configuration: Configuration = configAdmin.getConfiguration('test.pid');
    const mockUpdated = jest.fn();
    const service: ManagedService = {
      updated: mockUpdated,
    };
    context.registerService('@pandino/pandino-configuration-management-api/ManagedService', service, {
      [SERVICE_PID]: 'test.pid',
    });

    testUpdateCalls(mockUpdated, [undefined]);
    testConfiguration(configuration, 'test.pid', bundle.getLocation(), undefined);
  });

  it('configuration and registration after and update after that', () => {
    const configuration: Configuration = configAdmin.getConfiguration('test.pid');
    const mockUpdated = jest.fn();
    const service: ManagedService = {
      updated: mockUpdated,
    };
    const registration = context.registerService(
      '@pandino/pandino-configuration-management-api/ManagedService',
      service,
      {
        [SERVICE_PID]: 'test.pid',
      },
    );

    configuration.update({
      prop1: true,
      prop2: 'test',
    });

    testUpdateCalls(mockUpdated, [
      undefined,
      {
        prop1: true,
        prop2: 'test',
      },
    ]);

    testConfiguration(configuration, 'test.pid', bundle.getLocation(), {
      prop1: true,
      prop2: 'test',
    });

    expect(registration.getProperties()).toEqual({
      [SERVICE_PID]: 'test.pid',
    });
  });

  it('multiple services register for the same PID', () => {
    const configuration: Configuration = configAdmin.getConfiguration('test.pid');
    const mockUpdated1 = jest.fn();
    const mockUpdated2 = jest.fn();
    const service1: ManagedService = {
      updated: mockUpdated1,
    };
    const service2: ManagedService = {
      updated: mockUpdated2,
    };
    const registration1 = context.registerService(
      '@pandino/pandino-configuration-management-api/ManagedService',
      service1,
      {
        [SERVICE_PID]: 'test.pid',
        name: 'service1',
      },
    );
    const registration2 = context.registerService(
      '@pandino/pandino-configuration-management-api/ManagedService',
      service2,
      {
        [SERVICE_PID]: 'test.pid',
        name: 'service2',
      },
    );

    configuration.update({
      prop1: true,
      prop2: 'test',
    });

    testUpdateCalls(mockUpdated1, [
      undefined,
      {
        prop1: true,
        prop2: 'test',
      },
    ]);
    testUpdateCalls(mockUpdated2, [
      undefined,
      {
        prop1: true,
        prop2: 'test',
      },
    ]);
    testConfiguration(configuration, 'test.pid', bundle.getLocation(), {
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
    context.registerService('@pandino/pandino-configuration-management-api/ManagedService', service, {
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
    context.registerService<ConfigurationListener>(
      '@pandino/pandino-configuration-management-api/ConfigurationListener',
      listener,
      {
        [SERVICE_PID]: 'test.pid',
      },
    );

    const configuration: Configuration = configAdmin.getConfiguration('test.pid');

    testConfigurationEvent(mockConfigurationEvent, 0);

    const service: ManagedService = {
      updated: jest.fn(),
    };
    const registration = context.registerService(
      '@pandino/pandino-configuration-management-api/ManagedService',
      service,
      {
        [SERVICE_PID]: 'test.pid',
      },
    );
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
