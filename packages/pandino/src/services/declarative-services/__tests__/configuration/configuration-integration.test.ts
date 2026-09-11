import { beforeEach, describe, expect, it } from 'vitest';
import type { BundleContext } from '../../../../framework/interfaces';
import { Component, ConfigurationPolicy, Modified, Property } from '@pandino/decorators';
import { getComponentMetadata } from '../../reflection';
import { ServiceComponentRuntime } from '../../scr';
import { createScrHarness } from '../support/scr-harness';

describe('Configuration and Properties', () => {
  let scr: ServiceComponentRuntime;
  let bundleContext: BundleContext;

  beforeEach(async () => {
    ({ scr, bundleContext } = await createScrHarness());
  });

  describe('Component Properties', () => {
    it('should manage component properties', () => {
      @Component({ name: 'property.component' })
      @Property('service.ranking', 100)
      @Property('custom.property', 'test-value')
      class PropertyComponent {}

      const metadata = getComponentMetadata(PropertyComponent);
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

      const metadata = getComponentMetadata(ConfigRequiredComponent);
      expect(metadata.configurationPolicy).toBe('require');
      expect(metadata.configurationPid).toBe('test.config');
    });

    it('should apply ConfigurationPolicy decorator', () => {
      @Component({ name: 'config.policy.component' })
      @ConfigurationPolicy('require')
      class ConfigPolicyComponent {}

      const metadata = getComponentMetadata(ConfigPolicyComponent);
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

      const bundleId = bundleContext.getBundle().getBundleId();
      scr.registerComponent(ConfigComponent, bundleId);
      await scr.activateComponent(bundleId, 'config.component');

      await (scr as any).updateComponentConfiguration(bundleId, 'config.component', { updated: true });

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

      const metadata = getComponentMetadata(ConfigurableComponent);
      expect(metadata.configurationPid).toBe('test.pid');
      expect(metadata.modified).toBe('modified');
    });
  });
});
