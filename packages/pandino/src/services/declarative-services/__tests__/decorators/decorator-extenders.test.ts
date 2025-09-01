import 'reflect-metadata';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { OSGiBootstrap } from '../../../../framework/bootstrap';
import type { EventAdmin, EventHandler } from '../../../event-admin';
import { Event } from '../../../event-admin';
import { ServiceComponentRuntime } from '../../scr';
import { Component, Service, Activate, Deactivate, Reference } from '@pandino/decorators';
import { getDecoratorInfo } from '../../reflection';

function Feature(meta: any) {
  return function (target: Function) {
    Reflect.defineMetadata('my:feature', meta, target);
  };
}

function FieldFeature(meta: any) {
  return function (target: any, propertyKey: string | symbol) {
    Reflect.defineMetadata('my:field', meta, target, propertyKey);
  };
}

function MethodFeature(meta: any) {
  return function (target: any, propertyKey: string | symbol, _descriptor: PropertyDescriptor) {
    Reflect.defineMetadata('my:method', meta, target, propertyKey);
  };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('Creating Decorator Extenders (Micro-Extenders) - Integration', () => {
  let bootstrap: OSGiBootstrap;

  beforeEach(async () => {
    bootstrap = new OSGiBootstrap();
    await bootstrap.start();
  });

  afterEach(async () => {
    await bootstrap.stop();
  });

  it('should deliver SCR events with DecoratorInfo to EventHandler subscribed to scr/component/*', async () => {
    const framework = bootstrap.getFramework();
    const context = framework.getBundleContext();

    // Register an EventHandler service subscribing to all SCR component events
    const received: { topic: string; event: Event }[] = [];
    const handler: EventHandler = {
      handleEvent: (event: Event) => {
        received.push({ topic: event.getTopic(), event });
      },
    };
    context.registerService('EventHandler', handler, { 'event.topics': 'scr/component/*' });

    const eaRef = context.getServiceReference<EventAdmin>('EventAdmin');
    expect(eaRef).toBeDefined();
    const eventAdmin = context.getService<EventAdmin>(eaRef!);
    expect(eventAdmin).toBeDefined();

    const scr = new ServiceComponentRuntime(framework, context);

    @Feature({ view: 'react', tpl: 'page' })
    @Component({ name: 'custom.decorator.extender.test', immediate: false, configurationPid: 'extender.pid' })
    @Service({ interfaces: ['TestIface'] })
    class ExtenderTestComponent {
      activated = false;
      deactivated = false;

      @Activate
      activate() {
        this.activated = true;
      }

      @Deactivate
      deactivate() {
        this.deactivated = true;
      }
    }

    const bundleId = context.getBundle().getBundleId();

    await scr.registerComponent(ExtenderTestComponent, bundleId);
    await sleep(20); // allow async EventAdmin.postEvent delivery

    const reg = received.find((r) => r.topic === 'scr/component/registered');
    expect(reg).toBeDefined();
    expect(reg!.event.getProperty('bundle.id')).toBe(bundleId);
    expect(reg!.event.getProperty('component.name')).toBe('custom.decorator.extender.test');
    const regDecorators = reg!.event.getProperty('decorators');
    expect(regDecorators).toBeDefined();
    expect(Object.keys(regDecorators)).toEqual(
      expect.arrayContaining([
        'component',
        'service',
        'configuration',
        'lifecycle',
        'references',
        'rawMetadata',
        'customDecorators',
      ]),
    );
    expect(regDecorators.customDecorators['my:feature']).toEqual({ view: 'react', tpl: 'page' });
    // Ensure no design:* keys leaked through
    for (const k of Object.keys(regDecorators.customDecorators)) {
      expect(k.startsWith('design:')).toBe(false);
    }

    // Activate component -> expect activated
    await scr.activateComponent(bundleId, 'custom.decorator.extender.test');
    await sleep(10);

    const act = received.find((r) => r.topic === 'scr/component/activated');
    expect(act).toBeDefined();
    const actDecorators = act!.event.getProperty('decorators');
    expect(actDecorators.customDecorators['my:feature']).toEqual({ view: 'react', tpl: 'page' });

    // Update configuration -> expect config-updated
    await scr.updateComponentConfiguration(bundleId, 'custom.decorator.extender.test', { foo: 'bar' });
    await sleep(10);
    const cfg = received.find((r) => r.topic === 'scr/component/config-updated');
    expect(cfg).toBeDefined();
    expect(cfg!.event.getProperty('configuration')).toEqual({ foo: 'bar' });
    const cfgDecorators = cfg!.event.getProperty('decorators');
    expect(cfgDecorators.customDecorators['my:feature']).toEqual({ view: 'react', tpl: 'page' });

    // Deactivate -> expect deactivated
    await scr.deactivateComponent(bundleId, 'custom.decorator.extender.test');
    await sleep(10);
    const deact = received.find((r) => r.topic === 'scr/component/deactivated');
    expect(deact).toBeDefined();

    // Remove -> expect removed
    await scr.removeBundleComponents(bundleId);
    await sleep(10);
    const rem = received.find((r) => r.topic === 'scr/component/removed');
    expect(rem).toBeDefined();
  });

  it('getDecoratorInfo should expose customDecorators including custom keys and exclude design:*', () => {
    @Feature({ view: 'react', tpl: 'page' })
    @Component({ name: 'page.component' })
    class PageComponent {}

    const info = getDecoratorInfo(PageComponent);
    expect(info).toBeDefined();
    // Verify structure keys
    expect(Object.keys(info)).toEqual(
      expect.arrayContaining([
        'component',
        'service',
        'configuration',
        'lifecycle',
        'references',
        'rawMetadata',
        'customDecorators',
      ]),
    );

    // Verify custom metadata inclusion
    expect(info.customDecorators['my:feature']).toEqual({ view: 'react', tpl: 'page' });

    // Ensure TS design:* metadata and internal keys are not present in customDecorators
    for (const k of Object.keys(info.customDecorators)) {
      expect(k.startsWith('design:')).toBe(false);
    }
  });

  it('should expose customFieldDecorators and customMethodDecorators via getDecoratorInfo', async () => {
    @Component({ name: 'field.method.component' })
    @Service({ interfaces: ['Dummy'] })
    class FieldMethodComponent {
      @Reference({ interface: 'LogService' })
      @FieldFeature({ role: 'logger' })
      private logger?: any;

      @MethodFeature({ role: 'op' })
      doWork() {}

      @Activate
      activate() {}
    }

    const info = getDecoratorInfo(FieldMethodComponent);
    expect(info.customFieldDecorators).toBeDefined();
    expect(info.customMethodDecorators).toBeDefined();

    expect(info.customFieldDecorators['logger']).toBeDefined();
    expect(info.customFieldDecorators['logger']['my:field']).toEqual({ role: 'logger' });

    expect(info.customMethodDecorators['doWork']).toBeDefined();
    expect(info.customMethodDecorators['doWork']['my:method']).toEqual({ role: 'op' });
  });

  it('should include customFieldDecorators and customMethodDecorators in SCR events', async () => {
    const framework = bootstrap.getFramework();
    const context = framework.getBundleContext();

    const received: { topic: string; event: Event }[] = [];
    const handler: EventHandler = {
      handleEvent: (event: Event) => {
        received.push({ topic: event.getTopic(), event });
      },
    };
    context.registerService('EventHandler', handler, { 'event.topics': 'scr/component/*' });

    const eaRef = context.getServiceReference<EventAdmin>('EventAdmin');
    expect(eaRef).toBeDefined();
    const eventAdmin = context.getService<EventAdmin>(eaRef!);
    expect(eventAdmin).toBeDefined();

    const scr = new ServiceComponentRuntime(framework, context);

    @Component({ name: 'field.method.events.component' })
    class FieldMethodEventsComponent {
      @Reference({ interface: 'LogService' })
      @FieldFeature({ role: 'logger' })
      private logger?: any;

      @MethodFeature({ role: 'op' })
      doWork() {}

      @Activate
      activate() {}
    }

    const bundleId = context.getBundle().getBundleId();
    await scr.registerComponent(FieldMethodEventsComponent, bundleId);

    // allow asynchronous EventAdmin delivery
    await new Promise((r) => setTimeout(r, 20));

    const reg = received.find((r) => r.topic === 'scr/component/registered');
    expect(reg).toBeDefined();
    const decorators = reg!.event.getProperty('decorators');
    expect(decorators).toBeDefined();

    expect(decorators.customFieldDecorators['logger']).toBeDefined();
    expect(decorators.customFieldDecorators['logger']['my:field']).toEqual({ role: 'logger' });

    expect(decorators.customMethodDecorators['doWork']).toBeDefined();
    expect(decorators.customMethodDecorators['doWork']['my:method']).toEqual({ role: 'op' });
  });
});
