import { beforeEach, describe, expect, it } from 'vitest';
import { OSGiFramework } from '~/framework/framework';
import type { BundleContext } from '~/framework/interfaces';
import { Component, ConfigurationPolicy, Modified, Property } from './interfaces';
import { ServiceComponentRuntime } from './scr';

describe('Configuration and Properties', () => {
  let framework: OSGiFramework;
  let scr: ServiceComponentRuntime;
  let bundleContext: BundleContext;

  beforeEach(async () => {
    framework = new OSGiFramework();
    await framework.start();
    bundleContext = framework.getBundleContext();
    scr = new ServiceComponentRuntime(framework, bundleContext);
  });

  describe('Component Properties', () => {
    it('should manage component properties', () => {
      @Component({ name: 'property.component' })
      @Property('service.ranking', 100)
      @Property('custom.property', 'test-value')
      class PropertyComponent {}

      const metadata = (PropertyComponent as any).__osgi_component__;
      expect(metadata.properties['service.ranking']).toBe(100);
      expect(metadata.properties['custom.property']).toBe('test-value');
    });
  });

  describe('Configuration Policy', () => {
    it('should handle component with configuration policy require', async () => {
      @Component({
        name: 'config.required.component',
        configurationPid: 'test.config',
        configurationPolicy: 'require',
      })
      class ConfigRequiredComponent {
        activated = false;
      }

      const metadata = (ConfigRequiredComponent as any).__osgi_component__;
      expect(metadata.configurationPolicy).toBe('require');
      expect(metadata.configurationPid).toBe('test.config');
    });

    it('should apply ConfigurationPolicy decorator', () => {
      @Component({ name: 'config.policy.component' })
      @ConfigurationPolicy('require')
      class ConfigPolicyComponent {}

      const metadata = (ConfigPolicyComponent as any).__osgi_component__;
      expect(metadata.configurationPolicy).toBe('require');
    });
  });

  describe('Configuration Handling', () => {
    it('should handle configuration updates', async () => {
      let updatedConfig: Record<string, any> | null = null;

      @Component({ name: 'config.component', configurationPid: 'test.pid' })
      class ConfigComponent {
        @Modified
        configUpdated(config: Record<string, any>) {
          updatedConfig = config;
        }
      }

      scr.registerComponent(ConfigComponent);
      await scr.activateComponent('config.component');

      await (scr as any).updateComponentConfiguration('config.component', { updated: true });

      expect(updatedConfig).not.toBeNull();
      expect(updatedConfig!.updated).toBe(true);
    });

    it('should handle configuration updates with Modified decorator', async () => {
      let _lastConfig: Record<string, any> | null = null;

      @Component({
        name: 'configurable.component',
        configurationPid: 'test.pid',
      })
      class ConfigurableComponent {
        @Modified
        modified(config: Record<string, any>) {
          _lastConfig = config;
        }
      }

      const metadata = (ConfigurableComponent as any).__osgi_component__;
      expect(metadata.configurationPid).toBe('test.pid');
      expect(metadata.modified).toBe('modified');
    });
  });
});
