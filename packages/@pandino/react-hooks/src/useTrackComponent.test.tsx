import { useState, useEffect, type FC } from 'react';
import { describe, it, beforeEach, expect, vi, type MockInstance } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import Pandino from '@pandino/pandino';
import {
  type BundleActivator,
  type BundleContext,
  type BundleImporter,
  type FrameworkConfigMap,
  LOG_LEVEL_PROP,
  LogLevel,
  OBJECTCLASS,
  PANDINO_BUNDLE_IMPORTER_PROP,
  PANDINO_MANIFEST_FETCHER_PROP,
  type ServiceRegistration,
} from '@pandino/pandino-api';
import { PandinoProvider } from './PandinoContext';
import { useTrackComponent } from './useTrackComponent';

interface DummyComponentProps {
  text: string | number;
  prop1?: string;
}

const DummyComponent: FC<DummyComponentProps> = ({ text, prop1 }) => {
  return (
    <>
      <div data-testid="status">dummy component: {text}</div>
      <div data-testid="prop1">{prop1 ?? ''}</div>
    </>
  );
};

interface TestComponentProps {
  filter: string;
  reactToServicePropertyChanges?: boolean;
  onRender: (component: typeof DummyComponent | undefined) => void;
}

const TestComponent: FC<TestComponentProps> = ({ filter, onRender }) => {
  const { service: Cmp, properties } = useTrackComponent<typeof DummyComponent>(filter);
  // use a counter to detect re-renders
  const [renderCount, setRenderCount] = useState(0);
  useEffect(() => {
    setRenderCount((c) => c + 1);
    onRender(Cmp);
  }, [Cmp, onRender]);

  if (Cmp) {
    return <Cmp text={renderCount} prop1={properties?.prop1} />;
  }
  return <div data-testid="status">{`undefined-${renderCount}`}</div>;
};

describe('useTrackComponent', () => {
  let pandino: Pandino;
  let bundleContext: BundleContext;
  let dummyReg: ServiceRegistration<typeof DummyComponent>;
  let params: FrameworkConfigMap;
  const dummyComponentFilter = `(${OBJECTCLASS}=dummy-component)`;
  const nonExistentFilter = `(${OBJECTCLASS}=non-existent-component)`;
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
    params = {
      [PANDINO_MANIFEST_FETCHER_PROP]: vi.fn() as any,
      [PANDINO_BUNDLE_IMPORTER_PROP]: importer,
      [LOG_LEVEL_PROP]: LogLevel.TRACE,
    };
    pandino = new Pandino(params);
    await pandino.init();
    await pandino.start();
    bundleContext = pandino.getBundleContext();
    // register the dummy component service; the filter will match the OBJECTCLASS and type
    dummyReg = bundleContext.registerService('dummy-component', DummyComponent, { prop1: 'hello' });
    // spy on ungetService to verify cleanup (if needed)
    vi.spyOn(bundleContext, 'ungetService');
  });

  it('should initialize with undefined component if not found', async () => {
    let renderedComponent: typeof DummyComponent | undefined = undefined;
    render(
      <PandinoProvider ctx={bundleContext}>
        <TestComponent
          filter={nonExistentFilter}
          onRender={(comp) => {
            renderedComponent = comp;
          }}
        />
      </PandinoProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toContain('undefined');
    });
    expect(renderedComponent).toBeUndefined();
  });

  it('should return the component if available', async () => {
    let renderedComponent: typeof DummyComponent | undefined = undefined;
    render(
      <PandinoProvider ctx={bundleContext}>
        <TestComponent
          filter={dummyComponentFilter}
          onRender={(comp) => {
            renderedComponent = comp;
          }}
        />
      </PandinoProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toEqual('dummy component: 1');
    });
    expect(renderedComponent).toEqual(DummyComponent);
  });

  it('should update to a new component when filter changes', async () => {
    let renderedComponent: typeof DummyComponent | undefined = undefined;
    // initial render with a non-existent service returns undefined
    const { rerender } = render(
      <PandinoProvider ctx={bundleContext}>
        <TestComponent
          filter={nonExistentFilter}
          onRender={(comp) => {
            renderedComponent = comp;
          }}
        />
      </PandinoProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toContain('undefined');
    });
    expect(renderedComponent).toBeUndefined();

    // change the filter to one that matches the registered dummy component
    rerender(
      <PandinoProvider ctx={bundleContext}>
        <TestComponent
          filter={dummyComponentFilter}
          onRender={(comp) => {
            renderedComponent = comp;
          }}
        />
      </PandinoProvider>,
    );
    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toEqual('dummy component: 3');
    });

    expect(renderedComponent).toEqual(DummyComponent);
  });

  it('should update component provider when properties change if reactToServicePropertyChanges is true', async () => {
    let renderedComponent: typeof DummyComponent | undefined = undefined;
    render(
      <PandinoProvider ctx={bundleContext}>
        <TestComponent
          filter={dummyComponentFilter}
          reactToServicePropertyChanges={true}
          onRender={(comp) => {
            renderedComponent = comp;
          }}
        />
      </PandinoProvider>,
    );
    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toEqual('dummy component: 1');
      expect(screen.getByTestId('prop1').textContent).toEqual('hello');
    });
    expect(renderedComponent).toEqual(DummyComponent);

    // update the properties of the registered service while keeping the same service object
    act(() => {
      dummyReg.setProperties({ prop1: 'updated property' });
    });

    // the hook should trigger a re-render even if the component (service) instance is identical
    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toEqual('dummy component: 1');
      expect(screen.getByTestId('prop1').textContent).toEqual('updated property');
    });
    expect(renderedComponent).toEqual(DummyComponent);
  });

  it('should clean up service listeners on unmount', async () => {
    const { unmount } = render(
      <PandinoProvider ctx={bundleContext}>
        <TestComponent filter={dummyComponentFilter} onRender={() => {}} />
      </PandinoProvider>,
    );
    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toEqual('dummy component: 1');
    });

    const previousCalls = (bundleContext.ungetService as unknown as MockInstance).mock.calls.length;
    unmount();
    expect(bundleContext.ungetService).toHaveBeenCalledTimes(previousCalls + 1);
  });
});
