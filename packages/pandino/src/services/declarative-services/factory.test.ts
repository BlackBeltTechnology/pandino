import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OSGiFramework } from '~/framework/framework';
import type { BundleContext } from '~/framework/interfaces';
import { Activate, Component, Factory } from './interfaces';
import { ServiceComponentRuntime } from './scr';

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

      const metadata = (FactoryComponent as any).__osgi_component__;
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

      const metadata = (FactoryComponent as any).__osgi_component__;
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

      scr.registerComponent(FactoryComponent);
      await scr.activateComponent('factory.component');

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

      scr.registerComponent(TestFactoryComponent);
      await scr.activateComponent('test.factory.component');

      const instance = await scr.createFactoryInstance('TestFactory', 'instance1');
      expect(instance).toBeDefined();

      await scr.deleteFactoryInstance('TestFactory', 'instance1');

      expect(deactivateSpy).toHaveBeenCalledTimes(1);
      const contextArg = deactivateSpy.mock.calls[0][0];
      expect(contextArg.getComponentName()).toBe('test.factory.component.instance1');
      expect(contextArg.getBundleContext()).toBe(bundleContext);

      const factoryComponent = scr.getComponent('test.factory.component');
      expect(factoryComponent?.factoryInstances?.has('instance1')).toBe(false);
    });

    it('should throw error when factory component not found', async () => {
      await expect(scr.deleteFactoryInstance('NonExistentFactory', 'instance1')).rejects.toThrow(
        'Factory component with factory ID NonExistentFactory not found or not active',
      );
    });

    it('should throw error when factory component exists but is not active', async () => {
      @Component({
        name: 'test.factory.component',
        factory: 'TestFactory',
      })
      class TestFactoryComponent {}

      scr.registerComponent(TestFactoryComponent);

      await expect(scr.deleteFactoryInstance('TestFactory', 'instance1')).rejects.toThrow(
        'Factory component with factory ID TestFactory not found or not active',
      );
    });

    it('should throw error when factory instance not found', async () => {
      @Component({
        name: 'test.factory.component',
        factory: 'TestFactory',
      })
      class TestFactoryComponent {}

      scr.registerComponent(TestFactoryComponent);
      await scr.activateComponent('test.factory.component');

      await expect(scr.deleteFactoryInstance('TestFactory', 'nonexistent')).rejects.toThrow(
        'Factory instance nonexistent not found',
      );
    });

    it('should continue cleanup even if deactivate method throws error', async () => {
      const deactivateError = new Error('Deactivation failed');
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

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

      scr.registerComponent(TestFactoryComponent);
      await scr.activateComponent('test.factory.component');

      const instance = await scr.createFactoryInstance('TestFactory', 'instance1');
      expect(instance).toBeDefined();

      await scr.deleteFactoryInstance('TestFactory', 'instance1');

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error during deactivation of factory instance instance1:',
        deactivateError,
      );

      const factoryComponent = scr.getComponent('test.factory.component');
      expect(factoryComponent?.factoryInstances?.has('instance1')).toBe(false);

      consoleSpy.mockRestore();
    });

    it('should handle component without deactivate method', async () => {
      @Component({
        name: 'test.factory.component',
        factory: 'TestFactory',
      })
      class TestFactoryComponent {}

      scr.registerComponent(TestFactoryComponent);
      await scr.activateComponent('test.factory.component');

      const instance = await scr.createFactoryInstance('TestFactory', 'instance1');
      expect(instance).toBeDefined();

      await scr.deleteFactoryInstance('TestFactory', 'instance1');

      const factoryComponent = scr.getComponent('test.factory.component');
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

      scr.registerComponent(TestFactoryComponent);
      await scr.activateComponent('test.factory.component');

      const instance = await scr.createFactoryInstance('TestFactory', 'instance1');
      expect(instance).toBeDefined();

      await scr.deleteFactoryInstance('TestFactory', 'instance1');

      const factoryComponent = scr.getComponent('test.factory.component');
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

      scr.registerComponent(TestFactoryComponent);
      await scr.activateComponent('test.factory.component');

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

      scr.registerComponent(TestFactoryComponent);
      await scr.activateComponent('test.factory.component');

      await scr.createFactoryInstance('TestFactory', 'instance1');
      await scr.createFactoryInstance('TestFactory', 'instance2');

      const factoryComponent = scr.getComponent('test.factory.component');
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
