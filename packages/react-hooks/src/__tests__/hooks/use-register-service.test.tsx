import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PandinoContext } from '../../context/pandino-context';
import { useRegisterService } from '../../hooks/use-register-service';
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

describe('useRegisterService', () => {
  beforeEach(async () => {
    pandinoUtils = await setupPandinoTest();
  });

  afterEach(async () => {
    await cleanupPandinoTest(pandinoUtils);
  });

  it('should not register service when context is not initialized', () => {
    const nullContextValue = {
      framework: null,
      bundleContext: null,
      isInitialized: false,
      error: null,
    };

    const testService = new MockTestService();

    const { result } = renderHook(() => useRegisterService('TestService', testService), {
      wrapper: ({ children }) => <PandinoContext.Provider value={nullContextValue}>{children}</PandinoContext.Provider>,
    });

    expect(result.current.isRegistered).toBe(false);
    expect(result.current.registration).toBe(null);
    expect(result.current.error).toBe(null);
  });

  it('should register service when context is initialized', async () => {
    const testService = new MockTestService();

    const { result } = renderHook(() => useRegisterService('TestService', testService), {
      wrapper: ({ children }) => <PandinoTestWrapper pandinoUtils={pandinoUtils}>{children}</PandinoTestWrapper>,
    });

    await waitFor(() => {
      expect(result.current.isRegistered).toBe(true);
    });

    expect(result.current.registration).not.toBe(null);
    expect(result.current.error).toBe(null);

    const serviceRef = pandinoUtils.getBundleContext().getServiceReference('TestService');
    expect(serviceRef).not.toBe(null);

    const service = pandinoUtils.getBundleContext().getService(serviceRef!);
    expect(service).toBe(testService);
  });

  it('should register service with properties', async () => {
    const testService = new MockTestService();
    const mockProperties = { prop1: 'value1', prop2: 'value2' };

    const { result } = renderHook(() => useRegisterService('TestService', testService, mockProperties), {
      wrapper: ({ children }) => <PandinoTestWrapper pandinoUtils={pandinoUtils}>{children}</PandinoTestWrapper>,
    });

    await waitFor(() => {
      expect(result.current.isRegistered).toBe(true);
    });

    expect(result.current.registration).not.toBe(null);
    expect(result.current.error).toBe(null);

    const serviceRef = pandinoUtils.getBundleContext().getServiceReference('TestService');
    expect(serviceRef).not.toBe(null);
    expect(serviceRef!.getProperty('prop1')).toBe('value1');
    expect(serviceRef!.getProperty('prop2')).toBe('value2');
  });

  it('should handle registration errors', async () => {
    const originalRegisterService = pandinoUtils.getBundleContext().registerService;
    const mockError = new Error('Registration error');

    Object.defineProperty(pandinoUtils.getBundleContext(), 'registerService', {
      value: () => {
        throw mockError;
      },
      configurable: true,
    });

    const testService = new MockTestService();

    const { result } = renderHook(() => useRegisterService('TestService', testService), {
      wrapper: ({ children }) => <PandinoTestWrapper pandinoUtils={pandinoUtils}>{children}</PandinoTestWrapper>,
    });

    await waitFor(() => {
      expect(result.current.error).toBe(mockError);
    });

    expect(result.current.isRegistered).toBe(false);
    expect(result.current.registration).toBe(null);

    Object.defineProperty(pandinoUtils.getBundleContext(), 'registerService', {
      value: originalRegisterService,
      configurable: true,
    });
  });

  it('should update properties', async () => {
    const testService = new MockTestService();

    const { result } = renderHook(() => useRegisterService('TestService', testService), {
      wrapper: ({ children }) => <PandinoTestWrapper pandinoUtils={pandinoUtils}>{children}</PandinoTestWrapper>,
    });

    await waitFor(() => {
      expect(result.current.isRegistered).toBe(true);
    });

    expect(result.current.registration).not.toBe(null);

    const newProperties = { prop1: 'newValue1', prop2: 'newValue2' };
    act(() => {
      result.current.updateProperties(newProperties);
    });

    const registration = result.current.registration;
    expect(registration).not.toBe(null);

    const serviceRef = registration!.getReference();
    expect(serviceRef.getProperty('prop1')).toBe('newValue1');
    expect(serviceRef.getProperty('prop2')).toBe('newValue2');
  });

  it('should unregister service on unmount', async () => {
    const testService = new MockTestService();

    const { result, unmount } = renderHook(() => useRegisterService('TestService', testService), {
      wrapper: ({ children }) => <PandinoTestWrapper pandinoUtils={pandinoUtils}>{children}</PandinoTestWrapper>,
    });

    await waitFor(() => {
      expect(result.current.isRegistered).toBe(true);
    });

    let serviceRef = pandinoUtils.getBundleContext().getServiceReference('TestService');
    expect(serviceRef).not.toBe(null);

    unmount();

    serviceRef = pandinoUtils.getBundleContext().getServiceReference('TestService');
    expect(serviceRef).toBe(null);
  });
});
