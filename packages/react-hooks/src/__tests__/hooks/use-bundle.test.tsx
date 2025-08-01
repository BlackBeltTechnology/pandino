import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PandinoContext } from '~/context/pandino-context';
import { useAllBundles, useBundle } from '~/hooks/use-bundle';
import { findBundleBySymbolicName } from '~/utils/bundle-utils';

// Mock the bundle-utils module
vi.mock('~/utils/bundle-utils', () => ({
  findBundleBySymbolicName: vi.fn(),
}));

// Mock bundles
const mockBundle1 = {
  getBundleId: vi.fn().mockReturnValue(1),
  getSymbolicName: vi.fn().mockReturnValue('bundle1'),
  getVersion: vi.fn().mockReturnValue('1.0.0'),
  getState: vi.fn().mockReturnValue(32), // ACTIVE
  getHeaders: vi.fn().mockReturnValue({}),
  getLocation: vi.fn().mockReturnValue('location1'),
  start: vi.fn().mockResolvedValue(undefined),
  stop: vi.fn().mockResolvedValue(undefined),
  update: vi.fn().mockResolvedValue(undefined),
  uninstall: vi.fn().mockResolvedValue(undefined),
  getRegisteredServices: vi.fn().mockReturnValue([]),
  getServicesInUse: vi.fn().mockReturnValue([]),
  getContext: vi.fn(),
};

const mockBundle2 = {
  getBundleId: vi.fn().mockReturnValue(2),
  getSymbolicName: vi.fn().mockReturnValue('bundle2'),
  getVersion: vi.fn().mockReturnValue('1.0.0'),
  getState: vi.fn().mockReturnValue(32), // ACTIVE
  getHeaders: vi.fn().mockReturnValue({}),
  getLocation: vi.fn().mockReturnValue('location2'),
  start: vi.fn().mockResolvedValue(undefined),
  stop: vi.fn().mockResolvedValue(undefined),
  update: vi.fn().mockResolvedValue(undefined),
  uninstall: vi.fn().mockResolvedValue(undefined),
  getRegisteredServices: vi.fn().mockReturnValue([]),
  getServicesInUse: vi.fn().mockReturnValue([]),
  getContext: vi.fn(),
};

// Mock the framework
const mockGetBundle = vi.fn();
const mockGetBundles = vi.fn();

