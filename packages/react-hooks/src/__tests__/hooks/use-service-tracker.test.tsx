import { ServiceTracker } from '@pandino/pandino';
import { renderHook, waitFor, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PandinoContext } from '~/context/pandino-context';
import { useServiceTracker } from '~/hooks/use-service-tracker';

// Create mock functions
const mockOpen = vi.fn();
const mockClose = vi.fn();

// Mock the ServiceTracker class
vi.mock('@pandino/pandino', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@pandino/pandino')>();
  return {
    ...actual,
    ServiceTracker: vi.fn(),
  };
});

// Create a typed mock for ServiceTracker
const MockedServiceTracker = ServiceTracker as unknown as ReturnType<typeof vi.fn>;

// Mock the Pandino context
const mockCreateFilter = vi.fn();
const mockUngetService = vi.fn();

const mockBundleContext = {
  createFilter: mockCreateFilter,
  ungetService: mockUngetService,
  // Add other methods that might be used
  getProperty: vi.fn(),
  getBundle: vi.fn(),
  getBundles: vi.fn(),
  installBundle: vi.fn(),
  registerService: vi.fn(),
  getServiceReference: vi.fn(),
  getServiceReferences: vi.fn(),
  getService: vi.fn(),
  addServiceListener: vi.fn(),
  removeServiceListener: vi.fn(),
  addBundleListener: vi.fn(),
  removeBundleListener: vi.fn(),
  getDataFile: vi.fn(),
  getLogService: vi.fn(),
};

// Mock filter
const mockFilter = { toString: () => '(property=value)' };

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

