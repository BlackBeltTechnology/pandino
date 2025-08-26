import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { OSGiBootstrap } from '../../../framework/bootstrap';
import type { BundleContext } from '../../../framework/interfaces';
import { Component, Service, Reference, Activate, Deactivate } from '@pandino/decorators';

interface AuxService {
  ping(): string;
}

class AuxServiceImpl implements AuxService {
  ping() {
    return 'pong';
  }
}

describe('Service Component Runtime (Declarative Services)', () => {
  let bootstrap: OSGiBootstrap;
  let context: BundleContext;

  beforeEach(async () => {
    bootstrap = new OSGiBootstrap();
    const framework = await bootstrap.start();
    context = framework.getBundleContext();
  });

  afterEach(async () => {
    await bootstrap.stop();
  });

  it('binds references before @Activate is invoked (singleton scope)', async () => {
    // Provide required referenced service BEFORE installing the component bundle
    context.registerService('AuxService', new AuxServiceImpl());

    @Component({ name: 'probe.component', immediate: true })
    @Service({ interfaces: ['ProbeService'] })
    class ProbeComponent {
      @Reference({ interface: 'AuxService', cardinality: '1..1' })
      private aux!: AuxService;

      private activatedWithRef = false;

      @Activate
      activate() {
        this.activatedWithRef = !!this.aux;
      }

      @Deactivate
      deactivate() {}

      isActivatedWithReference(): boolean {
        return this.activatedWithRef;
      }

      hasAux(): boolean {
        return !!this.aux;
      }
    }

    const testBundleModule = Promise.resolve({
      default: {
        headers: {
          bundleSymbolicName: '@pandino/test.bundle1',
          bundleVersion: '1.0.0',
        },
        components: [ProbeComponent],
      },
    });

    const bundle = await context.installBundle(testBundleModule);
    await bundle.start();

    const ref = context.getServiceReference<any>('ProbeService');
    expect(ref).not.toBeNull();
    const svc = context.getService<any>(ref!);
    expect(svc).toBeTruthy();
    // Pre-activation binding: reference should be available during activation and after
    expect(svc.isActivatedWithReference()).toBe(true);
    expect(svc.hasAux()).toBe(true);
  });

  it('prevents duplicate registration of the same component in the same bundle (idempotent)', async () => {
    @Component({ name: 'idempotent.component', immediate: true })
    @Service({ interfaces: ['IdempotentService'] })
    class IdempotentComponent {}

    const testBundleModule = Promise.resolve({
      default: {
        headers: {
          bundleSymbolicName: '@pandino/test.bundle2',
          bundleVersion: '1.0.0',
        },
        components: [IdempotentComponent],
      },
    });

    const bundle = await context.installBundle(testBundleModule);
    await bundle.start();

    // Obtain SCR service and attempt to register the component again
    const scrRef = context.getServiceReference<any>('ServiceComponentRuntime');
    expect(scrRef).not.toBeNull();
    const scr = context.getService<any>(scrRef!);
    expect(scr).toBeTruthy();

    // Registering the same component for the same bundle should be idempotent
    await scr.registerComponent(IdempotentComponent, bundle.getBundleId());
    await scr.registerComponent(IdempotentComponent, bundle.getBundleId());

    // Only one service reference should exist for IdempotentService
    const refs = context.getServiceReferences('IdempotentService');
    expect(refs).not.toBeNull();
    expect(refs!.length).toBe(1);
  });

  it('deactivates and unregisters services when bundle is stopped', async () => {
    @Component({ name: 'stop.component', immediate: true })
    @Service({ interfaces: ['StopService'] })
    class StopComponent {}

    const testBundleModule = Promise.resolve({
      default: {
        headers: {
          bundleSymbolicName: '@pandino/test.bundle3',
          bundleVersion: '1.0.0',
        },
        components: [StopComponent],
      },
    });

    const bundle = await context.installBundle(testBundleModule);
    await bundle.start();

    // Service available
    expect(context.getServiceReference('StopService')).not.toBeNull();

    await bundle.stop();

    // Service should be unregistered after stop
    expect(context.getServiceReference('StopService')).toBeNull();
  });
});
