import { SemVer } from 'semver';
import { Bundle, BundleContext, Logger, SERVICE_PID, ServiceProperties } from '@pandino/pandino-api';
import { Configuration, ManagedService } from '@pandino/pandino-configuration-management-api';
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

    testConfiguration(configuration, true, 'test.pid', undefined, undefined);
  });

  it('location with initial value', () => {
    const configuration: Configuration = configAdmin.getConfiguration('test.pid', bundle.getLocation());

    testConfiguration(configuration, true, 'test.pid', bundle.getLocation(), undefined);
  });

  it('location updates at first registration after initially missing', () => {
    const configuration: Configuration = configAdmin.getConfiguration('test.pid');
    const mockUpdated = jest.fn();
    const service: ManagedService = {
      updated: mockUpdated,
    };

    // configuration didn't register a location
    testConfiguration(configuration, true, 'test.pid', undefined, undefined);

    context.registerService('@pandino/pandino-configuration-management-api/ManagedService', service, {
      [SERVICE_PID]: 'test.pid',
    });

    // CM uses first registering service's location if location was missing
    testConfiguration(configuration, true, 'test.pid', bundle.getLocation(), undefined);

    configuration.update({
      prop1: true,
    });

    // location stays the same
    testConfiguration(configuration, true, 'test.pid', bundle.getLocation(), {
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

    testUpdateCalls(mockUpdated, 2, [undefined, undefined]);

    // If a ManagedService is registered first, and configuration comes after, the created Configuration object gets
    // the Bundle's location which hosts the Service.
    testConfiguration(configuration, true, 'test.pid', bundle.getLocation(), undefined);
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

    testUpdateCalls(mockUpdated, 1, [undefined]);
    testConfiguration(configuration, true, 'test.pid', bundle.getLocation(), undefined);
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

    testUpdateCalls(mockUpdated, 2, [
      undefined,
      {
        prop1: true,
        prop2: 'test',
      },
    ]);

    testConfiguration(configuration, true, 'test.pid', bundle.getLocation(), {
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

    testUpdateCalls(mockUpdated1, 2, [
      undefined,
      {
        prop1: true,
        prop2: 'test',
      },
    ]);
    testUpdateCalls(mockUpdated2, 2, [
      undefined,
      {
        prop1: true,
        prop2: 'test',
      },
    ]);
    testConfiguration(configuration, true, 'test.pid', bundle.getLocation(), {
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

    testUpdateCalls(mockUpdated, 3, [
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

  function testUpdateCalls(mockUpdated: any, callTimes: number, callbackParams: any[]): void {
    expect(mockUpdated).toHaveBeenCalledTimes(callTimes);
    expect(callbackParams.length).toEqual(callTimes);

    for (let idxParam = 0; idxParam < callbackParams.length; idxParam++) {
      expect(mockUpdated.mock.calls[idxParam][0]).toEqual(callbackParams[idxParam]);
    }
  }

  function testConfiguration(
    configuration: Configuration,
    defined: boolean,
    pid?: string,
    location?: string,
    properties?: ServiceProperties,
  ): void {
    if (defined) {
      expect(configuration).toBeDefined();
      expect(configuration.getPid()).toEqual(pid);
      expect(configuration.getBundleLocation()).toEqual(location);
      expect(configuration.getProperties()).toEqual(properties);
    } else {
      expect(configuration).not.toBeDefined();
    }
  }
});
