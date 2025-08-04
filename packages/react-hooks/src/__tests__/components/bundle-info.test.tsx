import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BundleInfo, bundleStateToString } from '~/components/bundle-info';
import * as useBundleModule from '~/hooks/use-bundle';
import { BUNDLE_STATES } from '@pandino/pandino';

// Mock the useBundle hook
vi.mock('~/hooks/use-bundle', () => ({
  useBundle: vi.fn(),
}));

describe('BundleInfo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('bundleStateToString', () => {
    it('should convert INSTALLED state to string', () => {
      expect(bundleStateToString(BUNDLE_STATES.INSTALLED)).toBe('INSTALLED');
    });

    it('should convert RESOLVED state to string', () => {
      expect(bundleStateToString(BUNDLE_STATES.RESOLVED)).toBe('RESOLVED');
    });

    it('should convert STARTING state to string', () => {
      expect(bundleStateToString(BUNDLE_STATES.STARTING)).toBe('STARTING');
    });

    it('should convert ACTIVE state to string', () => {
      expect(bundleStateToString(BUNDLE_STATES.ACTIVE)).toBe('ACTIVE');
    });

    it('should convert STOPPING state to string', () => {
      expect(bundleStateToString(BUNDLE_STATES.STOPPING)).toBe('STOPPING');
    });

    it('should convert UNINSTALLED state to string', () => {
      expect(bundleStateToString(BUNDLE_STATES.UNINSTALLED)).toBe('UNINSTALLED');
    });

    it('should handle unknown states', () => {
      expect(bundleStateToString(999)).toBe('UNKNOWN (999)');
    });
  });

  describe('default renderer', () => {
    it('should render loading state', () => {
      // Mock the useBundle hook to return loading state
      vi.mocked(useBundleModule.useBundle).mockReturnValue({
        bundle: null,
        loading: true,
        error: null,
      });

      // Render the component
      render(<BundleInfo bundleIdOrName={1} />);

      // Verify that the loading state is rendered
      expect(screen.getByText('Loading bundle information...')).toBeInTheDocument();
    });

    it('should render error state', () => {
      // Mock the useBundle hook to return error state
      const mockError = new Error('Test error');
      vi.mocked(useBundleModule.useBundle).mockReturnValue({
        bundle: null,
        loading: false,
        error: mockError,
      });

      // Render the component
      render(<BundleInfo bundleIdOrName={1} />);

      // Verify that the error state is rendered
      expect(screen.getByText('Error loading bundle: Test error')).toBeInTheDocument();
    });

    it('should render not found state', () => {
      // Mock the useBundle hook to return not found state
      vi.mocked(useBundleModule.useBundle).mockReturnValue({
        bundle: null,
        loading: false,
        error: null,
      });

      // Render the component
      render(<BundleInfo bundleIdOrName={1} />);

      // Verify that the not found state is rendered
      expect(screen.getByText('Bundle not found')).toBeInTheDocument();
    });

    it('should render bundle information', () => {
      // Mock bundle
      const mockBundle = {
        getBundleId: vi.fn().mockReturnValue(1),
        getSymbolicName: vi.fn().mockReturnValue('test-bundle'),
        getVersion: vi.fn().mockReturnValue('1.0.0'),
        getState: vi.fn().mockReturnValue(BUNDLE_STATES.ACTIVE),
        getLocation: vi.fn().mockReturnValue('test-location'),
        start: vi.fn(),
        stop: vi.fn(),
        update: vi.fn(),
        uninstall: vi.fn(),
        getRegisteredServices: vi.fn(),
        getServicesInUse: vi.fn(),
        getHeaders: vi.fn(),
        getContext: vi.fn(),
        getBundleModule: vi.fn(),
        getResource: vi.fn(),
        findResources: vi.fn(),
      };

      // Mock the useBundle hook to return a bundle
      vi.mocked(useBundleModule.useBundle).mockReturnValue({
        bundle: mockBundle,
        loading: false,
        error: null,
      });

      // Render the component
      render(<BundleInfo bundleIdOrName={1} />);

      // Verify that the bundle information is rendered
      expect(screen.getByText('Bundle Information')).toBeInTheDocument();
      expect(screen.getByText('ID:')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('Symbolic Name:')).toBeInTheDocument();
      expect(screen.getByText('test-bundle')).toBeInTheDocument();
      expect(screen.getByText('Version:')).toBeInTheDocument();
      expect(screen.getByText('1.0.0')).toBeInTheDocument();
      expect(screen.getByText('State:')).toBeInTheDocument();
      expect(screen.getByText('ACTIVE')).toBeInTheDocument();
      expect(screen.getByText('Location:')).toBeInTheDocument();
      expect(screen.getByText('test-location')).toBeInTheDocument();
    });
  });

  describe('custom renderer', () => {
    it('should use custom renderer when provided', () => {
      // Mock bundle
      const mockBundle = {
        getBundleId: vi.fn().mockReturnValue(1),
        getSymbolicName: vi.fn().mockReturnValue('test-bundle'),
        getVersion: vi.fn().mockReturnValue('1.0.0'),
        getState: vi.fn().mockReturnValue(BUNDLE_STATES.ACTIVE),
        getLocation: vi.fn().mockReturnValue('test-location'),
        getHeaders: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
        update: vi.fn(),
        uninstall: vi.fn(),
        getRegisteredServices: vi.fn(),
        getServicesInUse: vi.fn(),
        getContext: vi.fn(),
        getBundleModule: vi.fn(),
        getResource: vi.fn(),
        findResources: vi.fn(),
      };

      // Mock the useBundle hook to return a bundle
      vi.mocked(useBundleModule.useBundle).mockReturnValue({
        bundle: mockBundle,
        loading: false,
        error: null,
      });

      // Render the component with a custom renderer
      render(
        <BundleInfo bundleIdOrName={1}>
          {({ bundle, loading, error, stateToString }) => (
            <div>
              {loading && <span data-testid="loading">Loading...</span>}
              {error && <span data-testid="error">{error.message}</span>}
              {bundle && (
                <div data-testid="custom-bundle">
                  <div data-testid="bundle-id">{bundle.getBundleId()}</div>
                  <div data-testid="bundle-state">{stateToString(bundle.getState())}</div>
                </div>
              )}
            </div>
          )}
        </BundleInfo>,
      );

      // Verify that the custom renderer is used
      expect(screen.queryByText('Bundle Information')).not.toBeInTheDocument();
      expect(screen.getByTestId('custom-bundle')).toBeInTheDocument();
      expect(screen.getByTestId('bundle-id').textContent).toBe('1');
      expect(screen.getByTestId('bundle-state').textContent).toBe('ACTIVE');
    });

    it('should pass loading state to custom renderer', () => {
      // Mock the useBundle hook to return loading state
      vi.mocked(useBundleModule.useBundle).mockReturnValue({
        bundle: null,
        loading: true,
        error: null,
      });

      // Render the component with a custom renderer
      render(
        <BundleInfo bundleIdOrName={1}>
          {({ loading }) => <div>{loading && <span data-testid="custom-loading">Custom Loading...</span>}</div>}
        </BundleInfo>,
      );

      // Verify that the custom loading state is rendered
      expect(screen.getByTestId('custom-loading')).toBeInTheDocument();
    });

    it('should pass error state to custom renderer', () => {
      // Mock the useBundle hook to return error state
      const mockError = new Error('Test error');
      vi.mocked(useBundleModule.useBundle).mockReturnValue({
        bundle: null,
        loading: false,
        error: mockError,
      });

      // Render the component with a custom renderer
      render(
        <BundleInfo bundleIdOrName={1}>
          {({ error }) => <div>{error && <span data-testid="custom-error">Custom Error: {error.message}</span>}</div>}
        </BundleInfo>,
      );

      // Verify that the custom error state is rendered
      expect(screen.getByTestId('custom-error')).toBeInTheDocument();
      expect(screen.getByTestId('custom-error').textContent).toBe('Custom Error: Test error');
    });
  });
});
