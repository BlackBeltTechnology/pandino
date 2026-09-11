import { beforeEach, describe, expect, it } from 'vitest';
import { ServiceComponentRuntime } from '../../scr';
import { createScrHarness } from '../support/scr-harness';
import { Activate, Component, Reference, Scope, Service } from '@pandino/decorators';

/**
 * Regression test for https://github.com/BlackBeltTechnology/pandino/issues/297
 *
 * Referencing more than one already-active SCR component via @Reference
 * (field injection, default mandatory cardinality) must inject every service,
 * not just the first one.
 */
describe('Multiple @Reference to already-active SCR components (#297)', () => {
  let scr: ServiceComponentRuntime;
  let bundleId: number;

  beforeEach(async () => {
    ({ scr, bundleId } = await createScrHarness());
  });

  it('injects all referenced services when they are already active', async () => {
    @Component({ name: 'alpha.service', immediate: true })
    @Service({ interfaces: ['AlphaService'] })
    class AlphaServiceImpl {
      readonly kind = 'alpha';
      @Activate
      activate() {}
    }

    @Component({ name: 'beta.service', immediate: true })
    @Service({ interfaces: ['BetaService'] })
    class BetaServiceImpl {
      readonly kind = 'beta';
      @Activate
      activate() {}
    }

    @Component({ name: 'gamma.service', immediate: true })
    @Service({ interfaces: ['GammaService'] })
    class GammaServiceImpl {
      readonly kind = 'gamma';
      @Activate
      activate() {}
    }

    @Component({ name: 'consumer.component', immediate: true })
    class ConsumerComponent {
      @Reference({ interface: 'AlphaService' })
      alpha?: AlphaServiceImpl;

      @Reference({ interface: 'BetaService' })
      beta?: BetaServiceImpl;

      @Reference({ interface: 'GammaService' })
      gamma?: GammaServiceImpl;

      @Activate
      activate() {}
    }

    // Providers become active first.
    await scr.registerComponent(AlphaServiceImpl, bundleId);
    await scr.registerComponent(BetaServiceImpl, bundleId);
    await scr.registerComponent(GammaServiceImpl, bundleId);

    // Consumer references three already-active components.
    await scr.registerComponent(ConsumerComponent, bundleId);

    const consumer = scr.getComponent(bundleId, 'consumer.component')?.instance as ConsumerComponent;

    expect(consumer).toBeDefined();
    expect(consumer.alpha?.kind).toBe('alpha');
    expect(consumer.beta?.kind).toBe('beta');
    expect(consumer.gamma?.kind).toBe('gamma');
  });

  it('activates an immediate consumer registered before its providers', async () => {
    @Component({ name: 'alpha.service', immediate: true })
    @Service({ interfaces: ['AlphaService'] })
    class AlphaServiceImpl {
      readonly kind = 'alpha';
      @Activate
      activate() {}
    }

    @Component({ name: 'beta.service', immediate: true })
    @Service({ interfaces: ['BetaService'] })
    class BetaServiceImpl {
      readonly kind = 'beta';
      @Activate
      activate() {}
    }

    @Component({ name: 'consumer.component', immediate: true })
    class ConsumerComponent {
      activated = false;

      @Reference({ interface: 'AlphaService' })
      alpha?: AlphaServiceImpl;

      @Reference({ interface: 'BetaService' })
      beta?: BetaServiceImpl;

      @Activate
      activate() {
        this.activated = true;
      }
    }

    // Consumer is registered FIRST — its mandatory references are not yet
    // satisfiable. It must activate later once the providers come up.
    await scr.registerComponent(ConsumerComponent, bundleId);
    await scr.registerComponent(AlphaServiceImpl, bundleId);
    await scr.registerComponent(BetaServiceImpl, bundleId);

    const consumer = scr.getComponent(bundleId, 'consumer.component')?.instance as ConsumerComponent;

    expect(consumer).toBeDefined();
    expect(consumer.activated).toBe(true);
    expect(consumer.alpha?.kind).toBe('alpha');
    expect(consumer.beta?.kind).toBe('beta');
  });

  it('does not re-activate an already-active immediate prototype-scoped component', async () => {
    let activations = 0;

    @Component({ name: 'proto.service', immediate: true })
    @Service({ interfaces: ['ProtoService'] })
    @Scope('prototype')
    class ProtoServiceImpl {
      @Activate
      activate() {
        activations++;
      }
    }

    // A second immediate component whose activation triggers the pending-scan.
    @Component({ name: 'trigger.service', immediate: true })
    @Service({ interfaces: ['TriggerService'] })
    class TriggerServiceImpl {
      @Activate
      activate() {}
    }

    await scr.registerComponent(ProtoServiceImpl, bundleId);
    // Registering/activating another immediate component runs the fixpoint
    // scan; the prototype component must not be activated a second time.
    await scr.registerComponent(TriggerServiceImpl, bundleId);

    const proto = scr.getComponent(bundleId, 'proto.service');
    expect(proto?.serviceRegistration).toBeDefined();
    expect(activations).toBe(0); // prototype scope defers instance creation
  });
});
