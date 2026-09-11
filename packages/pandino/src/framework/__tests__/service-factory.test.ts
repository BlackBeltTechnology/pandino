import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OSGiFramework } from '../framework';
import type { Bundle, BundleContext, ServiceFactory, ServiceReference, ServiceRegistration } from '../interfaces';
import { silenceConsole } from '../../test/console';

/**
 * ServiceFactory behavior tests.
 *
 * Implementation reference (packages/pandino/src/framework/framework.ts):
 * - OSGiFramework.isServiceFactory: an object with both getService & ungetService
 *   functions is treated as a ServiceFactory (sets service.factory=true).
 * - ServiceRegistrationImpl.getService(bundle):
 *     - service.scope === 'prototype' → always calls factory.getService, never caches.
 *     - otherwise (bundle scope) → caches one instance per requesting bundle id;
 *       falsy factory results are NOT cached.
 * - ServiceRegistrationImpl.ungetService(bundle) → calls factory.ungetService with
 *   (bundle, registration, instance) and drops the cached instance.
 * - BundleImpl.stop() → cleanupFactoryServices() invokes ungetService for every
 *   bundle-scoped factory instance the stopping bundle acquired.
 */
describe('ServiceFactory', () => {
  let framework: OSGiFramework;
  let providerCtx: BundleContext;

  beforeEach(async () => {
    framework = new OSGiFramework();
    await framework.start();

    silenceConsole(['error', 'warn', 'info', 'debug']);

    // Bundle that registers the factory.
    const provider = await framework.installBundle('test://provider');
    providerCtx = (provider as any).getContext();
  });

  interface Widget {
    id: number;
    owner: string;
  }

  function makeFactory(): ServiceFactory<Widget> & {
    getService: ReturnType<typeof vi.fn>;
    ungetService: ReturnType<typeof vi.fn>;
    created: number;
  } {
    let counter = 0;
    const factory = {
      created: 0,
      getService: vi.fn((bundle: Bundle, _registration: ServiceRegistration<Widget>): Widget => {
        factory.created += 1;
        return { id: ++counter, owner: bundle.getSymbolicName() };
      }),
      ungetService: vi.fn((_bundle: Bundle, _registration: ServiceRegistration<Widget>, _service: Widget): void => {}),
    };
    return factory;
  }

  it('detects a factory object as a ServiceFactory (service.factory=true)', () => {
    const factory = makeFactory();
    const reg = providerCtx.registerService('Widget', factory);

    expect(reg.getReference().getProperty('service.factory')).toBe(true);
  });

  it('returns the same instance for repeated getService by the same bundle (bundle scope)', async () => {
    const factory = makeFactory();
    const reg = providerCtx.registerService('Widget', factory);
    const ref = reg.getReference();

    const consumer = await framework.installBundle('test://consumer-a');
    const consumerCtx: BundleContext = (consumer as any).getContext();

    const first = consumerCtx.getService(ref);
    const second = consumerCtx.getService(ref);

    expect(first).not.toBeNull();
    expect(second).toBe(first);
    // Factory only invoked once for the same bundle.
    expect(factory.getService).toHaveBeenCalledTimes(1);
  });

  it('returns different instances for different requesting bundles', async () => {
    const factory = makeFactory();
    const reg = providerCtx.registerService('Widget', factory);
    const ref = reg.getReference() as ServiceReference<Widget>;

    const a = await framework.installBundle('test://consumer-a');
    const b = await framework.installBundle('test://consumer-b');
    const ctxA: BundleContext = (a as any).getContext();
    const ctxB: BundleContext = (b as any).getContext();

    const widgetA = ctxA.getService(ref);
    const widgetB = ctxB.getService(ref);

    expect(widgetA).not.toBeNull();
    expect(widgetB).not.toBeNull();
    expect(widgetA).not.toBe(widgetB);
    expect(widgetA!.owner).toBe('consumer-a');
    expect(widgetB!.owner).toBe('consumer-b');
    expect(factory.getService).toHaveBeenCalledTimes(2);
  });

  it('invokes ungetService with correct args when a consuming bundle stops', async () => {
    const factory = makeFactory();
    const reg = providerCtx.registerService('Widget', factory);
    const ref = reg.getReference();

    const consumer = await framework.installBundle('test://consumer-a');
    await consumer.start();
    const consumerCtx: BundleContext = (consumer as any).getContext();

    const instance = consumerCtx.getService(ref);
    expect(instance).not.toBeNull();

    await consumer.stop();

    expect(factory.ungetService).toHaveBeenCalledTimes(1);
    expect(factory.ungetService).toHaveBeenCalledWith(consumer, reg, instance);
  });

  it('prototype scope returns a new instance on every getService (never cached)', async () => {
    const factory = makeFactory();
    const reg = providerCtx.registerService('Widget', factory, { 'service.scope': 'prototype' });
    const ref = reg.getReference();

    const consumer = await framework.installBundle('test://consumer-a');
    const consumerCtx: BundleContext = (consumer as any).getContext();

    const first = consumerCtx.getService(ref);
    const second = consumerCtx.getService(ref);

    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    expect(second).not.toBe(first);
    // Even for the same bundle, prototype scope re-invokes the factory each call.
    expect(factory.getService).toHaveBeenCalledTimes(2);
  });

  it('does not cache a null factory result and getService returns null', async () => {
    const nullFactory: ServiceFactory<Widget> & { getService: ReturnType<typeof vi.fn> } = {
      getService: vi.fn((): any => null),
      ungetService: vi.fn(),
    };
    const reg = providerCtx.registerService('Widget', nullFactory);
    const ref = reg.getReference();

    const consumer = await framework.installBundle('test://consumer-a');
    const consumerCtx: BundleContext = (consumer as any).getContext();

    const first = consumerCtx.getService(ref);
    const second = consumerCtx.getService(ref);

    expect(first).toBeNull();
    expect(second).toBeNull();
    // Not cached → factory re-invoked on the second call.
    expect(nullFactory.getService).toHaveBeenCalledTimes(2);
  });
});
