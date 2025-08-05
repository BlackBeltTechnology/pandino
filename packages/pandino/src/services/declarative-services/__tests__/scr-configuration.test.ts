import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OSGiFramework } from '~/framework/framework';
import type { BundleContext } from '~/framework/interfaces';
import { ServiceComponentRuntime } from '../scr';
import type { ConfigurationAdmin } from '~/services/config-admin/interfaces';
import { Activate, Component } from '@pandino/decorators';

describe('SCR Configuration Integration', () => {
  let framework: OSGiFramework;
  let scr: ServiceComponentRuntime;
  let bundleContext: BundleContext;
  let mockConfigAdmin: ConfigurationAdmin;

  beforeEach(async () => {
    framework = new OSGiFramework();
    await framework.start();
    bundleContext = framework.getBundleContext();

    mockConfigAdmin = {
      getConfiguration: vi.fn(),
      createFactoryConfiguration: vi.fn(),
      listConfigurations: vi.fn(),
    };

    bundleContext.registerService('ConfigurationAdmin', mockConfigAdmin);

    scr = new ServiceComponentRuntime(framework, bundleContext);
  });

  describe('hasConfiguration method', () => {
    it('should return true when no configuration PID is specified', async () => {
      const result = await (scr as any).hasConfiguration(undefined);
      expect(result).toBe(true);
    });

    it('should return false when ConfigAdmin is not available', async () => {
      const newFramework = new OSGiFramework();
      await newFramework.start();
      const newBundleContext = newFramework.getBundleContext();
      const scrWithoutConfigAdmin = new ServiceComponentRuntime(newFramework, newBundleContext);

      const result = await (scrWithoutConfigAdmin as any).hasConfiguration('test.pid');
      expect(result).toBe(false);
    });

    it('should return true when ConfigAdmin has the specified configuration', async () => {
      mockConfigAdmin.listConfigurations = vi.fn().mockResolvedValue([{ getPid: () => 'test.pid' }]);

      const result = await (scr as any).hasConfiguration('test.pid');
      expect(result).toBe(true);

      expect(mockConfigAdmin.listConfigurations).toHaveBeenCalledWith('(service.pid=test.pid)');
    });

    it('should return false when ConfigAdmin does not have the specified configuration', async () => {
      mockConfigAdmin.listConfigurations = vi.fn().mockResolvedValue(null);

      const result = await (scr as any).hasConfiguration('test.pid');
      expect(result).toBe(false);

      expect(mockConfigAdmin.listConfigurations).toHaveBeenCalledWith('(service.pid=test.pid)');
    });

    it('should return false when ConfigAdmin throws an error', async () => {
      mockConfigAdmin.listConfigurations = vi.fn().mockRejectedValue(new Error('Test error'));

      const mockLogger = {
        log: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        info: vi.fn(),
        debug: vi.fn(),
        isLoggable: vi.fn().mockReturnValue(true),
        setLogLevel: vi.fn(),
        getLogLevel: vi.fn(),
        addLogListener: vi.fn(),
        removeLogListener: vi.fn(),
      };

      const getLoggerSpy = vi.spyOn(framework, 'getLogger').mockReturnValue(mockLogger);

      const result = await (scr as any).hasConfiguration('test.pid');
      expect(result).toBe(false);

      expect(mockConfigAdmin.listConfigurations).toHaveBeenCalledWith('(service.pid=test.pid)');

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error checking configuration existence for PID test.pid:'),
        expect.any(Error),
      );

      getLoggerSpy.mockRestore();
    });
  });

  describe('Component activation with configuration policy', () => {
    it('should not activate component with configurationPolicy=require when no configuration exists', async () => {
      mockConfigAdmin.listConfigurations = vi.fn().mockResolvedValue(null);

      @Component({
        name: 'config.required.component',
        configurationPid: 'test.config',
        configurationPolicy: 'require',
      })
      class ConfigRequiredComponent {
        activated = false;

        activate() {
          this.activated = true;
        }
      }

      const bundleId = bundleContext.getBundle().getBundleId();
      await scr.registerComponent(ConfigRequiredComponent, bundleId);

      try {
        await scr.activateComponent(bundleId, 'config.required.component');
        // oxlint-disable-next-line no-unused-vars
      } catch (e) {
        // Ignore any errors
      }

      const entry = scr.getComponent(bundleId, 'config.required.component');
      expect(entry).toBeDefined();
      expect(entry?.instance).toBeNull(); // Should not be activated
    });

    it('should activate component with configurationPolicy=require when configuration exists', async () => {
      mockConfigAdmin.listConfigurations = vi.fn().mockResolvedValue([{ getPid: () => 'test.config' }]);

      @Component({
        name: 'config.required.component',
        configurationPid: 'test.config',
        configurationPolicy: 'require',
      })
      class ConfigRequiredComponent {
        activated = false;

        @Activate
        activate() {
          this.activated = true;
        }
      }

      const bundleId = bundleContext.getBundle().getBundleId();
      await scr.registerComponent(ConfigRequiredComponent, bundleId);

      await scr.activateComponent(bundleId, 'config.required.component');

      const entry = scr.getComponent(bundleId, 'config.required.component');
      expect(entry).toBeDefined();
      expect(entry?.instance).toBeInstanceOf(ConfigRequiredComponent);
      expect(entry?.instance.activated).toBe(true);
    });

    it('should activate component with configurationPolicy=optional regardless of configuration', async () => {
      mockConfigAdmin.listConfigurations = vi.fn().mockResolvedValue(null);

      @Component({
        name: 'config.optional.component',
        configurationPid: 'test.config',
        configurationPolicy: 'optional',
      })
      class ConfigOptionalComponent {
        activated = false;

        @Activate
        activate() {
          this.activated = true;
        }
      }

      const bundleId = bundleContext.getBundle().getBundleId();
      await scr.registerComponent(ConfigOptionalComponent, bundleId);

      await scr.activateComponent(bundleId, 'config.optional.component');

      const entry = scr.getComponent(bundleId, 'config.optional.component');
      expect(entry).toBeDefined();
      expect(entry?.instance).toBeInstanceOf(ConfigOptionalComponent);
      expect(entry?.instance.activated).toBe(true);
    });

    it('should activate component with configurationPolicy=ignore regardless of configuration', async () => {
      mockConfigAdmin.listConfigurations = vi.fn().mockResolvedValue(null);

      @Component({
        name: 'config.ignore.component',
        configurationPid: 'test.config',
        configurationPolicy: 'ignore',
      })
      class ConfigIgnoreComponent {
        activated = false;

        @Activate
        activate() {
          this.activated = true;
        }
      }

      const bundleId = bundleContext.getBundle().getBundleId();
      await scr.registerComponent(ConfigIgnoreComponent, bundleId);

      await scr.activateComponent(bundleId, 'config.ignore.component');

      const entry = scr.getComponent(bundleId, 'config.ignore.component');
      expect(entry).toBeDefined();
      expect(entry?.instance).toBeInstanceOf(ConfigIgnoreComponent);
      expect(entry?.instance.activated).toBe(true);
    });
  });

  describe('canActivateComponent with configuration policy', () => {
    it('should return false for component with configurationPolicy=require when no configuration exists', async () => {
      mockConfigAdmin.listConfigurations = vi.fn().mockResolvedValue(null);

      @Component({
        name: 'config.required.component',
        configurationPid: 'test.config',
        configurationPolicy: 'require',
      })
      class ConfigRequiredComponent {}

      const bundleId = bundleContext.getBundle().getBundleId();
      await scr.registerComponent(ConfigRequiredComponent, bundleId);

      const result = await (scr as any).canActivateComponent(bundleId, 'config.required.component');
      expect(result).toBe(false);
    });

    it('should return true for component with configurationPolicy=require when configuration exists', async () => {
      mockConfigAdmin.listConfigurations = vi.fn().mockResolvedValue([{ getPid: () => 'test.config' }]);

      @Component({
        name: 'config.required.component',
        configurationPid: 'test.config',
        configurationPolicy: 'require',
      })
      class ConfigRequiredComponent {}

      const bundleId = bundleContext.getBundle().getBundleId();
      await scr.registerComponent(ConfigRequiredComponent, bundleId);

      const result = await (scr as any).canActivateComponent(bundleId, 'config.required.component');
      expect(result).toBe(true);
    });
  });
});
