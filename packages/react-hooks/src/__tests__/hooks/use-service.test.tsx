import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useService } from '~/hooks/use-service';
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
});