describe('useServiceTracker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOpen.mockClear();
    mockClose.mockClear();
    MockedServiceTracker.mockClear();

    // Set up the default mock implementation
    MockedServiceTracker.mockImplementation(() => ({
      open: vi.fn(),
      close: vi.fn(),
      customizer: undefined,
    }));
  });

  it('should return loading=true initially when context is not initialized', () => {
    const { result } = renderHook(() => useServiceTracker('TestService'), {
      wrapper: ({ children }) => wrapper({ children, isInitialized: false }),
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.services).toEqual([]);
    expect(result.current.error).toBe(null);
  });

  it('should not create tracker when context is not initialized', () => {
    renderHook(() => useServiceTracker('TestService'), {
      wrapper: ({ children }) => wrapper({ children, isInitialized: false }),
    });

    expect(MockedServiceTracker).not.toHaveBeenCalled();
  });

  it('should create tracker with service class when no filter is provided', async () => {
    const { result } = renderHook(() => useServiceTracker('TestService'), { wrapper });

    // Wait for the hook to process
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(MockedServiceTracker).toHaveBeenCalledWith(mockBundleContext, 'TestService', expect.any(Object));

    // Verify that ServiceTracker constructor was called
    expect(MockedServiceTracker).toHaveBeenCalledTimes(1);
  });

  it('should create tracker with filter when filter is provided', async () => {
    mockCreateFilter.mockReturnValue(mockFilter);

    const { result } = renderHook(() => useServiceTracker('TestService', '(property=value)'), { wrapper });

    // Wait for the hook to process
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Check that createFilter was called with the correct filter string
    expect(mockCreateFilter).toHaveBeenCalledWith('(&(objectClass=TestService)(property=value))');

    // Check that the tracker was created with the filter
    expect(MockedServiceTracker).toHaveBeenCalledWith(mockBundleContext, mockFilter, expect.any(Object));

    // Verify that ServiceTracker constructor was called
    expect(MockedServiceTracker).toHaveBeenCalledTimes(1);
  });

  it('should handle errors when creating tracker', async () => {
    const mockError = new Error('Tracker creation error');
    MockedServiceTracker.mockImplementationOnce(() => {
      throw mockError;
    });

    const { result } = renderHook(() => useServiceTracker('TestService'), { wrapper });

    // Wait for the hook to process
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe(mockError);
    expect(result.current.services).toEqual([]);
  });

  it('should close tracker on unmount', async () => {
    const mockCloseInstance = vi.fn();
    MockedServiceTracker.mockImplementationOnce(() => ({
      open: vi.fn(),
      close: mockCloseInstance,
    }));

    const { result, unmount } = renderHook(() => useServiceTracker('TestService'), { wrapper });

    // Wait for the hook to process
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Unmount the component
    unmount();

    expect(mockCloseInstance).toHaveBeenCalled();
  });

  it('should add services when they are tracked', async () => {
    // Create a more realistic mock that properly simulates service tracking
    const mockOpenInstance = vi.fn();
    const mockCloseInstance = vi.fn();
    let capturedCustomizer: any;

    MockedServiceTracker.mockImplementationOnce((_bundleContext: any, _filter: any, customizer: any) => {
      capturedCustomizer = customizer;
      return {
        open: mockOpenInstance.mockImplementation(() => {
          // Simulate the tracker finding and adding services immediately after open
          if (capturedCustomizer?.addingService) {
            const service1 = { id: 1, name: 'Service 1' };
            const service2 = { id: 2, name: 'Service 2' };
            capturedCustomizer.addingService({ id: 'ref1' }, service1);
            capturedCustomizer.addingService({ id: 'ref2' }, service2);
          }
        }),
        close: mockCloseInstance,
      };
    });

    const { result } = renderHook(() => useServiceTracker('TestService'), { wrapper });

    // Wait for the hook to initialize and services to be added
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.services.length).toBe(2);
    });

    // Verify the services were added correctly
    expect(result.current.services).toEqual([
      { id: 1, name: 'Service 1' },
      { id: 2, name: 'Service 2' },
    ]);
  });

  it('should remove services when they are untracked', async () => {
    let capturedCustomizer: any;
    const serviceRef1 = { id: 'ref1' };
    const serviceRef2 = { id: 'ref2' };

    MockedServiceTracker.mockImplementationOnce((_bundleContext: any, _filter: any, customizer: any) => {
      capturedCustomizer = customizer;
      return {
        open: vi.fn().mockImplementation(() => {
          // Add services immediately when opened using consistent references
          if (capturedCustomizer?.addingService) {
            const service1 = { id: 1, name: 'Service 1' };
            const service2 = { id: 2, name: 'Service 2' };
            capturedCustomizer.addingService(serviceRef1, service1);
            capturedCustomizer.addingService(serviceRef2, service2);
          }
        }),
        close: vi.fn(),
      };
    });

    const { result } = renderHook(() => useServiceTracker('TestService'), { wrapper });

    // Wait for initialization and services to be added
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.services.length).toBe(2);
    });

    // Now simulate service removal using the same reference object
    await act(async () => {
      if (capturedCustomizer?.removedService) {
        const service1 = { id: 1, name: 'Service 1' };
        capturedCustomizer.removedService(serviceRef1, service1, service1);
      }
    });

    // Wait for the service to be removed
    await waitFor(() => {
      expect(result.current.services.length).toBe(1);
    });

    // Verify only service 2 remains
    expect(result.current.services).toEqual([{ id: 2, name: 'Service 2' }]);

    // Verify ungetService was called with the correct reference
    expect(mockUngetService).toHaveBeenCalledWith(serviceRef1);
  });

  it('should update services when they are modified', async () => {
    let capturedCustomizer: any;
    const serviceRef1 = { id: 'ref1' };
    const serviceRef2 = { id: 'ref2' };

    MockedServiceTracker.mockImplementationOnce((_bundleContext: any, _filter: any, customizer: any) => {
      capturedCustomizer = customizer;
      return {
        open: vi.fn().mockImplementation(() => {
          // Add services immediately when opened using consistent references
          if (capturedCustomizer?.addingService) {
            const service1 = { id: 1, name: 'Service 1' };
            const service2 = { id: 2, name: 'Service 2' };
            capturedCustomizer.addingService(serviceRef1, service1);
            capturedCustomizer.addingService(serviceRef2, service2);
          }
        }),
        close: vi.fn(),
      };
    });

    const { result } = renderHook(() => useServiceTracker('TestService'), { wrapper });

    // Wait for initialization and services to be added
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.services.length).toBe(2);
    });

    // Now simulate service modification using the same reference object
    await act(async () => {
      if (capturedCustomizer?.modifiedService) {
        const originalService = { id: 1, name: 'Service 1' };
        const modifiedService = { id: 1, name: 'Modified Service 1' };
        capturedCustomizer.modifiedService(serviceRef1, modifiedService, originalService);
      }
    });

    // Wait for the service to be modified
    await waitFor(() => {
      const service1 = result.current.services.find((s) => s.id === 1);
      return service1?.name === 'Modified Service 1';
    });

    // Verify the service was modified (should still be 2 services total)
    expect(result.current.services.length).toBe(2);
    expect(result.current.services).toEqual([
      { id: 1, name: 'Modified Service 1' },
      { id: 2, name: 'Service 2' },
    ]);
  });
});
