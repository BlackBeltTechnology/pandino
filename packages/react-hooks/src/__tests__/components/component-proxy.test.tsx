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

    expect(screen.getByTestId('test-prop')).toHaveTextContent('test value');

    expect(serviceComponent).toHaveAttribute('data-custom', 'custom-value');
    expect(serviceComponent).not.toHaveAttribute('serviceClass');
    expect(serviceComponent).not.toHaveAttribute('filter');
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

  it('should re-render once when service becomes available (via filter change)', async () => {
    const calls: { service: number; fallback: number } = { service: 0, fallback: 0 };
    const ServiceComp = () => {
      calls.service += 1;
      return <div data-testid="tracked-service" />;
    };
    const Fallback = () => {
      calls.fallback += 1;
      return <div data-testid="fallback" />;
    };

    // Register service that matches property=value
    pandinoUtils.registerService('TrackedComponent', ServiceComp, { property: 'value' });

    const { rerender } = render(
      <PandinoTestWrapper pandinoUtils={pandinoUtils}>
        <ComponentProxy serviceClass="TrackedComponent" filter="(property=other)">
          <Fallback />
        </ComponentProxy>
      </PandinoTestWrapper>,
    );

    // Initially fallback should be rendered once
    expect(screen.getByTestId('fallback')).toBeInTheDocument();
    expect(calls.fallback).toBe(1);
    expect(calls.service).toBe(0);

    // Change filter so that the existing service becomes available -> one re-render
    rerender(
      <PandinoTestWrapper pandinoUtils={pandinoUtils}>
        <ComponentProxy serviceClass="TrackedComponent" filter="(property=value)">
          <Fallback />
        </ComponentProxy>
      </PandinoTestWrapper>,
    );

    expect(screen.getByTestId('tracked-service')).toBeInTheDocument();
    expect(calls.service).toBe(1);
    // Fallback should not render again
    expect(calls.fallback).toBe(1);
  });

  it('should re-render once when switching between two matching services (service change)', async () => {
    const comp1Calls = { count: 0 };
    const comp2Calls = { count: 0 };
    const ServiceComp1 = () => {
      comp1Calls.count += 1;
      return <div data-testid="service-1" />;
    };
    const ServiceComp2 = () => {
      comp2Calls.count += 1;
      return <div data-testid="service-2" />;
    };

    // Register two services with different properties so filters can target them
    pandinoUtils.registerService('TrackedComponent', ServiceComp1, { tag: 'one' });
    pandinoUtils.registerService('TrackedComponent', ServiceComp2, { tag: 'two' });

    const { rerender } = render(
      <PandinoTestWrapper pandinoUtils={pandinoUtils}>
        <ComponentProxy serviceClass="TrackedComponent" filter="(tag=one)">
          <div data-testid="fallback">FB</div>
        </ComponentProxy>
      </PandinoTestWrapper>,
    );

    expect(screen.getByTestId('service-1')).toBeInTheDocument();
    expect(comp1Calls.count).toBe(1);
    expect(comp2Calls.count).toBe(0);

    // Switch filter to target the second service -> exactly one re-render
    rerender(
      <PandinoTestWrapper pandinoUtils={pandinoUtils}>
        <ComponentProxy serviceClass="TrackedComponent" filter="(tag=two)">
          <div data-testid="fallback">FB</div>
        </ComponentProxy>
      </PandinoTestWrapper>,
    );

    expect(screen.getByTestId('service-2')).toBeInTheDocument();
    expect(comp2Calls.count).toBe(1);
    expect(comp1Calls.count).toBe(1);
  });

  it('should re-render once when no capable service remains (switch to non-matching filter)', async () => {
    const calls = { service: 0, fallback: 0 };
    const ServiceComp = () => {
      calls.service += 1;
      return <div data-testid="tracked-service" />;
    };
    const Fallback = () => {
      calls.fallback += 1;
      return <div data-testid="fallback" />;
    };

    pandinoUtils.registerService('TrackedComponent', ServiceComp, { flag: 'yes' });

    const { rerender } = render(
      <PandinoTestWrapper pandinoUtils={pandinoUtils}>
        <ComponentProxy serviceClass="TrackedComponent" filter="(flag=yes)">
          <Fallback />
        </ComponentProxy>
      </PandinoTestWrapper>,
    );

    expect(screen.getByTestId('tracked-service')).toBeInTheDocument();
    expect(calls.service).toBe(1);
    expect(calls.fallback).toBe(0);

    // Now change filter to a non-matching one -> exactly one re-render to fallback
    rerender(
      <PandinoTestWrapper pandinoUtils={pandinoUtils}>
        <ComponentProxy serviceClass="TrackedComponent" filter="(flag=no)">
          <Fallback />
        </ComponentProxy>
      </PandinoTestWrapper>,
    );

    expect(screen.getByTestId('fallback')).toBeInTheDocument();
    expect(calls.fallback).toBe(1);
    expect(calls.service).toBe(1);
  });

  it('should not re-render for service changes that do not match serviceClass/filter criteria', async () => {
    const calls = { service: 0, fallback: 0 };
    const ServiceComp = () => {
      calls.service += 1;
      return <div data-testid="tracked-service" />;
    };
    const Fallback = () => {
      calls.fallback += 1;
      return <div data-testid="fallback" />;
    };

    // Start with a matching service rendered
    pandinoUtils.registerService('TrackedComponent', ServiceComp, { key: 'main' });
    render(
      <PandinoTestWrapper pandinoUtils={pandinoUtils}>
        <ComponentProxy serviceClass="TrackedComponent" filter="(key=main)">
          <Fallback />
        </ComponentProxy>
      </PandinoTestWrapper>,
    );

    expect(screen.getByTestId('tracked-service')).toBeInTheDocument();
    expect(calls.service).toBe(1);
    expect(calls.fallback).toBe(0);

    // Register an unrelated service that should not affect our proxy (different serviceClass)
    const Irrelevant = () => <div />;
    pandinoUtils.registerService('OtherComponent', Irrelevant, { key: 'main' });

    // Give a small delay to simulate async events; ComponentProxy does not subscribe, so no change expected
    await new Promise((r) => setTimeout(r, 200));

    // No additional renders should have happened
    expect(calls.service).toBe(1);
    expect(calls.fallback).toBe(0);
    expect(screen.getByTestId('tracked-service')).toBeInTheDocument();
  });
});
