import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OSGiFramework } from '~/framework/framework';
import type { Bundle, BundleContext } from '~/framework/interfaces';

describe('BundleContext', () => {
  let framework: OSGiFramework;
  let context: BundleContext;
  let bundle: Bundle;

  beforeEach(async () => {
    framework = new OSGiFramework();
    await framework.start();
    bundle = await framework.installBundle('test://bundle');
    context = (bundle as any).getContext();
  });

  describe('bundle operations', () => {
    it('should return owner bundle', () => {
      expect(context.getBundle()).toBe(bundle);
    });

    it('should get bundle by id', () => {
      const retrieved = context.getBundle(bundle.getBundleId());
      expect(retrieved).toBe(bundle);
    });

    it('should get all bundles', () => {
      const bundles = context.getBundles();
      expect(bundles).toContain(bundle);
      expect(bundles.length).toBeGreaterThanOrEqual(2); // system + test bundle
    });

    it('should install bundle', async () => {
      const newBundle = await context.installBundle('test://new-bundle');
      expect(newBundle.getBundleId()).toBeGreaterThan(0);
      expect(newBundle.getLocation()).toBe('test://new-bundle');
    });
  });

  describe('service operations', () => {
    it('should register service with string interface', () => {
      const service = { method: () => 'test' };
      const registration = context.registerService('TestInterface', service);

      expect(registration).toBeDefined();
      expect(registration.getReference().getProperty('objectClass')).toContain('TestInterface');
    });

    it('should register service with function interface', () => {
      const TestInterface = 'TestInterface';
      interface TestInterfaceType {
        method(): string;
      }
      const service: TestInterfaceType = { method: () => 'test' };
      const registration = context.registerService(TestInterface, service);

      expect(registration).toBeDefined();
    });
    it('should register service with properties', () => {
      const service = { method: () => 'test' };
      const props = { version: '1.0', priority: 10 };
      const registration = context.registerService('TestInterface', service, props);

      const ref = registration.getReference();
      expect(ref.getProperty('version')).toBe('1.0');
      expect(ref.getProperty('priority')).toBe(10);
    });

    it('should get service reference', () => {
      const service = { method: () => 'test' };
      context.registerService('TestInterface', service);

      const ref = context.getServiceReference('TestInterface');
      expect(ref).toBeDefined();
      expect(ref!.getProperty('objectClass')).toContain('TestInterface');
    });

    it('should get multiple service references', () => {
      context.registerService('TestInterface', {}, { version: '1.0' });
      context.registerService('TestInterface', {}, { version: '2.0' });

      const refs = context.getServiceReferences('TestInterface');
      expect(refs).toHaveLength(2);
    });

    it('should filter service references', () => {
      context.registerService('TestInterface', {}, { version: '1.0' });
      context.registerService('TestInterface', {}, { version: '2.0' });

      const refs = context.getServiceReferences('TestInterface', '(version=2.0)');
      expect(refs).toHaveLength(1);
      expect(refs![0].getProperty('version')).toBe('2.0');
    });

    it('should get service from reference', () => {
      const service = { method: () => 'test' };
      const registration = context.registerService('TestInterface', service);

      const retrieved = context.getService(registration.getReference());
      expect(retrieved).toBe(service);
    });

    it('should unget service', () => {
      const service = { method: () => 'test' };
      const registration = context.registerService('TestInterface', service);
      const ref = registration.getReference();

      context.getService(ref);
      const ungot = context.ungetService(ref);
      expect(ungot).toBe(true);
    });
  });

  describe('listeners', () => {
    it('should add and remove service listener', () => {
      const listener = {
        serviceChanged: vi.fn(),
      };

      context.addServiceListener(listener);
      context.registerService('TestInterface', {});
      expect(listener.serviceChanged).toHaveBeenCalled();

      listener.serviceChanged.mockClear();
      context.removeServiceListener(listener);
      context.registerService('AnotherInterface', {});
      expect(listener.serviceChanged).not.toHaveBeenCalled();
    });

    it('should add service listener with filter', () => {
      const listener = {
        serviceChanged: vi.fn(),
      };

      context.addServiceListener(listener, '(version=1.0)');
      context.registerService('TestInterface', {}, { version: '1.0' });
      context.registerService('TestInterface', {}, { version: '2.0' });

      expect(listener.serviceChanged).toHaveBeenCalledTimes(1);
    });

    it('should add and remove bundle listener', async () => {
      const listener = {
        bundleChanged: vi.fn(),
      };

      context.addBundleListener(listener);
      await framework.installBundle('test://listener-test');
      expect(listener.bundleChanged).toHaveBeenCalled();

      listener.bundleChanged.mockClear();
      context.removeBundleListener(listener);
      await framework.installBundle('test://listener-test-2');
      expect(listener.bundleChanged).not.toHaveBeenCalled();
    });
  });

  describe('filter creation', () => {
    it('should create valid filter', () => {
      const filter = context.createFilter('(objectClass=*)');
      expect(filter).toBeDefined();
      expect(filter.toString()).toBe('(objectClass=*)');
    });

    it('should throw for invalid filter', () => {
      expect(() => context.createFilter('invalid')).toThrow();
    });
  });

  describe('properties and data files', () => {
    it('should get framework properties', () => {
      const prop = context.getProperty('org.osgi.framework.version');
      expect(prop).toBeDefined();
    });

    it('should return undefined for non-existent property', () => {
      const prop = context.getProperty('non.existent.property');
      expect(prop).toBeUndefined();
    });

    it('should get data file path', () => {
      const path = context.getDataFile('test.txt');
      expect(typeof path).toBe('string');
      expect(path).toContain('test.txt');
    });
  });
});
