import { describe, beforeEach, expect, it, vi, afterEach } from 'vitest';
import {
  Bundle,
  BUNDLE_ACTIVATOR,
  BUNDLE_SYMBOLICNAME,
  BUNDLE_VERSION,
  BundleContext,
  type BundleImporter,
  BundleManifestHeaders,
  FrameworkConfigMap,
  LOG_LEVEL_PROP,
  LogLevel,
  PANDINO_BUNDLE_IMPORTER_PROP,
  PANDINO_MANIFEST_FETCHER_PROP,
  PROVIDE_CAPABILITY,
  REQUIRE_CAPABILITY,
  ServiceProperties,
  ServiceReference,
} from '@pandino/pandino-api';
import { SERVICE_PID } from '@pandino/pandino-api';
import {
  CONFIG_ADMIN_INTERFACE_KEY,
  CONFIGURATION_LISTENER_INTERFACE_KEY,
  ConfigurationAdmin,
  MANAGED_SERVICE_INTERFACE_KEY,
} from '@pandino/configuration-management-api';
import PMActivator from '@pandino/persistence-manager-memory';
import type { Configuration, ConfigurationEvent, ConfigurationEventType, ConfigurationListener, ManagedService } from '@pandino/configuration-management-api';
import Pandino from '@pandino/pandino';
import { ConfigurationAdminImpl } from './configuration-admin-impl';
import { Activator as CMActivator } from './activator';