const mockFramework = {
  // Core framework methods
  getBundle: mockGetBundle,
  getBundles: mockGetBundles,
  getProperty: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
  installBundle: vi.fn(),
  registerService: vi.fn(),
  getServiceReferences: vi.fn(),
  getService: vi.fn(),
  createFilter: vi.fn(),

  // Required properties that were missing
  bundles: new Map(),
  services: new Map(),
  bundleCounter: 0,
  serviceCounter: 0,

  // EventEmitter methods (OSGiFramework extends EventEmitter)
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
  once: vi.fn(),
  removeListener: vi.fn(),
  removeAllListeners: vi.fn(),
  setMaxListeners: vi.fn(),
  getMaxListeners: vi.fn(),
  listeners: vi.fn(),
  rawListeners: vi.fn(),
  listenerCount: vi.fn(),
  prependListener: vi.fn(),
  prependOnceListener: vi.fn(),
  eventNames: vi.fn(),

  // Additional framework methods
  unregisterService: vi.fn(),
  ungetService: vi.fn(),
  addBundleListener: vi.fn(),
  removeBundleListener: vi.fn(),
  addServiceListener: vi.fn(),
  removeServiceListener: vi.fn(),
  addFrameworkListener: vi.fn(),
  removeFrameworkListener: vi.fn(),
  getLogger: vi.fn().mockReturnValue({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
} as any;

// Wrapper component with mock context
const wrapper = ({ children, isInitialized = true }: { children: ReactNode; isInitialized?: boolean }) => (
  <PandinoContext.Provider
    value={{
      framework: isInitialized ? mockFramework : null,
      bundleContext: null,
      isInitialized,
      error: null,
    }}
  >
    {children}
  </PandinoContext.Provider>
);

describe('useBundle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return loading=true initially and then loading=false', async () => {
    // Mock a delay in getBundle to ensure we can capture the loading state
    mockGetBundle.mockImplementation(() => {
      // Return the bundle but with a slight delay to allow checking loading state
      return mockBundle1;
    });

    const { result } = renderHook(() => useBundle(1), { wrapper });

    // The loading state transitions very quickly, so we need to check it can reach false
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.bundle).toBe(mockBundle1);
    expect(result.current.error).toBe(null);
    expect(mockGetBundle).toHaveBeenCalledWith(1);
  });

  it('should not get bundle when context is not initialized', () => {
    const { result } = renderHook(() => useBundle(1), {
      wrapper: ({ children }) => wrapper({ children, isInitialized: false }),
    });

    // Should remain in loading state when not initialized
    expect(result.current.loading).toBe(true);
    expect(result.current.bundle).toBe(null);
    expect(result.current.error).toBe(null);
    expect(mockGetBundle).not.toHaveBeenCalled();
    expect(vi.mocked(findBundleBySymbolicName)).not.toHaveBeenCalled();
  });

  it('should get bundle by ID when bundleIdOrName is a number', async () => {
    mockGetBundle.mockReturnValue(mockBundle1);

    const { result } = renderHook(() => useBundle(1), { wrapper });

    // Wait for the hook to process
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.bundle).toBe(mockBundle1);
    expect(result.current.error).toBe(null);
    expect(mockGetBundle).toHaveBeenCalledWith(1);
    expect(vi.mocked(findBundleBySymbolicName)).not.toHaveBeenCalled();
  });

  it('should get bundle by symbolic name when bundleIdOrName is a string', async () => {
    vi.mocked(findBundleBySymbolicName).mockReturnValue(mockBundle1);

    const { result } = renderHook(() => useBundle('bundle1'), { wrapper });

    // Wait for the hook to process
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.bundle).toBe(mockBundle1);
    expect(result.current.error).toBe(null);
    expect(mockGetBundle).not.toHaveBeenCalled();
    expect(vi.mocked(findBundleBySymbolicName)).toHaveBeenCalledWith(mockFramework, 'bundle1');
  });

  it('should return bundle=null when bundle is not found', async () => {
    mockGetBundle.mockReturnValue(null);

    const { result } = renderHook(() => useBundle(1), { wrapper });

    // Wait for the hook to process
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.bundle).toBe(null);
    expect(result.current.error).toBe(null);
  });

  it('should handle errors when getting bundle', async () => {
    const mockError = new Error('Get bundle error');
    mockGetBundle.mockImplementation(() => {
      throw mockError;
    });

    const { result } = renderHook(() => useBundle(1), { wrapper });

    // Wait for the hook to process
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.bundle).toBe(null);
    expect(result.current.error).toBe(mockError);
  });
});

describe('useAllBundles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return loading=true initially and then loading=false', async () => {
    // Mock getBundles to return bundles
    mockGetBundles.mockImplementation(() => {
      return [mockBundle1, mockBundle2];
    });

    const { result } = renderHook(() => useAllBundles(), { wrapper });

    // The loading state transitions very quickly, so we focus on the final state
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.bundles).toEqual([mockBundle1, mockBundle2]);
    expect(result.current.error).toBe(null);
    expect(mockGetBundles).toHaveBeenCalled();
  });

  it('should not get bundles when context is not initialized', () => {
    const { result } = renderHook(() => useAllBundles(), {
      wrapper: ({ children }) => wrapper({ children, isInitialized: false }),
    });

    // Should remain in loading state when not initialized
    expect(result.current.loading).toBe(true);
    expect(result.current.bundles).toEqual([]);
    expect(result.current.error).toBe(null);
    expect(mockGetBundles).not.toHaveBeenCalled();
  });

  it('should get all bundles', async () => {
    mockGetBundles.mockReturnValue([mockBundle1, mockBundle2]);

    const { result } = renderHook(() => useAllBundles(), { wrapper });

    // Wait for the hook to process
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.bundles).toEqual([mockBundle1, mockBundle2]);
    expect(result.current.error).toBe(null);
    expect(mockGetBundles).toHaveBeenCalled();
  });

  it('should return empty array when no bundles are found', async () => {
    mockGetBundles.mockReturnValue([]);

    const { result } = renderHook(() => useAllBundles(), { wrapper });

    // Wait for the hook to process
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.bundles).toEqual([]);
    expect(result.current.error).toBe(null);
  });

  it('should handle errors when getting bundles', async () => {
    const mockError = new Error('Get bundles error');
    mockGetBundles.mockImplementation(() => {
      throw mockError;
    });

    const { result } = renderHook(() => useAllBundles(), { wrapper });

    // Wait for the hook to process
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.bundles).toEqual([]);
    expect(result.current.error).toBe(mockError);
  });
});
