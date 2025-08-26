import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ServiceConsumer } from '../../components/service-consumer';
import * as useServiceModule from '../../hooks/use-service';

// Mock the useService hook
vi.mock('../../hooks/use-service', () => ({
  useService: vi.fn(),
}));

describe('ServiceConsumer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state', () => {
    // Mock the useService hook to return loading state
    vi.mocked(useServiceModule.useService).mockReturnValue({
      service: null,
      loading: true,
      error: null,
    });

    // Render the component with a mock render function
    render(
      <ServiceConsumer<{}> serviceClass="TestService">
        {({ service, loading, error }) => (
          <div>
            {loading && <span data-testid="loading">Loading...</span>}
            {error && <span data-testid="error">{error.message}</span>}
            {service && <span data-testid="service">{JSON.stringify(service)}</span>}
          </div>
        )}
      </ServiceConsumer>,
    );

    // Verify that the loading state is rendered
    expect(screen.getByTestId('loading')).toBeInTheDocument();
    expect(screen.queryByTestId('error')).not.toBeInTheDocument();
    expect(screen.queryByTestId('service')).not.toBeInTheDocument();

    // Verify that useService was called with the correct props
    expect(useServiceModule.useService).toHaveBeenCalledWith('TestService', undefined);
  });

  it('should render error state', () => {
    // Mock the useService hook to return error state
    const mockError = new Error('Test error');
    vi.mocked(useServiceModule.useService).mockReturnValue({
      service: null,
      loading: false,
      error: mockError,
    });

    // Render the component with a mock render function
    render(
      <ServiceConsumer<{}> serviceClass="TestService">
        {({ service, loading, error }) => (
          <div>
            {loading && <span data-testid="loading">Loading...</span>}
            {error && <span data-testid="error">{error.message}</span>}
            {service && <span data-testid="service">{JSON.stringify(service)}</span>}
          </div>
        )}
      </ServiceConsumer>,
    );

    // Verify that the error state is rendered
    expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    expect(screen.getByTestId('error')).toBeInTheDocument();
    expect(screen.getByTestId('error').textContent).toBe('Test error');
    expect(screen.queryByTestId('service')).not.toBeInTheDocument();
  });

  it('should render service when found', () => {
    // Mock the useService hook to return a service
    const mockService = { name: 'TestService', method: vi.fn() };
    vi.mocked(useServiceModule.useService).mockReturnValue({
      service: mockService,
      loading: false,
      error: null,
    });

    // Render the component with a mock render function
    render(
      <ServiceConsumer<{}> serviceClass="TestService">
        {({ service, loading, error }) => (
          <div>
            {loading && <span data-testid="loading">Loading...</span>}
            {error && <span data-testid="error">{error.message}</span>}
            {service && <span data-testid="service">{JSON.stringify(service)}</span>}
          </div>
        )}
      </ServiceConsumer>,
    );

    // Verify that the service is rendered
    expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    expect(screen.queryByTestId('error')).not.toBeInTheDocument();
    expect(screen.getByTestId('service')).toBeInTheDocument();
    expect(screen.getByTestId('service').textContent).toBe(JSON.stringify(mockService));
  });

  it('should pass filter to useService when provided', () => {
    // Mock the useService hook
    vi.mocked(useServiceModule.useService).mockReturnValue({
      service: null,
      loading: true,
      error: null,
    });

    // Render the component with a filter
    render(
      <ServiceConsumer serviceClass="TestService" filter="(property=value)">
        {() => <div />}
      </ServiceConsumer>,
    );

    // Verify that useService was called with the correct props
    expect(useServiceModule.useService).toHaveBeenCalledWith('TestService', '(property=value)');
  });

  it('should render null when service is not found and not loading or error', () => {
    // Mock the useService hook to return no service, not loading, no error
    vi.mocked(useServiceModule.useService).mockReturnValue({
      service: null,
      loading: false,
      error: null,
    });

    // Render the component with a mock render function
    render(
      <ServiceConsumer<{}> serviceClass="TestService">
        {({ service, loading, error }) => (
          <div>
            {loading && <span data-testid="loading">Loading...</span>}
            {error && <span data-testid="error">{error.message}</span>}
            {service && <span data-testid="service">{JSON.stringify(service)}</span>}
            {!loading && !error && !service && <span data-testid="not-found">Service not found</span>}
          </div>
        )}
      </ServiceConsumer>,
    );

    // Verify that the not found state is rendered
    expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    expect(screen.queryByTestId('error')).not.toBeInTheDocument();
    expect(screen.queryByTestId('service')).not.toBeInTheDocument();
    expect(screen.getByTestId('not-found')).toBeInTheDocument();
  });
});