describe('ConfigurationImpl', () => {
  let params: FrameworkConfigMap;
  let bundle: Bundle;
  let pandino: Pandino;
  let pandinoContext: BundleContext;
  const pmHeaders: () => BundleManifestHeaders = () => ({
    [BUNDLE_SYMBOLICNAME]: '@pandino/persistence-manager-memory',
    [BUNDLE_VERSION]: '0.0.0',
    [BUNDLE_ACTIVATOR]: new PMActivator(),
    [PROVIDE_CAPABILITY]: '@pandino/persistence-manager;type="in-memory";objectClass="@pandino/persistence-manager/PersistenceManager"',
  });
  const cmHeaders: () => BundleManifestHeaders = () => ({
    [BUNDLE_SYMBOLICNAME]: '@pandino/configuration-management',
    [BUNDLE_VERSION]: '0.0.0',
    [BUNDLE_ACTIVATOR]: new CMActivator(),
    [REQUIRE_CAPABILITY]: '@pandino/persistence-manager;filter:=(objectClass=@pandino/persistence-manager/PersistenceManager)',
    [PROVIDE_CAPABILITY]:
      '@pandino/configuration-management;objectClass:Array="@pandino/configuration-management/ConfigurationAdmin,@pandino/configuration-management/ManagedService,@pandino/configuration-management/ConfigurationListener"',
  });
  const importer: BundleImporter = {
    import: (activatorLocation: string, manifestLocation: string, deploymentRoot?: string) => {
      // this won't be called if the activator is an instance and not a string
      return Promise.resolve({
        default: null as unknown as any,
      });
    },
  };
  let configAdmin: ConfigurationAdminImpl;

  beforeEach(async () => {
    params = {
      [PANDINO_MANIFEST_FETCHER_PROP]: vi.fn() as any,
      [PANDINO_BUNDLE_IMPORTER_PROP]: importer,
      [LOG_LEVEL_PROP]: LogLevel.WARN,
    };
    pandino = new Pandino(params);

    await pandino.init();
    await pandino.start();

    pandinoContext = pandino.getBundleContext();
    const [pmb, cmb] = await installDepBundles(pandinoContext);
    bundle = pandino;
    const ref = pandinoContext.getServiceReference<ConfigurationAdmin>(CONFIG_ADMIN_INTERFACE_KEY)!;
    configAdmin = pandinoContext.getService(ref) as ConfigurationAdminImpl;
  });

  afterEach(() => {
    pandino.stop();
    pandino = undefined;
    pandinoContext = undefined;
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
    const mockUpdated = vi.fn();
    const service: ManagedService = {
      updated: mockUpdated,
    };
    configuration.update();

    // configuration didn't register a location
    testConfiguration(configuration, 'test.pid', undefined, undefined);

    pandinoContext.registerService(MANAGED_SERVICE_INTERFACE_KEY, service, {
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
    const mockUpdated = vi.fn();
    const service: ManagedService = {
      updated: mockUpdated,
    };
    pandinoContext.registerService(MANAGED_SERVICE_INTERFACE_KEY, service, {
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
    const mockUpdated = vi.fn();
    const service: ManagedService = {
      updated: mockUpdated,
    };
    configuration.update();
    pandinoContext.registerService(MANAGED_SERVICE_INTERFACE_KEY, service, {
      [SERVICE_PID]: 'test.pid',
    });

    testUpdateCalls(mockUpdated, [undefined]);
    testConfiguration(configuration, 'test.pid', bundle.getLocation(), undefined);
  });

  it('configuration and registration after and update after that', () => {
    const configuration: Configuration = configAdmin.getConfiguration('test.pid');
    configuration.update();
    const mockUpdated = vi.fn();
    const service: ManagedService = {
      updated: mockUpdated,
    };
    const registration = pandinoContext.registerService(MANAGED_SERVICE_INTERFACE_KEY, service, {
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

    expect(registration.getProperties()).toContain({
      [SERVICE_PID]: 'test.pid',
    });
  });

  it('multiple services register for the same PID', () => {
    const configuration: Configuration = configAdmin.getConfiguration('test.pid');
    configuration.update();
    const mockUpdated1 = vi.fn();
    const mockUpdated2 = vi.fn();
    const service1: ManagedService = {
      updated: mockUpdated1,
    };
    const service2: ManagedService = {
      updated: mockUpdated2,
    };
    const registration1 = pandinoContext.registerService(MANAGED_SERVICE_INTERFACE_KEY, service1, {
      [SERVICE_PID]: 'test.pid',
      name: 'service1',
    });
    const registration2 = pandinoContext.registerService(MANAGED_SERVICE_INTERFACE_KEY, service2, {
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

    expect(registration1.getProperties()).toContain({
      name: 'service1',
      [SERVICE_PID]: 'test.pid',
    });
    expect(registration2.getProperties()).toContain({
      name: 'service2',
      [SERVICE_PID]: 'test.pid',
    });
  });

  it('delete configuration', () => {
    const configuration: Configuration = configAdmin.getConfiguration('test.pid');
    const mockUpdated = vi.fn();
    const service: ManagedService = {
      updated: mockUpdated,
    };
    pandinoContext.registerService(MANAGED_SERVICE_INTERFACE_KEY, service, {
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
    const mockUpdatedEvent = vi.fn();
    const mockConfigurationEvent = vi.fn();
    const service: ManagedService & ConfigurationListener = {
      updated: mockUpdatedEvent,
      configurationEvent: mockConfigurationEvent,
    };
    const registration = pandinoContext.registerService([MANAGED_SERVICE_INTERFACE_KEY, CONFIGURATION_LISTENER_INTERFACE_KEY], service, {
      [SERVICE_PID]: 'test.pid',
    });

    const configuration: Configuration = configAdmin.getConfiguration('test.pid');

    testConfigurationEvent(mockConfigurationEvent, 0);

    expect(registration.getReference().hasObjectClass(MANAGED_SERVICE_INTERFACE_KEY)).toBe(true);
    expect(registration.getReference().hasObjectClass(CONFIGURATION_LISTENER_INTERFACE_KEY)).toBe(true);

    // const managedReference = pandinoContext.getServiceReference(MANAGED_SERVICE_INTERFACE_KEY);
    // const listenerReference = pandinoContext.getServiceReference(CONFIGURATION_LISTENER_INTERFACE_KEY);

    expect(service.updated).toHaveBeenCalledTimes(1);
    expect(service.configurationEvent).toHaveBeenCalledTimes(0);
    testConfigurationEvent(mockConfigurationEvent, 0, 'UPDATED', registration.getReference());

    configuration.update({
      prop1: true,
      prop2: 'test',
    });

    expect(service.updated).toHaveBeenCalledTimes(2);
    testConfigurationEvent(mockConfigurationEvent, 1, 'UPDATED', registration.getReference());

    configuration.delete();

    testConfigurationEvent(mockConfigurationEvent, 2, 'DELETED', registration.getReference());
  });

  it('targetpid matching use-case based on bundle symbolic name', () => {
    const configuration: Configuration = configAdmin.getConfiguration(`test.pid|${bundle.getSymbolicName()}`);
    const mockUpdated = vi.fn();
    const service: ManagedService = {
      updated: mockUpdated,
    };
    const registration = pandinoContext.registerService(MANAGED_SERVICE_INTERFACE_KEY, service, {
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

    expect(registration.getProperties()).toContain({
      [SERVICE_PID]: 'test.pid',
    });
  });

  it('targetpid not matching use-case based on bundle symbolic name', () => {
    const configuration: Configuration = configAdmin.getConfiguration('test.pid|@scope/some-other-package');
    const mockUpdated = vi.fn();
    const service: ManagedService = {
      updated: mockUpdated,
    };
    const registration = pandinoContext.registerService(MANAGED_SERVICE_INTERFACE_KEY, service, {
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

    expect(registration.getProperties()).toContain({
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

  function testConfiguration(configuration: Configuration, pid: string, location?: string, properties?: ServiceProperties): void {
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

  async function installDepBundles(ctx: BundleContext): Promise<Bundle[]> {
    const pmb = await ctx.installBundle(pmHeaders());
    const cmb = await ctx.installBundle(cmHeaders());
    return [pmb, cmb];
  }
});
