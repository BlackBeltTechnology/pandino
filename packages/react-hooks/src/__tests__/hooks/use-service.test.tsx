import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useService } from '~/hooks/use-service';
import { PandinoContext } from '~/context/pandino-context';
import React, { ReactNode } from 'react';

// Mock the Pandino context
const mockGetServiceReference = vi.fn();
const mockGetServiceReferences = vi.fn();
const mockGetService = vi.fn();
const mockUngetService = vi.fn();

const mockBundleContext = {
  getServiceReference: mockGetServiceReference,
  getServiceReferences: mockGetServiceReferences,
  getService: mockGetService,
  ungetService: mockUngetService,
  // Add other methods that might be used
  getProperty: vi.fn(),
  getBundle: vi.fn(),
  getBundles: vi.fn(),
  installBundle: vi.fn(),
  registerService: vi.fn(),
  addServiceListener: vi.fn(),
  removeServiceListener: vi.fn(),
  addBundleListener: vi.fn(),
  removeBundleListener: vi.fn(),
  createFilter: vi.fn(),
  getDataFile: vi.fn(),
  getLogService: vi.fn(),
};

// Mock service reference
const mockServiceReference = { id: 'mock-service-reference' };

// Mock service
const mockService = { name: 'MockService', method: vi.fn() };

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

describe('useService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return loading=true initially', () => {
    const { result } = renderHook(() => useService('TestService'), { wrapper });

    expect(result.current.loading).toBe(true);
    expect(result.current.service).toBe(null);
    expect(result.current.error).toBe(null);
  });

  it('should return service=null when context is not initialized', async () => {
    const { result } = renderHook(() => useService('TestService'), {
      wrapper: ({ children }) => wrapper({ children, isInitialized: false }),
    });

    // Wait for the hook to process
    await waitFor(() => {
      expect(result.current.loading).toBe(true);
    });

    expect(result.current.service).toBe(null);
    expect(result.current.error).toBe(null);
    expect(mockGetServiceReference).not.toHaveBeenCalled();
  });

  it('should return service=null when service reference is not found', async () => {
    mockGetServiceReference.mockReturnValue(null);

    const { result } = renderHook(() => useService('TestService'), { wrapper });

    // Wait for the hook to process
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.service).toBe(null);
    expect(result.current.error).toBe(null);
    expect(mockGetServiceReference).toHaveBeenCalledWith('TestService');
    expect(mockGetService).not.toHaveBeenCalled();
  });

  it('should return the service when found', async () => {
    mockGetServiceReference.mockReturnValue(mockServiceReference);
    mockGetService.mockReturnValue(mockService);

    const { result } = renderHook(() => useService('TestService'), { wrapper });

    // Wait for the hook to process
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.service).toBe(mockService);
    expect(result.current.error).toBe(null);
    expect(mockGetServiceReference).toHaveBeenCalledWith('TestService');
    expect(mockGetService).toHaveBeenCalledWith(mockServiceReference);
  });

  it('should use filter when provided', async () => {
    const mockFilteredServiceReference = { id: 'mock-filtered-service-reference' };
    mockGetServiceReferences.mockReturnValue([mockFilteredServiceReference]);
    mockGetService.mockReturnValue(mockService);

    const { result } = renderHook(() => useService('TestService', '(property=value)'), { wrapper });

    // Wait for the hook to process
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.service).toBe(mockService);
    expect(result.current.error).toBe(null);
    expect(mockGetServiceReferences).toHaveBeenCalledWith('TestService', '(property=value)');
    expect(mockGetService).toHaveBeenCalledWith(mockFilteredServiceReference);
  });

  it('should handle errors', async () => {
    const mockError = new Error('Test error');
    mockGetServiceReference.mockImplementation(() => {
      throw mockError;
    });

    const { result } = renderHook(() => useService('TestService'), { wrapper });

    // Wait for the hook to process
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.service).toBe(null);
    expect(result.current.error).toBe(mockError);
  });

  it('should unget the service on unmount', async () => {
    mockGetServiceReference.mockReturnValue(mockServiceReference);
    mockGetService.mockReturnValue(mockService);

    const { result, unmount } = renderHook(() => useService('TestService'), { wrapper });

    // Wait for the hook to process
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Unmount the component
    unmount();

    expect(mockUngetService).toHaveBeenCalledWith(mockServiceReference);
  });
});
