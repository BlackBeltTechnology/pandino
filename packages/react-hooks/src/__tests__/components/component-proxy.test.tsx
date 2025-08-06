import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ComponentProxy } from '~/components/component-proxy';
import { PandinoTestUtils } from '../test-utils/pandino-test-utils';
import { cleanupPandinoTest, PandinoTestWrapper, setupPandinoTest } from '../test-utils/test-wrapper';

function TestServiceComponent(props?: { testProp?: string; children?: ReactNode }) {
  const { testProp, children, ...restProps } = props || {};

  return (
    <div data-testid="service-component" {...restProps}>
      {testProp && <span data-testid="test-prop">{testProp}</span>}
      {children}
    </div>
  );
}

let pandinoUtils: PandinoTestUtils;

describe('ComponentProxy', () => {
  beforeEach(async () => {
    pandinoUtils = await setupPandinoTest();
  });

  afterEach(async () => {
    await cleanupPandinoTest(pandinoUtils);
  });

  it('should render children when no service is found', async () => {
    render(
      <PandinoTestWrapper pandinoUtils={pandinoUtils}>
        <ComponentProxy serviceClass="TestComponent" filter="(property=value)">
          <div data-testid="children">Fallback Content</div>
        </ComponentProxy>
      </PandinoTestWrapper>,
    );

    expect(screen.getByTestId('children')).toBeInTheDocument();
    expect(screen.getByText('Fallback Content')).toBeInTheDocument();
  });

  it('should render children when there is an error', async () => {
    const originalGetServiceReference = pandinoUtils.getBundleContext().getServiceReference;

    Object.defineProperty(pandinoUtils.getBundleContext(), 'getServiceReference', {
      value: () => {
        throw new Error('Test error');
      },
      configurable: true,
    });

    render(
      <PandinoTestWrapper pandinoUtils={pandinoUtils}>
        <ComponentProxy serviceClass="TestComponent" filter="(property=value)">
          <div data-testid="children">Fallback Content</div>
        </ComponentProxy>
      </PandinoTestWrapper>,
    );

    expect(screen.getByTestId('children')).toBeInTheDocument();

    Object.defineProperty(pandinoUtils.getBundleContext(), 'getServiceReference', {
      value: originalGetServiceReference,
      configurable: true,
    });
  });

  it('should render the service component when found', async () => {
    pandinoUtils.registerService('TestComponent', TestServiceComponent, { property: 'value' });

    render(
      <PandinoTestWrapper pandinoUtils={pandinoUtils}>
        <ComponentProxy serviceClass="TestComponent" filter="(property=value)">
          <div data-testid="children">Fallback Content</div>
        </ComponentProxy>
      </PandinoTestWrapper>,
    );

    expect(screen.getByTestId('service-component')).toBeInTheDocument();
    expect(screen.queryByTestId('children')).not.toBeInTheDocument();
  });

  it('should pass props to the service component except filter and serviceClass', async () => {
    pandinoUtils.registerService('TestComponent', TestServiceComponent, { property: 'value' });

    render(
      <PandinoTestWrapper pandinoUtils={pandinoUtils}>
        <ComponentProxy
          serviceClass="TestComponent"
          filter="(property=value)"
          testProp="test value"
          data-custom="custom-value"
        >
          <div data-testid="children">Fallback Content</div>
        </ComponentProxy>
      </PandinoTestWrapper>,
    );

    const serviceComponent = screen.getByTestId('service-component');
    expect(serviceComponent).toBeInTheDocument();

    expect(serviceComponent).toHaveAttribute('testprop', 'test value');

    expect(serviceComponent).toHaveAttribute('data-custom', 'custom-value');
  });

  it('should not pass children to the service component', async () => {
    pandinoUtils.registerService('TestComponent', TestServiceComponent, { property: 'value' });

    render(
      <PandinoTestWrapper pandinoUtils={pandinoUtils}>
        <ComponentProxy serviceClass="TestComponent" filter="(property=value)">
          <div data-testid="children">Fallback Content</div>
        </ComponentProxy>
      </PandinoTestWrapper>,
    );

    expect(screen.getByTestId('service-component')).toBeInTheDocument();
    expect(screen.queryByText('Fallback Content')).not.toBeInTheDocument();
  });
});
