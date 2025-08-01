import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OSGiBootstrap } from '~/framework/bootstrap';
import type { ConfigurationAdmin, ManagedService } from '~/services/config-admin/interfaces';
import type { EventAdmin, EventHandler } from '~/services/event-admin/interfaces';
import { Event } from '~/services/event-admin/interfaces';
import { BUNDLE_STATES } from '~/types/constants';

describe('Full Stack Integration', () => {
  let bootstrap: OSGiBootstrap;

  beforeEach(async () => {
    bootstrap = new OSGiBootstrap();
    await bootstrap.start();
  });

  afterEach(async () => {
    await bootstrap.stop();
  });

  it('should integrate configuration and event admin', async () => {
    const framework = bootstrap.getFramework();
    const context = framework.getBundleContext();

    const configAdminRef = context.getServiceReference('ConfigurationAdmin');
    const eventAdminRef = context.getServiceReference('EventAdmin');

    const configAdmin = context.getService<ConfigurationAdmin>(configAdminRef!);
    const eventAdmin = context.getService<EventAdmin>(eventAdminRef!);

    expect(configAdmin).toBeDefined();
    expect(eventAdmin).toBeDefined();

    const eventHandler: EventHandler = {
      handleEvent: vi.fn(),
    };

    const managedService: ManagedService = {
      updated: vi.fn((properties) => {
        if (properties) {
          const event = new Event('config/updated', properties);
          eventAdmin!.postEvent(event);
        }
      }),
    };

    context.registerService('EventHandler', eventHandler, {
      'event.topics': 'config/updated',
    });

    context.registerService('ManagedService', managedService, {
      'service.pid': 'test.integration',
    });

    const config = await configAdmin!.getConfiguration('test.integration');
    await config.update({ key: 'value', updated: true });

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(managedService.updated).toHaveBeenCalledWith({ key: 'value', updated: true });
    expect(eventHandler.handleEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        topic: 'config/updated',
      }),
    );
  });

  it('should handle bundle lifecycle with services', async () => {
    const framework = bootstrap.getFramework();
    const context = framework.getBundleContext();

    const bundle = await framework.installBundle('test://integration-bundle');
    await bundle.start();

    const bundleContext = (bundle as any).getContext();
    const service = { method: () => 'test' };
    const serviceRegistration = bundleContext.registerService('TestService', service);

    const serviceRef = context.getServiceReference('TestService');
    expect(serviceRef).toBeDefined();
    expect(serviceRef).not.toBeNull();

    const retrievedService = context.getService(serviceRef!);
    expect(retrievedService).toBe(service);

    await bundle.stop();

    expect(bundle.getState()).toBe(BUNDLE_STATES.RESOLVED);

    const serviceRefAfterStop = context.getServiceReference('TestService');

    expect(serviceRefAfterStop).toBeNull();

    expect(() => serviceRegistration.getReference()).toThrow();
  });
});
