import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useRegisterService } from '~/hooks/use-register-service';
import { PandinoContext } from '~/context/pandino-context';
import React, { ReactNode } from 'react';

// Mock the Pandino context
const mockRegisterService = vi.fn();

const mockBundleContext = {
  registerService: mockRegisterService,
  // Add other methods that might be used
  getProperty: vi.fn(),
  getBundle: vi.fn(),
  getBundles: vi.fn(),
  installBundle: vi.fn(),
  getServiceReference: vi.fn(),
  getServiceReferences: vi.fn(),
  getService: vi.fn(),
  ungetService: vi.fn(),
  addServiceListener: vi.fn(),
  removeServiceListener: vi.fn(),
  addBundleListener: vi.fn(),
  removeBundleListener: vi.fn(),
  createFilter: vi.fn(),
  getDataFile: vi.fn(),
  getLogService: vi.fn(),
};

// Mock service registration
const mockSetProperties = vi.fn();
const mockUnregister = vi.fn();
const mockServiceRegistration = {
  getReference: vi.fn(),
  setProperties: mockSetProperties,
  unregister: mockUnregister,
};

// Mock service implementation
const mockServiceImpl = { name: 'MockService', method: vi.fn() };

// Wrapper component with mock context
const wrapper = ({ children, isInitialized = true }: { children: ReactNode; isInitialized?: boolean }) => (
  <PandinoContext.Provider
    value={{
      framework: null,
      bundleContext: isInitialized ? mockBundleContext : null,
      isInitialized,
      error: null,
    }}
  >
    {children}
  </PandinoContext.Provider>
);

describe('useRegisterService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not register service when context is not initialized', () => {
    const { result } = renderHook(() => useRegisterService('TestService', mockServiceImpl), {
      wrapper: ({ children }) => wrapper({ children, isInitialized: false }),
    });

    expect(result.current.isRegistered).toBe(false);
    expect(result.current.registration).toBe(null);
    expect(result.current.error).toBe(null);
    expect(mockRegisterService).not.toHaveBeenCalled();
  });

  it('should register service when context is initialized', async () => {
    mockRegisterService.mockReturnValue(mockServiceRegistration);

    const { result } = renderHook(() => useRegisterService('TestService', mockServiceImpl), { wrapper });

    // Wait for the hook to process
    await waitFor(() => {
      expect(result.current.isRegistered).toBe(true);
    });

    expect(result.current.registration).toBe(mockServiceRegistration);
    expect(result.current.error).toBe(null);
    expect(mockRegisterService).toHaveBeenCalledWith('TestService', mockServiceImpl, {});
  });

  it('should register service with properties', async () => {
    mockRegisterService.mockReturnValue(mockServiceRegistration);

    const mockProperties = { prop1: 'value1', prop2: 'value2' };
    const { result } = renderHook(() => useRegisterService('TestService', mockServiceImpl, mockProperties), {
      wrapper,
    });

    // Wait for the hook to process
    await waitFor(() => {
      expect(result.current.isRegistered).toBe(true);
    });

    expect(result.current.registration).toBe(mockServiceRegistration);
    expect(result.current.error).toBe(null);
    expect(mockRegisterService).toHaveBeenCalledWith('TestService', mockServiceImpl, mockProperties);
  });

  it('should handle registration errors', async () => {
    const mockError = new Error('Registration error');
    mockRegisterService.mockImplementation(() => {
      throw mockError;
    });

    const { result } = renderHook(() => useRegisterService('TestService', mockServiceImpl), { wrapper });

    // Wait for the hook to process
    await waitFor(() => {
      expect(result.current.error).toBe(mockError);
    });

    expect(result.current.isRegistered).toBe(false);
    expect(result.current.registration).toBe(null);
  });

  it('should update properties', async () => {
    mockRegisterService.mockReturnValue(mockServiceRegistration);

    const { result } = renderHook(() => useRegisterService('TestService', mockServiceImpl), { wrapper });

    // Wait for the hook to process
    await waitFor(() => {
      expect(result.current.isRegistered).toBe(true);
    });

    // Update properties
    const newProperties = { prop1: 'newValue1', prop2: 'newValue2' };
    act(() => {
      result.current.updateProperties(newProperties);
    });

    expect(mockSetProperties).toHaveBeenCalledWith(newProperties);
  });

  it('should handle errors when updating properties', async () => {
    mockRegisterService.mockReturnValue(mockServiceRegistration);
    const mockError = new Error('Update properties error');
    mockSetProperties.mockImplementation(() => {
      throw mockError;
    });

    const { result } = renderHook(() => useRegisterService('TestService', mockServiceImpl), { wrapper });

    // Wait for the hook to process
    await waitFor(() => {
      expect(result.current.isRegistered).toBe(true);
    });

    // Update properties
    act(() => {
      result.current.updateProperties({ prop: 'value' });
    });

    expect(result.current.error).toBe(mockError);
  });

  it('should unregister service on unmount', async () => {
    mockRegisterService.mockReturnValue(mockServiceRegistration);

    const { result, unmount } = renderHook(() => useRegisterService('TestService', mockServiceImpl), { wrapper });

    // Wait for the hook to process
    await waitFor(() => {
      expect(result.current.isRegistered).toBe(true);
    });

    // Unmount the component
    unmount();

    expect(mockUnregister).toHaveBeenCalled();
  });

  it('should handle errors when unregistering service', async () => {
    mockRegisterService.mockReturnValue(mockServiceRegistration);
    const mockError = new Error('Unregister error');
    mockUnregister.mockImplementation(() => {
      throw mockError;
    });

    // Spy on console.error
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result, unmount } = renderHook(() => useRegisterService('TestService', mockServiceImpl), { wrapper });

    // Wait for the hook to process
    await waitFor(() => {
      expect(result.current.isRegistered).toBe(true);
    });

    // Unmount the component
    unmount();

    expect(mockUnregister).toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error unregistering service:', mockError);

    // Restore console.error
    consoleErrorSpy.mockRestore();
  });
});
