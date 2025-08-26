import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useService } from '../../hooks/use-service';
import { PandinoTestUtils } from '../test-utils/pandino-test-utils';
import { cleanupPandinoTest, PandinoTestWrapper, setupPandinoTest } from '../test-utils/test-wrapper';

interface TestService {
  name: string;
  method: () => void;
}

class MockTestService implements TestService {
  name = 'MockService';
  method() {
    return;
  }
}

let pandinoUtils: PandinoTestUtils;

describe('useService', () => {
  beforeEach(async () => {
    pandinoUtils = await setupPandinoTest();
  });

  afterEach(async () => {
    await cleanupPandinoTest(pandinoUtils);
  });

  it('should return loading=false initially', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <PandinoTestWrapper pandinoUtils={pandinoUtils}>{children}</PandinoTestWrapper>
    );

    const { result } = renderHook(() => useService('TestService'), { wrapper });

    expect(result.current.loading).toBe(false);
    expect(result.current.service).toBe(null);
    expect(result.current.error).toBe(null);
  });

  it('should return service=null when service reference is not found', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <PandinoTestWrapper pandinoUtils={pandinoUtils}>{children}</PandinoTestWrapper>
    );

    const { result } = renderHook(() => useService('TestService'), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.service).toBe(null);
    expect(result.current.error).toBe(null);
  });

  it('should return the service when found', async () => {
    const testService = new MockTestService();
    pandinoUtils.registerService('TestService', testService);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <PandinoTestWrapper pandinoUtils={pandinoUtils}>{children}</PandinoTestWrapper>
    );

    const { result } = renderHook(() => useService<TestService>('TestService'), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.service).toBe(testService);
    expect(result.current.error).toBe(null);
  });

  it('should use filter when provided', async () => {
    const testService1 = new MockTestService();
    const testService2 = new MockTestService();
    testService2.name = 'FilteredService';

    pandinoUtils.registerService('TestService', testService1);
    pandinoUtils.registerService('TestService', testService2, { property: 'value' });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <PandinoTestWrapper pandinoUtils={pandinoUtils}>{children}</PandinoTestWrapper>
    );

    const { result } = renderHook(() => useService<TestService>('TestService', '(property=value)'), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.service).toBe(testService2);
    expect(result.current.error).toBe(null);
  });

  it('should handle errors when service throws', async () => {
    const originalGetServiceReference = pandinoUtils.getBundleContext().getServiceReference;

    Object.defineProperty(pandinoUtils.getBundleContext(), 'getServiceReference', {
      value: () => {
        throw new Error('Test error');
      },
      configurable: true,
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <PandinoTestWrapper pandinoUtils={pandinoUtils}>{children}</PandinoTestWrapper>
    );

    const { result } = renderHook(() => useService('TestService'), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.service).toBe(null);
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Test error');

    Object.defineProperty(pandinoUtils.getBundleContext(), 'getServiceReference', {
      value: originalGetServiceReference,
      configurable: true,
    });
  });

  it('should unget the service when dependencies change', async () => {
    const initialService = new MockTestService();
    initialService.name = 'InitialService';

    const newService = new MockTestService();
    newService.name = 'NewService';

    pandinoUtils.registerService('InitialService', initialService);
    pandinoUtils.registerService('NewService', newService);

    const ungetServiceSpy = vi.spyOn(pandinoUtils.getBundleContext(), 'ungetService');

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <PandinoTestWrapper pandinoUtils={pandinoUtils}>{children}</PandinoTestWrapper>
    );

    const { result, rerender } = renderHook((props) => useService(props.serviceClass, props.filter), {
      wrapper,
      initialProps: { serviceClass: 'InitialService', filter: undefined },
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.service).toBe(initialService);

    rerender({ serviceClass: 'NewService', filter: undefined });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.service).toBe(newService);

    expect(ungetServiceSpy).toHaveBeenCalled();
  });

  it('should re-render once when service becomes available (via filter change)', async () => {
    // Register a service that matches property=value
    const svc = new MockTestService();
    pandinoUtils.registerService('TrackedService', svc, { property: 'value' });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <PandinoTestWrapper pandinoUtils={pandinoUtils}>{children}</PandinoTestWrapper>
    );

    let renders = 0;
    const { result, rerender } = renderHook(
      (props: { serviceClass: string; filter?: string }) => {
        renders += 1;
        return useService<TestService>(props.serviceClass, props.filter);
      },
      { wrapper, initialProps: { serviceClass: 'TrackedService', filter: '(property=other)' } },
    );

    // Initially: no match
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.service).toBe(null);
    const rendersAfterInitial = renders;

    // Change filter to match -> expect exactly one additional render
    rerender({ serviceClass: 'TrackedService', filter: '(property=value)' });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.service).toBe(svc);
    expect(renders - rendersAfterInitial).toBe(1);
  });

  it('should re-render once when switching between two matching services (service change)', async () => {
    const svc1 = new MockTestService();
    svc1.name = 'one';
    const svc2 = new MockTestService();
    svc2.name = 'two';

    pandinoUtils.registerService('TrackedService', svc1, { tag: 'one' });
    pandinoUtils.registerService('TrackedService', svc2, { tag: 'two' });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <PandinoTestWrapper pandinoUtils={pandinoUtils}>{children}</PandinoTestWrapper>
    );

    let renders = 0;
    const { result, rerender } = renderHook(
      (props: { serviceClass: string; filter?: string }) => {
        renders += 1;
        return useService<TestService>(props.serviceClass, props.filter);
      },
      { wrapper, initialProps: { serviceClass: 'TrackedService', filter: '(tag=one)' } },
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.service).toBe(svc1);
    const beforeSwitch = renders;

    // Switch filter to the other matching service
    rerender({ serviceClass: 'TrackedService', filter: '(tag=two)' });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.service).toBe(svc2);
    expect(renders - beforeSwitch).toBe(1);
  });

  it('should re-render once when switching to non-matching filter (no capable service)', async () => {
    const svc = new MockTestService();
    pandinoUtils.registerService('TrackedService', svc, { flag: 'yes' });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <PandinoTestWrapper pandinoUtils={pandinoUtils}>{children}</PandinoTestWrapper>
    );

    let renders = 0;
    const { result, rerender } = renderHook(
      (props: { serviceClass: string; filter?: string }) => {
        renders += 1;
        return useService<TestService>(props.serviceClass, props.filter);
      },
      { wrapper, initialProps: { serviceClass: 'TrackedService', filter: '(flag=yes)' } },
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.service).toBe(svc);
    const beforeNonMatch = renders;

    // Now change to a non-matching filter -> expect one render to null
    rerender({ serviceClass: 'TrackedService', filter: '(flag=no)' });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.service).toBe(null);
    expect(renders - beforeNonMatch).toBe(1);
  });

  it('should not re-render for service registrations that do not match serviceClass/filter', async () => {
    const svc = new MockTestService();
    pandinoUtils.registerService('TrackedService', svc, { key: 'main' });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <PandinoTestWrapper pandinoUtils={pandinoUtils}>{children}</PandinoTestWrapper>
    );

    let renders = 0;
    const { result } = renderHook(
      (props: { serviceClass: string; filter?: string }) => {
        renders += 1;
        return useService<TestService>(props.serviceClass, props.filter);
      },
      { wrapper, initialProps: { serviceClass: 'TrackedService', filter: '(key=main)' } },
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.service).toBe(svc);
    const beforeIrrelevant = renders;

    // Register an unrelated service that should not affect our hook (different serviceClass)
    const other = new MockTestService();
    pandinoUtils.registerService('OtherService', other, { key: 'main' });

    // Give a small delay to simulate async environment; hook has no subscription -> no re-render expected
    await new Promise((r) => setTimeout(r, 200));

    expect(renders).toBe(beforeIrrelevant);
  });
});
