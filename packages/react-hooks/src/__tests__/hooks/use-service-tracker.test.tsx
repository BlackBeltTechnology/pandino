import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PandinoContext } from '../../context/pandino-context';
import { useServiceTracker } from '../../hooks/use-service-tracker';
import { ServiceRegistration } from '@pandino/pandino';
import { PandinoTestUtils } from '../test-utils/pandino-test-utils';
import { cleanupPandinoTest, PandinoTestWrapper, setupPandinoTest } from '../test-utils/test-wrapper';

interface TestService {
  id: number;
  name: string;
}

class TestServiceImpl implements TestService {
  constructor(
    public id: number,
    public name: string,
  ) {}
}

let pandinoUtils: PandinoTestUtils;

describe('useServiceTracker', () => {
  beforeEach(async () => {
    pandinoUtils = await setupPandinoTest();
  });

  afterEach(async () => {
    const assertions: Array<() => void> = [];

    if (pandinoUtils) {
      try {
        // Add any assertions here if needed
      } catch (e) {
        console.error('Error capturing state before cleanup:', e);
      }

      await cleanupPandinoTest(pandinoUtils);
    }

    assertions.forEach((assertion) => assertion());
  });

  it('should return loading=true initially when context is not initialized', () => {
    const nullContextValue = {
      framework: null,
      bundleContext: null,
      isInitialized: false,
      error: null,
    };

    const { result } = renderHook(() => useServiceTracker('TestService'), {
      wrapper: ({ children }) => <PandinoContext.Provider value={nullContextValue}>{children}</PandinoContext.Provider>,
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.services).toEqual([]);
    expect(result.current.error).toBe(null);
  });

  it('should create tracker and return empty services when no services are registered', async () => {
    const { result } = renderHook(() => useServiceTracker<TestService>('TestService'), {
      wrapper: ({ children }) => <PandinoTestWrapper pandinoUtils={pandinoUtils}>{children}</PandinoTestWrapper>,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.services).toEqual([]);
    expect(result.current.error).toBe(null);
  });

  it('should track services with filter when filter is provided (render only on matching registration)', async () => {
    let renders = 0;
    const { result } = renderHook(
      () => {
        renders += 1;
        return useServiceTracker<TestService>('TestService', '(property=value)');
      },
      {
        wrapper: ({ children }) => <PandinoTestWrapper pandinoUtils={pandinoUtils}>{children}</PandinoTestWrapper>,
      },
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.services.length).toBe(0);
    const rendersAfterInitial = renders;

    await act(async () => {
      const testService = new TestServiceImpl(1, 'Service 1');
      pandinoUtils.registerService('TestService', testService, { property: 'value' }); // matching -> should cause 1 render

      const testService2 = new TestServiceImpl(2, 'Service 2');
      pandinoUtils.registerService('TestService', testService2); // non-matching -> should not render
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(result.current.services.length).toBe(1);
    expect(result.current.services[0].id).toBe(1);
    expect(result.current.services[0].name).toBe('Service 1');
    expect(renders - rendersAfterInitial).toBe(1);
  });

  it('should close tracker on unmount', async () => {
    const testService = new TestServiceImpl(1, 'Service 1');
    pandinoUtils.registerService('TestService', testService);

    const { result, unmount } = renderHook(() => useServiceTracker<TestService>('TestService'), {
      wrapper: ({ children }) => <PandinoTestWrapper pandinoUtils={pandinoUtils}>{children}</PandinoTestWrapper>,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.services.length).toBe(1);
    });

    unmount();

    expect(result.current.services.length).toBe(1);
  });

  it('should track services when they are registered (one render per registration)', async () => {
    let renders = 0;
    const { result } = renderHook(
      () => {
        renders += 1;
        return useServiceTracker<TestService>('TestService');
      },
      {
        wrapper: ({ children }) => <PandinoTestWrapper pandinoUtils={pandinoUtils}>{children}</PandinoTestWrapper>,
      },
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.services.length).toBe(0);
    const rendersAfterInitial = renders;

    await act(async () => {
      const service1 = new TestServiceImpl(1, 'Service 1');
      pandinoUtils.registerService('TestService', service1);
    });

    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(renders - rendersAfterInitial).toBe(1);

    await act(async () => {
      const service2 = new TestServiceImpl(2, 'Service 2');
      pandinoUtils.registerService('TestService', service2);
    });

    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(renders - rendersAfterInitial).toBe(2);

    expect(result.current.services.length).toBe(2);

    const serviceIds = result.current.services.map((s) => s.id).sort();
    expect(serviceIds).toEqual([1, 2]);

    const serviceNames = result.current.services.map((s) => s.name).sort();
    expect(serviceNames).toEqual(['Service 1', 'Service 2']);
  });

  it('should remove services when they are unregistered (one render per removal)', async () => {
    const existingRefs = pandinoUtils.getBundleContext().getServiceReferences('TestService');
    if (existingRefs) {
      for (const ref of existingRefs) {
        const reg = ref.getProperty('service.registration');
        if (reg && typeof reg.unregister === 'function') {
          reg.unregister();
        }
      }
    }

    let reg1: ServiceRegistration<TestService> | null = null;
    let reg2: ServiceRegistration<TestService> | null = null;
    await act(async () => {
      const service1 = new TestServiceImpl(1, 'Service 1');
      const service2 = new TestServiceImpl(2, 'Service 2');

      reg1 = pandinoUtils.getBundleContext().registerService('TestService', service1);
      reg2 = pandinoUtils.getBundleContext().registerService('TestService', service2);
    });

    let renders = 0;
    const { result } = renderHook(
      () => {
        renders += 1;
        return useServiceTracker<TestService>('TestService');
      },
      {
        wrapper: ({ children }) => <PandinoTestWrapper pandinoUtils={pandinoUtils}>{children}</PandinoTestWrapper>,
      },
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(result.current.services.length).toBe(2);
    const rendersAfterInitial = renders;

    await act(async () => {
      if (reg1) reg1.unregister();
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(result.current.services.length).toBe(1);
    expect(result.current.services[0].id).toBe(2);
    expect(result.current.services[0].name).toBe('Service 2');
    expect(renders - rendersAfterInitial).toBe(1);

    await act(async () => {
      if (reg2) reg2.unregister();
    });

    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(renders - rendersAfterInitial).toBe(2);
  });

  it('should update tracked services when properties are modified (two renders: remove + add)', async () => {
    const existingRefs = pandinoUtils.getBundleContext().getServiceReferences('TestService');
    if (existingRefs) {
      for (const ref of existingRefs) {
        const reg = ref.getProperty('service.registration');
        if (reg && typeof reg.unregister === 'function') {
          reg.unregister();
        }
      }
    }

    let reg: ServiceRegistration<TestService> | null = null;
    await act(async () => {
      const service1 = new TestServiceImpl(1, 'Service 1');
      reg = pandinoUtils.getBundleContext().registerService('TestService', service1);
    });

    let renders = 0;
    const { result } = renderHook(
      () => {
        renders += 1;
        return useServiceTracker<TestService>('TestService');
      },
      {
        wrapper: ({ children }) => <PandinoTestWrapper pandinoUtils={pandinoUtils}>{children}</PandinoTestWrapper>,
      },
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(result.current.services.length).toBe(1);
    expect(result.current.services[0].name).toBe('Service 1');
    const rendersAfterInitial = renders;

    await act(async () => {
      if (reg) reg.unregister();
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(result.current.services.length).toBe(0);
    expect(renders - rendersAfterInitial).toBe(1);

    await act(async () => {
      const updatedService = new TestServiceImpl(1, 'Modified Service 1');
      reg = pandinoUtils.getBundleContext().registerService('TestService', updatedService);
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(result.current.services.length).toBe(1);
    expect(result.current.services[0].id).toBe(1);
    expect(result.current.services[0].name).toBe('Modified Service 1');
    expect(renders - rendersAfterInitial).toBe(2);

    await act(async () => {
      if (reg) reg.unregister();
    });
  });
});
