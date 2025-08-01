import { LogLevel, OSGiBootstrap } from '@pandino/pandino';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PandinoProvider, usePandinoContext } from '~/context';

// Mock the Pandino framework
vi.mock('@pandino/pandino', () => {
  const mockBundle = {
    getBundleId: vi.fn().mockReturnValue(0),
    getSymbolicName: vi.fn().mockReturnValue('system.core-services'),
    getVersion: vi.fn().mockReturnValue('1.0.0'),
    getState: vi.fn().mockReturnValue(32), // ACTIVE
    getHeaders: vi.fn().mockReturnValue({}),
    getLocation: vi.fn().mockReturnValue('system'),
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
    uninstall: vi.fn().mockResolvedValue(undefined),
    getRegisteredServices: vi.fn().mockReturnValue([]),
    getServicesInUse: vi.fn().mockReturnValue([]),
    getContext: vi.fn().mockReturnValue({
      getProperty: vi.fn(),
      getBundle: vi.fn(),
      getBundles: vi.fn(),
      installBundle: vi.fn().mockResolvedValue({}),
      registerService: vi.fn(),
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
    }),
  };

  const mockFramework = {
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue(undefined),
    getBundle: vi.fn().mockReturnValue(mockBundle),
    getBundles: vi.fn().mockReturnValue([mockBundle]),
    getBundleBySymbolicName: vi.fn().mockReturnValue(mockBundle),
    installBundle: vi.fn().mockResolvedValue(mockBundle),
  };

  // Only mock the public methods of OSGiBootstrap
  // Use type assertion to tell TypeScript this is a valid OSGiBootstrap instance
  const mockBootstrap = {
    start: vi.fn().mockResolvedValue(mockFramework),
    stop: vi.fn().mockResolvedValue(undefined),
    getFramework: vi.fn().mockReturnValue(mockFramework),
  } as unknown as OSGiBootstrap;

  return {
    OSGiBootstrap: vi.fn().mockImplementation(() => mockBootstrap),
    OSGiFramework: vi.fn().mockImplementation(() => mockFramework),
    LogLevel: {
      DEBUG: 0,
      INFO: 1,
      WARN: 2,
      ERROR: 3,
    },
    BundleState: {
      INSTALLED: 2,
      RESOLVED: 4,
      STARTING: 8,
      ACTIVE: 32,
      STOPPING: 16,
      UNINSTALLED: 1,
    },
  };
});

// Test component that consumes the context
const TestConsumer = () => {
  const { framework, bundleContext, isInitialized, error } = usePandinoContext();

  return (
    <div>
      <div data-testid="initialized">{isInitialized ? 'true' : 'false'}</div>
      <div data-testid="has-framework">{framework ? 'true' : 'false'}</div>
      <div data-testid="has-context">{bundleContext ? 'true' : 'false'}</div>
      <div data-testid="error">{error ? error.message : 'no-error'}</div>
    </div>
  );
};

