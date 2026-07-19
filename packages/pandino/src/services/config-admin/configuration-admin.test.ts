import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OSGiFramework } from '../../framework/framework';
import { ConfigurationAdminImpl } from './configuration-admin';
import type { Configuration, ManagedService } from './interfaces';

describe('ConfigurationAdmin', () => {
  let framework: OSGiFramework;
  let configAdmin: ConfigurationAdminImpl;

  beforeEach(async () => {
    framework = new OSGiFramework();
    await framework.start();
    configAdmin = new ConfigurationAdminImpl(framework);
  });

  describe('getConfiguration', () => {
    it('should create new configuration', async () => {
      const config = await configAdmin.getConfiguration('test.pid');

      expect(config).toBeDefined();
      expect(config.getPid()).toBe('test.pid');
      expect(config.getFactoryPid()).toBeNull();
    });

    it('should return existing configuration', async () => {
      const config1 = await configAdmin.getConfiguration('test.pid');
      const config2 = await configAdmin.getConfiguration('test.pid');

      expect(config1).toBe(config2);
    });

    it('should create configuration with location', async () => {
      const config = await configAdmin.getConfiguration('test.pid', 'test://location');

      expect(config.getBundleLocation()).toBe('test://location');
    });

    it('should create configuration with location parameter', async () => {
      const location = 'bundle://custom-location';
      const config = await configAdmin.getConfiguration('test.with.location', location);

      expect(config).toBeDefined();
      expect(config.getPid()).toBe('test.with.location');
      expect(config.getBundleLocation()).toBe(location);
      expect(config.getFactoryPid()).toBeNull();
    });

    it('should return same configuration when called with same PID and location', async () => {
      const location = 'bundle://same-location';
      const config1 = await configAdmin.getConfiguration('test.same.pid', location);
      const config2 = await configAdmin.getConfiguration('test.same.pid', location);

      expect(config1).toBe(config2);
      expect(config1.getBundleLocation()).toBe(location);
    });
  });

  describe('createFactoryConfiguration', () => {
    it('should create factory configuration', async () => {
      const config = await configAdmin.createFactoryConfiguration('factory.pid');

      expect(config).toBeDefined();
      expect(config.getFactoryPid()).toBe('factory.pid');
      expect(config.getPid()).toMatch(/^factory\.pid\.\d+$/);
    });

    it('should create unique factory configurations', async () => {
      const config1 = await configAdmin.createFactoryConfiguration('factory.pid');
      const config2 = await configAdmin.createFactoryConfiguration('factory.pid');

      expect(config1.getPid()).not.toBe(config2.getPid());
      expect(config1.getFactoryPid()).toBe(config2.getFactoryPid());
    });

    it('should create factory configuration with location parameter', async () => {
      const location = 'bundle://factory-location';
      const config = await configAdmin.createFactoryConfiguration('factory.with.location', location);

      expect(config).toBeDefined();
      expect(config.getFactoryPid()).toBe('factory.with.location');
      expect(config.getPid()).toMatch(/^factory\.with\.location\.\d+$/);
      expect(config.getBundleLocation()).toBe(location);
    });

    it('should create unique factory configurations with different locations', async () => {
      const location1 = 'bundle://location1';
      const location2 = 'bundle://location2';

      const config1 = await configAdmin.createFactoryConfiguration('factory.pid', location1);
      const config2 = await configAdmin.createFactoryConfiguration('factory.pid', location2);

      expect(config1.getPid()).not.toBe(config2.getPid());
      expect(config1.getFactoryPid()).toBe(config2.getFactoryPid());
      expect(config1.getBundleLocation()).toBe(location1);
      expect(config2.getBundleLocation()).toBe(location2);
    });

    it('should create multiple factory configurations with same location', async () => {
      const location = 'bundle://shared-location';

      const config1 = await configAdmin.createFactoryConfiguration('shared.factory', location);
      const config2 = await configAdmin.createFactoryConfiguration('shared.factory', location);

      expect(config1.getPid()).not.toBe(config2.getPid());
      expect(config1.getFactoryPid()).toBe(config2.getFactoryPid());
      expect(config1.getBundleLocation()).toBe(location);
      expect(config2.getBundleLocation()).toBe(location);
    });
  });

  describe('listConfigurations', () => {
    it('should return null when no configurations exist', async () => {
      const configs = await configAdmin.listConfigurations();
      expect(configs).toBeNull();
    });

    it('should list all configurations when no filter provided', async () => {
      await configAdmin.getConfiguration('test.pid1');
      await configAdmin.getConfiguration('test.pid2');

      const configs = await configAdmin.listConfigurations();
      expect(configs).toHaveLength(2);
    });

    it('should filter configurations by LDAP filter', async () => {
      const config1 = await configAdmin.getConfiguration('test.pid1');
      const config2 = await configAdmin.getConfiguration('test.pid2');

      await config1.update({ type: 'test' });
      await config2.update({ type: 'production' });

      const configs = await configAdmin.listConfigurations('(type=test)');
      expect(configs).toHaveLength(1);
      expect(configs![0].getPid()).toBe('test.pid1');
    });
  });

  describe('configuration delivery', () => {
    it('should deliver configuration to ManagedService', async () => {
      const managedService: ManagedService = {
        updated: vi.fn(),
      };

      const systemBundle = framework.getBundle(0);
      const context = systemBundle!.getContext()!;

      context.registerService('ManagedService', managedService, { 'service.pid': 'test.pid' });

      const config = await configAdmin.getConfiguration('test.pid');
      await config.update({ key: 'value' });

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(managedService.updated).toHaveBeenCalledWith(expect.objectContaining({ key: 'value' }));
    });

    it('should inject service.pid into delivered ManagedService properties', async () => {
      const managedService: ManagedService = {
        updated: vi.fn(),
      };

      const systemBundle = framework.getBundle(0);
      const context = systemBundle!.getContext()!;

      context.registerService('ManagedService', managedService, { 'service.pid': 'pid.auto' });

      const config = await configAdmin.getConfiguration('pid.auto');
      await config.update({ key: 'value' });

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(managedService.updated).toHaveBeenCalledWith(
        expect.objectContaining({ 'service.pid': 'pid.auto', key: 'value' }),
      );
    });

    it('should inject service.pid and service.factoryPid into delivered factory properties', async () => {
      const factory = {
        getName: () => 'factory',
        updated: vi.fn(),
        deleted: vi.fn(),
      };

      const systemBundle = framework.getBundle(0);
      const context = systemBundle!.getContext()!;

      context.registerService('ManagedServiceFactory', factory, { 'service.pid': 'the.factory' });

      const config = await configAdmin.createFactoryConfiguration('the.factory');
      await config.update({ key: 'value' });

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(factory.updated).toHaveBeenCalledWith(
        config.getPid(),
        expect.objectContaining({ 'service.pid': config.getPid(), 'service.factoryPid': 'the.factory', key: 'value' }),
      );
    });

    it('should not deliver to service with different PID', async () => {
      const managedService: ManagedService = {
        updated: vi.fn(),
      };

      const systemBundle = framework.getBundle(0);
      const context = systemBundle!.getContext()!;

      context.registerService('ManagedService', managedService, { 'service.pid': 'different.pid' });

      const config = await configAdmin.getConfiguration('test.pid');
      await config.update({ key: 'value' });

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(managedService.updated).not.toHaveBeenCalled();
    });

    it('should only deliver configuration to service with matching bundle location', async () => {
      const correctLocationService: ManagedService = {
        updated: vi.fn(),
      };
      const wrongLocationService: ManagedService = {
        updated: vi.fn(),
      };

      const systemBundle = framework.getBundle(0);
      const context = systemBundle!.getContext()!;

      // Register services from different "bundle locations"
      context.registerService('ManagedService', correctLocationService, {
        'service.pid': 'location.test',
        'bundle.location': 'bundle://correct-location',
      });

      context.registerService('ManagedService', wrongLocationService, {
        'service.pid': 'location.test',
        'bundle.location': 'bundle://wrong-location',
      });

      // Create configuration with specific bundle location
      const config = await configAdmin.getConfiguration('location.test', 'bundle://correct-location');
      await config.update({ restricted: 'data' });

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Only the service from the correct location should receive the config
      expect(correctLocationService.updated).toHaveBeenCalledWith(expect.objectContaining({ restricted: 'data' }));
      expect(wrongLocationService.updated).not.toHaveBeenCalled();
    });

    it('should only deliver factory configuration to service with matching bundle location', async () => {
      const correctLocationService: ManagedService = {
        updated: vi.fn(),
      };
      const wrongLocationService: ManagedService = {
        updated: vi.fn(),
      };

      const systemBundle = framework.getBundle(0);
      const context = systemBundle!.getContext()!;

      // Register factory services from different "bundle locations"
      context.registerService('ManagedService', correctLocationService, {
        'service.factoryPid': 'factory.location.test',
        'bundle.location': 'bundle://factory-location',
      });

      context.registerService('ManagedService', wrongLocationService, {
        'service.factoryPid': 'factory.location.test',
        'bundle.location': 'bundle://different-factory-location',
      });

      // Create factory configuration with specific bundle location
      const config = await configAdmin.createFactoryConfiguration('factory.location.test', 'bundle://factory-location');
      await config.update({ factoryData: 'secure' });

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Only the service from the correct location should receive the config
      expect(correctLocationService.updated).toHaveBeenCalledWith(expect.objectContaining({ factoryData: 'secure' }));
      expect(wrongLocationService.updated).not.toHaveBeenCalled();
    });
  });
});

describe('Configuration', () => {
  let framework: OSGiFramework;
  let configAdmin: ConfigurationAdminImpl;
  let config: Configuration;

  beforeEach(async () => {
    framework = new OSGiFramework();
    await framework.start();
    configAdmin = new ConfigurationAdminImpl(framework);
    config = await configAdmin.getConfiguration('test.pid');
  });

  describe('properties management', () => {
    it('should start with null properties', () => {
      expect(config.getProperties()).toBeNull();
    });

    it('should update properties', async () => {
      const props = { key1: 'value1', key2: 42 };
      await config.update(props);

      const retrieved = config.getProperties();
      expect(retrieved).toEqual(props);
      expect(retrieved).not.toBe(props); // Should be a copy
    });

    it('should delete configuration', async () => {
      await config.update({ key: 'value' });
      await config.delete();

      expect(config.getProperties()).toBeNull();
    });
  });

  describe('bundle location', () => {
    it('should manage bundle location', async () => {
      expect(config.getBundleLocation()).toBeNull();

      await config.setBundleLocation('test://location');
      expect(config.getBundleLocation()).toBe('test://location');

      await config.setBundleLocation(null);
      expect(config.getBundleLocation()).toBeNull();
    });
  });
});
