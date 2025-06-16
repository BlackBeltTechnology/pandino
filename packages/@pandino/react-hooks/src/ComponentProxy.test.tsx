import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { FC } from 'react';
import { ComponentProxy } from './ComponentProxy';
import { PandinoProvider } from './PandinoContext';
import Pandino from '@pandino/pandino';
import type { BundleActivator, BundleContext, BundleImporter, FrameworkConfigMap, ServiceRegistration } from '@pandino/pandino-api';
import { LOG_LEVEL_PROP, LogLevel, OBJECTCLASS, PANDINO_BUNDLE_IMPORTER_PROP, PANDINO_MANIFEST_FETCHER_PROP } from '@pandino/pandino-api';

// Test components to register as services
const TestExternalComponent: FC<{ title: string; onClick?: () => void; customProp?: string }> = ({ title, onClick, customProp }) => (
  // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
  <div data-testid="external-component" onClick={onClick} data-custom={customProp}>
    {title}
  </div>
);

const ButtonComponent: FC<{ label: string; disabled?: boolean }> = ({ label, disabled }) => (
  <button type="button" data-testid="button-component" disabled={disabled}>
    {label}
  </button>
);

const ComplexComponent: FC<{
  config: { theme: string };
  items: string[];
  onAction?: () => void;
}> = ({ config, items, onAction }) => (
  // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
<div data-testid="complex-component" data-theme={config.theme} onClick={onAction}>
    {items.join(', ')}
  </div>
);