describe('PandinoContext', () => {
  afterEach(() => {
    // Clean up any rendered components between tests
    cleanup();
  });

  it('should initialize the framework and provide it to consumers', async () => {
    render(
      <PandinoProvider>
        <TestConsumer />
      </PandinoProvider>,
    );

    // Initially, the framework is not initialized
    expect(screen.getByTestId('initialized').textContent).toBe('false');

    // Wait for the framework to initialize
    await waitFor(() => {
      expect(screen.getByTestId('initialized').textContent).toBe('true');
    });

    // Check that the framework and context are provided
    expect(screen.getByTestId('has-framework').textContent).toBe('true');
    expect(screen.getByTestId('has-context').textContent).toBe('true');
    expect(screen.getByTestId('error').textContent).toBe('no-error');
  });

  it('should handle initialization errors', async () => {
    // Mock the bootstrap to throw an error
    const mockError = new Error('Initialization failed');
    // Only mock the public methods of OSGiBootstrap for the error case
    // Use type assertion to tell TypeScript this is a valid OSGiBootstrap instance
    vi.mocked(OSGiBootstrap).mockImplementationOnce(() => {
      return {
        start: vi.fn().mockRejectedValue(mockError),
        stop: vi.fn().mockResolvedValue(undefined),
        getFramework: vi.fn().mockReturnValue(null),
      } as unknown as OSGiBootstrap;
    });

    render(
      <PandinoProvider>
        <TestConsumer />
      </PandinoProvider>,
    );

    // Wait for the error to be set
    await waitFor(() => {
      expect(screen.getByTestId('error').textContent).toBe('Initialization failed');
    });

    // Check that the framework is not initialized
    expect(screen.getByTestId('initialized').textContent).toBe('false');
    expect(screen.getByTestId('has-framework').textContent).toBe('false');
    expect(screen.getByTestId('has-context').textContent).toBe('false');
  });

  it('should accept bootstrapConfig with frameworkLogLevel', async () => {
    // For this test, we don't need to wait for initialization since we're just testing
    // that the correct config was passed to OSGiBootstrap constructor

    render(
      <PandinoProvider bootstrapConfig={{ frameworkLogLevel: LogLevel.DEBUG }}>
        <TestConsumer />
      </PandinoProvider>,
    );

    // Verify OSGiBootstrap was called with the correct config
    // This should work regardless of initialization state
    expect(vi.mocked(OSGiBootstrap)).toHaveBeenCalledWith({ frameworkLogLevel: LogLevel.DEBUG });
  });

  it('should install and start bundles from promise array', async () => {
    // Create mock bundle modules with proper BundleModule structure
    const mockBundleModule1 = {
      default: {
        headers: {
          bundleSymbolicName: 'test-bundle-1',
          bundleVersion: '1.0.0',
        },
        activator: {
          start: vi.fn().mockResolvedValue(undefined),
          stop: vi.fn().mockResolvedValue(undefined),
        },
      },
      activator: {
        start: vi.fn().mockResolvedValue(undefined),
        stop: vi.fn().mockResolvedValue(undefined),
      },
    };
    const mockBundleModule2 = {
      default: {
        headers: {
          bundleSymbolicName: 'test-bundle-2',
          bundleVersion: '1.0.0',
        },
        activator: {
          start: vi.fn().mockResolvedValue(undefined),
          stop: vi.fn().mockResolvedValue(undefined),
        },
      },
      activator: {
        start: vi.fn().mockResolvedValue(undefined),
        stop: vi.fn().mockResolvedValue(undefined),
      },
    };

    // Create mock bundle promises
    const bundlePromise1 = Promise.resolve(mockBundleModule1);
    const bundlePromise2 = Promise.resolve(mockBundleModule2);

    // Mock installBundle to return a bundle with start method
    const mockInstalledBundle = {
      start: vi.fn().mockResolvedValue(undefined),
    };

    const mockContext = {
      installBundle: vi.fn().mockResolvedValue(mockInstalledBundle),
    };

    const mockBundle = {
      getContext: vi.fn().mockReturnValue(mockContext),
      getSymbolicName: vi.fn().mockReturnValue('system.core-services'),
    };

    const mockFramework = {
      getBundles: vi.fn().mockReturnValue([mockBundle]),
      getBundleBySymbolicName: vi.fn().mockReturnValue(mockBundle),
      stop: vi.fn().mockResolvedValue(undefined),
    };

    // Mock bootstrap to return our custom framework
    vi.mocked(OSGiBootstrap).mockImplementationOnce(
      () =>
        ({
          start: vi.fn().mockResolvedValue(mockFramework),
          stop: vi.fn().mockResolvedValue(undefined),
          getFramework: vi.fn().mockReturnValue(mockFramework),
        }) as unknown as OSGiBootstrap,
    );

    render(
      <PandinoProvider bundles={[bundlePromise1, bundlePromise2]}>
        <TestConsumer />
      </PandinoProvider>,
    );

    // Wait for initialization
    await waitFor(() => {
      expect(screen.getByTestId('initialized').textContent).toBe('true');
    });

    // Verify bundles were installed and started
    expect(mockContext.installBundle).toHaveBeenCalledTimes(2);
    expect(mockContext.installBundle).toHaveBeenCalledWith(bundlePromise1, mockBundleModule1.default);
    expect(mockContext.installBundle).toHaveBeenCalledWith(bundlePromise2, mockBundleModule2.default);
    expect(mockInstalledBundle.start).toHaveBeenCalledTimes(2);
  });
});
