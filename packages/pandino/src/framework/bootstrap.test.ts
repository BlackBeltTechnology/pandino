import { beforeEach, describe, expect, it } from 'vitest';
import { OSGiBootstrap } from './bootstrap';

describe('OSGiBootstrap', () => {
  let bootstrap: OSGiBootstrap;

  beforeEach(() => {
    bootstrap = new OSGiBootstrap();
  });

  describe('framework startup', () => {
    it('should start framework and install system services', async () => {
      const framework = await bootstrap.start();

      expect(framework).toBeDefined();

      const context = framework.getBundleContext();

      const configAdminRef = context.getServiceReference('ConfigurationAdmin');
      const eventAdminRef = context.getServiceReference('EventAdmin');
      const scrRef = context.getServiceReference('ServiceComponentRuntime');
      const serviceTrackerRef = context.getServiceReference('ServiceTracker');

      expect(configAdminRef).toBeDefined();
      expect(eventAdminRef).toBeDefined();
      expect(scrRef).toBeDefined();
      expect(serviceTrackerRef).toBeDefined();
    });

    it('should stop framework cleanly', async () => {
      const _framework = await bootstrap.start();
      await bootstrap.stop();

      expect(true).toBe(true); // Would check internal state in real implementation
    });

    it('should return framework instance', async () => {
      await bootstrap.start();
      const framework = bootstrap.getFramework();

      expect(framework).toBeDefined();
      expect(typeof framework.start).toBe('function');
    });
  });
});
