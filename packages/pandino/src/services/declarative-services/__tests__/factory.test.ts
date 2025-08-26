import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OSGiFramework } from '../../../framework/framework';
import type { BundleContext } from '../../../framework/interfaces';
import { getComponentMetadata } from '../reflection';
import { ServiceComponentRuntime } from '../scr';
import { Component, Factory } from '@pandino/decorators';
import { Activate } from '@pandino/decorators';

describe('Factory Components', () => {
  let framework: OSGiFramework;
  let scr: ServiceComponentRuntime;
  let bundleContext: BundleContext;

  beforeEach(async () => {
    framework = new OSGiFramework();
    await framework.start();
    bundleContext = framework.getBundleContext();
    scr = new ServiceComponentRuntime(framework, bundleContext);
  });

  describe('Factory Component Definition', () => {
    it('should define factory components', () => {
      @Component({
        name: 'factory.component',
        factory: 'test.factory',
      })
      class FactoryComponent {
        constructor(private config: Record<string, any>) {}

        getConfig(): Record<string, any> {
          return this.config;
        }
      }

      const metadata = getComponentMetadata(FactoryComponent);
      expect(metadata.factory).toBe('test.factory');
    });

    it('should define factory components with Factory decorator', () => {
      @Component({ name: 'factory.component' })
      @Factory('test.factory')
      class FactoryComponent {
        constructor(private config: Record<string, any>) {}

        getConfig() {
          return this.config;
        }
      }

      const metadata = getComponentMetadata(FactoryComponent);
      expect(metadata.factory).toBe('test.factory');
    });
  });

  describe('Factory Instance Creation', () => {
    it('should create factory instances', async () => {
      @Component({ name: 'factory.component' })
      @Factory('test.factory')
      class FactoryComponent {
        constructor(private config: Record<string, any>) {}

        getConfig() {
          return this.config;
        }
      }

      const bundleId = bundleContext.getBundle().getBundleId();
      scr.registerComponent(FactoryComponent, bundleId);
      await scr.activateComponent(bundleId, 'factory.component');

      const instance = await (scr as any).createFactoryInstance('test.factory', 'instance1', { key: 'value' });

      expect(instance).toBeDefined();
      expect(instance.getConfig().key).toBe('value');
    });
  });

  describe('Factory Instance Deletion', () => {
    it('should successfully delete a factory instance', async () => {
      const deactivateSpy = vi.fn();

      @Component({
        name: 'test.factory.component',
        factory: 'TestFactory',
        deactivate: 'deactivate',
      })
      class TestFactoryComponent {
        @Activate
        activate() {}

        deactivate = deactivateSpy;
      }

      const bundleId = bundleContext.getBundle().getBundleId();
      scr.registerComponent(TestFactoryComponent, bundleId);
      await scr.activateComponent(bundleId, 'test.factory.component');

      const instance = await scr.createFactoryInstance('TestFactory', 'instance1');
      expect(instance).toBeDefined();

      await scr.deleteFactoryInstance('TestFactory', 'instance1');

      expect(deactivateSpy).toHaveBeenCalledTimes(1);
      const contextArg = deactivateSpy.mock.calls[0][0];
      expect(contextArg.getComponentName()).toBe('test.factory.component.instance1');
      expect(contextArg.getBundleContext()).toBe(bundleContext);

      const factoryComponent = scr.getComponent(bundleId, 'test.factory.component');
      expect(factoryComponent?.factoryInstances?.has('instance1')).toBe(false);
    });

    it('should throw error when factory component not found', async () => {
      await expect(scr.deleteFactoryInstance('NonExistentFactory', 'instance1')).rejects.toThrow(
        'Factory component with factory ID NonExistentFactory not active in any bundle',
      );
    });

    it('should throw error when factory component exists but is not active', async () => {
      @Component({
        name: 'test.factory.component',
        factory: 'TestFactory',
      })
      class TestFactoryComponent {}

      const bundleId = bundleContext.getBundle().getBundleId();
      scr.registerComponent(TestFactoryComponent, bundleId);

      await expect(scr.deleteFactoryInstance('TestFactory', 'instance1')).rejects.toThrow(
        'Factory component with factory ID TestFactory not active in any bundle',
      );
    });

    it('should throw error when factory instance not found', async () => {
      @Component({
        name: 'test.factory.component',
        factory: 'TestFactory',
      })
      class TestFactoryComponent {}

      const bundleId = bundleContext.getBundle().getBundleId();
      scr.registerComponent(TestFactoryComponent, bundleId);
      await scr.activateComponent(bundleId, 'test.factory.component');

      await expect(scr.deleteFactoryInstance('TestFactory', 'nonexistent')).rejects.toThrow(
        'Factory instance nonexistent not found',
      );
    });

    it('should continue cleanup even if deactivate method throws error', async () => {
      const deactivateError = new Error('Deactivation failed');

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

      @Component({
        name: 'test.factory.component',
        factory: 'TestFactory',
        deactivate: 'deactivate',
      })
      class TestFactoryComponent {
        deactivate() {
          throw deactivateError;
        }
      }

      const bundleId = bundleContext.getBundle().getBundleId();
      scr.registerComponent(TestFactoryComponent, bundleId);
      await scr.activateComponent(bundleId, 'test.factory.component');

      const instance = await scr.createFactoryInstance('TestFactory', 'instance1');
      expect(instance).toBeDefined();

      await scr.deleteFactoryInstance('TestFactory', 'instance1');

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error during deactivation of factory instance instance1:',
        deactivateError,
      );

      const factoryComponent = scr.getComponent(bundleId, 'test.factory.component');
      expect(factoryComponent?.factoryInstances?.has('instance1')).toBe(false);

      getLoggerSpy.mockRestore();
    });

    it('should handle component without deactivate method', async () => {
      @Component({
        name: 'test.factory.component',
        factory: 'TestFactory',
      })
      class TestFactoryComponent {}

      const bundleId = bundleContext.getBundle().getBundleId();
      scr.registerComponent(TestFactoryComponent, bundleId);
      await scr.activateComponent(bundleId, 'test.factory.component');

      const instance = await scr.createFactoryInstance('TestFactory', 'instance1');
      expect(instance).toBeDefined();

      await scr.deleteFactoryInstance('TestFactory', 'instance1');

      const factoryComponent = scr.getComponent(bundleId, 'test.factory.component');
      expect(factoryComponent?.factoryInstances?.has('instance1')).toBe(false);
    });

    it('should handle component with deactivate method that is not a function', async () => {
      @Component({
        name: 'test.factory.component',
        factory: 'TestFactory',
        deactivate: 'deactivate',
      })
      class TestFactoryComponent {
        deactivate = 'not a function'; // Invalid deactivate
      }

      const bundleId = bundleContext.getBundle().getBundleId();
      scr.registerComponent(TestFactoryComponent, bundleId);
      await scr.activateComponent(bundleId, 'test.factory.component');

      const instance = await scr.createFactoryInstance('TestFactory', 'instance1');
      expect(instance).toBeDefined();

      await scr.deleteFactoryInstance('TestFactory', 'instance1');

      const factoryComponent = scr.getComponent(bundleId, 'test.factory.component');
      expect(factoryComponent?.factoryInstances?.has('instance1')).toBe(false);
    });

    it('should pass correct context with merged properties to deactivate method', async () => {
      const deactivateSpy = vi.fn();

      @Component({
        name: 'test.factory.component',
        factory: 'TestFactory',
        properties: { baseProp: 'base' },
        deactivate: 'deactivate',
      })
      class TestFactoryComponent {
        deactivate = deactivateSpy;
      }

      const bundleId = bundleContext.getBundle().getBundleId();
      scr.registerComponent(TestFactoryComponent, bundleId);
      await scr.activateComponent(bundleId, 'test.factory.component');

      const configuration = { configProp: 'config' };
      await scr.createFactoryInstance('TestFactory', 'instance1', configuration);

      await scr.deleteFactoryInstance('TestFactory', 'instance1');

      expect(deactivateSpy).toHaveBeenCalledTimes(1);
      const context = deactivateSpy.mock.calls[0][0];
      const properties = context.getProperties();
      expect(properties).toEqual({
        baseProp: 'base',
        configProp: 'config',
      });
    });

    it('should delete multiple factory instances independently', async () => {
      const deactivateSpy = vi.fn();

      @Component({
        name: 'test.factory.component',
        factory: 'TestFactory',
        deactivate: 'deactivate',
      })
      class TestFactoryComponent {
        deactivate = deactivateSpy;
      }

      const bundleId = bundleContext.getBundle().getBundleId();
      scr.registerComponent(TestFactoryComponent, bundleId);
      await scr.activateComponent(bundleId, 'test.factory.component');

      await scr.createFactoryInstance('TestFactory', 'instance1');
      await scr.createFactoryInstance('TestFactory', 'instance2');

      const factoryComponent = scr.getComponent(bundleId, 'test.factory.component');
      expect(factoryComponent?.factoryInstances?.size).toBe(2);

      await scr.deleteFactoryInstance('TestFactory', 'instance1');

      expect(deactivateSpy).toHaveBeenCalledTimes(1);
      expect(factoryComponent?.factoryInstances?.has('instance1')).toBe(false);
      expect(factoryComponent?.factoryInstances?.has('instance2')).toBe(true);
      expect(factoryComponent?.factoryInstances?.size).toBe(1);

      await scr.deleteFactoryInstance('TestFactory', 'instance2');

      expect(deactivateSpy).toHaveBeenCalledTimes(2);
      expect(factoryComponent?.factoryInstances?.has('instance2')).toBe(false);
      expect(factoryComponent?.factoryInstances?.size).toBe(0);
    });
  });
});
