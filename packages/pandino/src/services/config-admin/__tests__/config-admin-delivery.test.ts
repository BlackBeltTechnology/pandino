import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OSGiFramework } from '../../../framework/framework';
import { ConfigurationAdminImpl } from '../configuration-admin';
import type { ManagedService, ManagedServiceFactory } from '../interfaces';

const flush = () => new Promise((resolve) => setTimeout(resolve, 10));

describe('ConfigurationAdmin delivery (group 7)', () => {
  let framework: OSGiFramework;
  let configAdmin: ConfigurationAdminImpl;

  beforeEach(async () => {
    framework = new OSGiFramework();
    await framework.start();
    configAdmin = new ConfigurationAdminImpl(framework);
  });

  describe('ManagedServiceFactory.deleted() on config delete', () => {
    it('should call factory.deleted(pid) when a factory configuration is deleted', async () => {
      const factory: ManagedServiceFactory = {
        getName: () => 'factory',
        updated: vi.fn(),
        deleted: vi.fn(),
      };

      const context = framework.getBundle(0)!.getContext()!;
      context.registerService('ManagedServiceFactory', factory, { 'service.pid': 'the.factory' });

      const config = await configAdmin.createFactoryConfiguration('the.factory');
      await config.update({ key: 'value' });
      await flush();

      expect(factory.updated).toHaveBeenCalledWith(config.getPid(), expect.objectContaining({ key: 'value' }));

      await config.delete();
      await flush();

      expect(factory.deleted).toHaveBeenCalledWith(config.getPid());
      // OSGi calls ManagedServiceFactory.deleted(pid) exactly once per delete.
      expect(factory.deleted).toHaveBeenCalledTimes(1);
    });
  });

  describe('null-before-first-update semantics', () => {
    it('should return null from getProperties() before any update', async () => {
      const config = await configAdmin.getConfiguration('never.updated.pid');

      expect(config.getProperties()).toBeNull();
    });

    it('should return null from a factory configuration before any update', async () => {
      const config = await configAdmin.createFactoryConfiguration('some.factory');

      expect(config.getProperties()).toBeNull();
    });
  });

  describe('late registration of ManagedService', () => {
    it('should deliver an existing configuration to a ManagedService registered after the update', async () => {
      const config = await configAdmin.getConfiguration('late.pid');
      await config.update({ key: 'value' });
      await flush();

      // Register the ManagedService AFTER the configuration already exists and was updated.
      const lateService: ManagedService = {
        updated: vi.fn(),
      };
      const context = framework.getBundle(0)!.getContext()!;
      context.registerService('ManagedService', lateService, { 'service.pid': 'late.pid' });
      await flush();

      // OSGi CM tracks ManagedService registrations and pushes the current config on register.
      expect(lateService.updated).toHaveBeenCalledWith(
        expect.objectContaining({ key: 'value', 'service.pid': 'late.pid' }),
      );
    });

    it('should deliver nothing to a late ManagedService when no configuration exists', async () => {
      const lateService: ManagedService = {
        updated: vi.fn(),
      };
      const context = framework.getBundle(0)!.getContext()!;
      context.registerService('ManagedService', lateService, { 'service.pid': 'no.config.pid' });
      await flush();

      expect(lateService.updated).not.toHaveBeenCalled();
    });
  });

  describe('property immutability', () => {
    it('should not reflect mutations of the object returned by getProperties()', async () => {
      const config = await configAdmin.getConfiguration('immutable.get.pid');
      await config.update({ key: 'value' });

      const first = config.getProperties()!;
      first.key = 'mutated';
      first.injected = 'extra';

      const second = config.getProperties()!;
      expect(second.key).toBe('value');
      expect(second.injected).toBeUndefined();
      // Each call returns a fresh copy.
      expect(second).not.toBe(first);
    });

    it('should not reflect mutations of the object passed to update()', async () => {
      const config = await configAdmin.getConfiguration('immutable.update.pid');
      const props: Record<string, any> = { key: 'value' };
      await config.update(props);

      props.key = 'mutated';
      props.injected = 'extra';

      const stored = config.getProperties()!;
      expect(stored.key).toBe('value');
      expect(stored.injected).toBeUndefined();
    });

    it('should deliver an isolated copy to the ManagedService (mutation does not affect stored config)', async () => {
      let deliveredProps: Record<string, any> | null = null;
      const managedService: ManagedService = {
        updated: vi.fn((props: Record<string, any> | null) => {
          deliveredProps = props;
        }),
      };

      const context = framework.getBundle(0)!.getContext()!;
      context.registerService('ManagedService', managedService, { 'service.pid': 'delivered.pid' });

      const config = await configAdmin.getConfiguration('delivered.pid');
      await config.update({ key: 'value' });
      await flush();

      expect(deliveredProps).not.toBeNull();
      (deliveredProps as unknown as Record<string, any>).key = 'mutated';

      const stored = config.getProperties()!;
      expect(stored.key).toBe('value');
    });
  });
});