describe('ComponentProxy Component Tests', () => {
  let pandino: Pandino;
  let bundleContext: BundleContext;
  let serviceRegistrations: ServiceRegistration<any>[] = [];
  let params: FrameworkConfigMap;

  const dummyActivator: BundleActivator = {
    start: vi.fn(),
    stop: vi.fn(),
  };

  const importer: BundleImporter = {
    import: (_: string, __: string) =>
      Promise.resolve({
        default: dummyActivator,
      }),
  };

  beforeEach(async () => {
    serviceRegistrations = [];
    params = {
      [PANDINO_MANIFEST_FETCHER_PROP]: vi.fn() as any,
      [PANDINO_BUNDLE_IMPORTER_PROP]: importer,
      [LOG_LEVEL_PROP]: LogLevel.TRACE,
    };
    pandino = new Pandino(params);
    await pandino.init();
    await pandino.start();
    bundleContext = pandino.getBundleContext();
  });

  afterEach(async () => {
    // Unregister all services
    for (const reg of serviceRegistrations) {
      try {
        reg.unregister();
      } catch {
        // Service might already be unregistered
      }
    }
    serviceRegistrations = [];

    // Stop framework
    await pandino.stop();
    cleanup();
  });

  const renderWithPandino = (children: React.ReactNode) => {
    return render(<PandinoProvider ctx={bundleContext}>{children}</PandinoProvider>);
  };

  describe('when external component service is available', () => {
    it('should render the external component when service is registered', async () => {
      // Register the test component as a service
      const registration = bundleContext.registerService('com.example.TestComponent', TestExternalComponent, { 'component.name': 'test-component' });
      serviceRegistrations.push(registration);

      renderWithPandino(
        <ComponentProxy filter="(component.name=test-component)" title="Test Title" customProp="test-value">
          <div data-testid="fallback">Fallback content</div>
        </ComponentProxy>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('external-component')).toBeInTheDocument();
      });

      expect(screen.getByText('Test Title')).toBeInTheDocument();
      expect(screen.getByTestId('external-component')).toHaveAttribute('data-custom', 'test-value');
      expect(screen.queryByTestId('fallback')).not.toBeInTheDocument();
    });

    it('should pass all props except filter and children to the external component', async () => {
      const registration = bundleContext.registerService('com.example.TestComponent', TestExternalComponent, { 'component.type': 'display' });
      serviceRegistrations.push(registration);

      renderWithPandino(
        <ComponentProxy filter="(component.type=display)" title="Dynamic Title" customProp="custom-value" data-test="test-attribute">
          <span>Should not render</span>
        </ComponentProxy>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('external-component')).toBeInTheDocument();
      });

      const component = screen.getByTestId('external-component');
      expect(component).toHaveTextContent('Dynamic Title');
      expect(component).toHaveAttribute('data-custom', 'custom-value');
      expect(component).toHaveAttribute('data-test', 'test-attribute');
    });

    it('should work with different component types', async () => {
      const registration = bundleContext.registerService('com.example.ButtonComponent', ButtonComponent, { 'widget.type': 'button' });
      serviceRegistrations.push(registration);

      renderWithPandino(<ComponentProxy filter="(widget.type=button)" label="Click Me" disabled={true} />);

      await waitFor(() => {
        expect(screen.getByTestId('button-component')).toBeInTheDocument();
      });

      const button = screen.getByTestId('button-component');
      expect(button).toHaveTextContent('Click Me');
      expect(button).toBeDisabled();
    });

    it('should handle complex props correctly', async () => {
      const registration = bundleContext.registerService('com.example.ComplexComponent', ComplexComponent, { 'component.id': 'complex-widget' });
      serviceRegistrations.push(registration);

      const config = { theme: 'dark' };
      const items = ['item1', 'item2', 'item3'];

      renderWithPandino(<ComponentProxy filter="(component.id=complex-widget)" config={config} items={items} />);

      await waitFor(() => {
        expect(screen.getByTestId('complex-component')).toBeInTheDocument();
      });

      const component = screen.getByTestId('complex-component');
      expect(component).toHaveAttribute('data-theme', 'dark');
      expect(component).toHaveTextContent('item1, item2, item3');
    });

    it('should update when service becomes available after initial render', async () => {
      // Initial render with no service
      renderWithPandino(
        <ComponentProxy filter="(dynamic.service=true)" title="Dynamic Component">
          <div data-testid="no-service">No service available</div>
        </ComponentProxy>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('no-service')).toBeInTheDocument();
      });

      // Register service after render
      const registration = bundleContext.registerService('com.example.DynamicService', TestExternalComponent, { 'dynamic.service': 'true' });
      serviceRegistrations.push(registration);

      // The component should automatically update
      await waitFor(() => {
        expect(screen.getByTestId('external-component')).toBeInTheDocument();
      });
      expect(screen.queryByTestId('no-service')).not.toBeInTheDocument();
    });

    it('should handle service unregistration and fall back to children', async () => {
      // Register service first
      const registration = bundleContext.registerService('com.example.TemporaryService', TestExternalComponent, { temporary: 'true' });
      serviceRegistrations.push(registration);

      renderWithPandino(
        <ComponentProxy filter="(temporary=true)" title="Temporary Component">
          <div data-testid="service-gone">Service is gone</div>
        </ComponentProxy>,
      );

      // Should show the external component
      await waitFor(() => {
        expect(screen.getByTestId('external-component')).toBeInTheDocument();
      });

      // Unregister the service
      registration.unregister();
      serviceRegistrations = serviceRegistrations.filter((r) => r !== registration);

      // Should fall back to children
      await waitFor(() => {
        expect(screen.getByTestId('service-gone')).toBeInTheDocument();
      });
      expect(screen.queryByTestId('external-component')).not.toBeInTheDocument();
    });
  });

  describe('when external component service is not available', () => {
    it('should render children when no matching service is found', async () => {
      renderWithPandino(
        <ComponentProxy filter="(nonexistent=true)">
          <div data-testid="fallback-content">
            <h1>No Service Available</h1>
            <p>Please install the required component</p>
          </div>
        </ComponentProxy>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('fallback-content')).toBeInTheDocument();
      });
      expect(screen.getByText('No Service Available')).toBeInTheDocument();
      expect(screen.getByText('Please install the required component')).toBeInTheDocument();
    });

    it('should render multiple children when service is unavailable', async () => {
      renderWithPandino(
        <ComponentProxy filter="(component.missing=true)">
          <div data-testid="fallback-header">Header</div>
          <div data-testid="fallback-body">Body Content</div>
          <div data-testid="fallback-footer">Footer</div>
        </ComponentProxy>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('fallback-header')).toBeInTheDocument();
      });
      expect(screen.getByTestId('fallback-body')).toBeInTheDocument();
      expect(screen.getByTestId('fallback-footer')).toBeInTheDocument();
    });

    it('should render nothing when no children and no service', async () => {
      const { container } = renderWithPandino(<ComponentProxy filter="(missing.service=true)" />);

      // Wait for any potential async updates
      await waitFor(() => {
        expect(container.firstChild).toBeNull();
      });
    });

    it('should handle empty filter gracefully', async () => {
      renderWithPandino(
        <ComponentProxy filter="">
          <div data-testid="empty-filter-fallback">Empty filter fallback</div>
        </ComponentProxy>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('empty-filter-fallback')).toBeInTheDocument();
      });
    });
  });

  describe('filter matching and service selection', () => {
    it('should match services with specific OBJECTCLASS filter', async () => {
      const registration = bundleContext.registerService('specific-service', TestExternalComponent, { version: '1.0' });
      serviceRegistrations.push(registration);

      renderWithPandino(
        <ComponentProxy filter={`(${OBJECTCLASS}=specific-service)`} title="OBJECTCLASS Match">
          <div data-testid="no-objectclass-match">No OBJECTCLASS match</div>
        </ComponentProxy>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('external-component')).toBeInTheDocument();
      });
      expect(screen.getByText('OBJECTCLASS Match')).toBeInTheDocument();
    });

    it('should match services with complex filters', async () => {
      const registration = bundleContext.registerService('com.example.FilterTest', TestExternalComponent, {
        'component.type': 'widget',
        version: '2.1.0',
        enabled: 'true',
      });
      serviceRegistrations.push(registration);

      renderWithPandino(
        <ComponentProxy filter="(&(component.type=widget)(version=2.1.0)(enabled=true))" title="Complex Filter Match">
          <div data-testid="filter-no-match">No filter match</div>
        </ComponentProxy>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('external-component')).toBeInTheDocument();
      });
      expect(screen.getByText('Complex Filter Match')).toBeInTheDocument();
    });

    it('should not match when filter criteria are not met', async () => {
      const registration = bundleContext.registerService('com.example.FilterTest', TestExternalComponent, {
        'component.type': 'widget',
        version: '1.0.0',
        enabled: 'false',
      });
      serviceRegistrations.push(registration);

      renderWithPandino(
        <ComponentProxy filter="(&(component.type=widget)(version=2.0.0)(enabled=true))" title="Should not match">
          <div data-testid="filter-no-match">Filter criteria not met</div>
        </ComponentProxy>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('filter-no-match')).toBeInTheDocument();
      });
      expect(screen.queryByTestId('external-component')).not.toBeInTheDocument();
    });

    it('should handle multiple services and pick the correct one based on filter', async () => {
      // Register two services with different properties
      const reg1 = bundleContext.registerService('com.example.MultiService', TestExternalComponent, { priority: '1', name: 'service-1' });
      const reg2 = bundleContext.registerService('com.example.MultiService', ButtonComponent, { priority: '2', name: 'service-2' });
      serviceRegistrations.push(reg1, reg2);

      // Should pick the first matching service based on filter
      renderWithPandino(
        <ComponentProxy filter="(name=service-1)" title="First Service">
          <div data-testid="no-match">No match</div>
        </ComponentProxy>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('external-component')).toBeInTheDocument();
      });
      expect(screen.queryByTestId('button-component')).not.toBeInTheDocument();
    });
  });

  describe('prop handling edge cases', () => {
    it('should not pass filter and children to external component', async () => {
      const PropsTestComponent: FC<any> = (props) => <div data-testid="props-test">{JSON.stringify(Object.keys(props).sort())}</div>;

      const registration = bundleContext.registerService('com.example.PropsTest', PropsTestComponent, { test: 'props' });
      serviceRegistrations.push(registration);

      renderWithPandino(
        <ComponentProxy filter="(test=props)" title="Test Title" customProp="custom value">
          <span>Child content</span>
        </ComponentProxy>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('props-test')).toBeInTheDocument();
      });

      const component = screen.getByTestId('props-test');
      const receivedProps = JSON.parse(component.textContent || '[]');

      expect(receivedProps).toContain('title');
      expect(receivedProps).toContain('customProp');
      expect(receivedProps).not.toContain('filter');
      expect(receivedProps).not.toContain('children');
    });

    it('should handle function props correctly', async () => {
      const clickHandler = vi.fn();

      const registration = bundleContext.registerService('com.example.ClickTest', TestExternalComponent, { clickable: 'true' });
      serviceRegistrations.push(registration);

      renderWithPandino(<ComponentProxy filter="(clickable=true)" title="Clickable Component" onClick={clickHandler} />);

      await waitFor(() => {
        expect(screen.getByTestId('external-component')).toBeInTheDocument();
      });

      // Test that onClick is passed through
      const component = screen.getByTestId('external-component');
      component.click();
      expect(clickHandler).toHaveBeenCalledTimes(1);
    });
  });
});
