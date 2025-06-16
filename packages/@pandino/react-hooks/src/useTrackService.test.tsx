import { useState, useEffect } from 'react';
import { describe, it, beforeEach, expect, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import { type SimpleTracker, useTrackService } from './useTrackService';
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

type DummyService = Record<string, any>;

interface TestComponentProps {
  filter: string;
  onRender: (tracker: SimpleTracker<DummyService>) => void;
}

const TestComponent = ({ filter, onRender }: TestComponentProps) => {
  const tracker = useTrackService<DummyService>(filter);
  const [counter, setCounter] = useState(0);
  useEffect(() => {
    setCounter((c) => c + 1);
    onRender(tracker);
  }, [tracker, onRender]);
  return <div data-testid="status">{tracker.service ? `defined-${counter}` : `undefined-${counter}`}</div>;
};

describe('useTrackService', () => {
  let params: FrameworkConfigMap;
  let pandino: Pandino;
  let bundleContext: BundleContext;
  const dummyService: DummyService = { prop1: 'value1' };
  let dummyServiceReg: ServiceRegistration<DummyService>;
  const mockStart = vi.fn().mockReturnValue(Promise.resolve());
  const mockStop = vi.fn().mockReturnValue(Promise.resolve());
  const dummyActivator: BundleActivator = {
    start: mockStart,
    stop: mockStop,
  };
  const importer: BundleImporter = {
    import: (_: string, __: string) =>
      Promise.resolve({
        default: dummyActivator,
      }),
  };

  beforeEach(async () => {
    mockStart.mockClear();
    mockStart.mockImplementation(() => {});
    mockStop.mockClear();
    params = {
      [PANDINO_MANIFEST_FETCHER_PROP]: vi.fn() as any,
      [PANDINO_BUNDLE_IMPORTER_PROP]: importer,
      [LOG_LEVEL_PROP]: LogLevel.TRACE,
    };
    pandino = new Pandino(params);
    await pandino.init();
    await pandino.start();
    bundleContext = pandino.getBundleContext();
    dummyServiceReg = bundleContext.registerService('dummy-service', dummyService, {
      prop1: 'hello',
    });
    vi.spyOn(bundleContext, 'ungetService');
  });

  it('should initialize with an undefined service if not present', async () => {
    let renderedTracker: SimpleTracker<DummyService> = {
      service: undefined,
      properties: undefined,
    };

    render(
      <PandinoProvider ctx={bundleContext}>
        <TestComponent
          filter={`(${OBJECTCLASS}="other-service")`}
          onRender={(tracker) => {
            renderedTracker = tracker;
            return renderedTracker;
          }}
        />
      </PandinoProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('undefined-1'));

    expect(renderedTracker.service).toBe(undefined);
    expect(renderedTracker.properties).toBe(undefined);
  });

  it('should initialize with a valid service', async () => {
    let renderedTracker: SimpleTracker<DummyService> = {
      service: undefined,
      properties: undefined,
    };

    render(
      <PandinoProvider ctx={bundleContext}>
        <TestComponent
          filter={`(${OBJECTCLASS}=dummy-service)`}
          onRender={(tracker) => {
            renderedTracker = tracker;
            return renderedTracker;
          }}
        />
      </PandinoProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('defined-1'));

    expect(renderedTracker.service).toEqual(dummyService);
    expect(renderedTracker.properties?.prop1).toEqual('hello');
  });

  it('should update service on REGISTERED event', async () => {
    let renderedTracker: SimpleTracker<DummyService> = {
      service: undefined,
      properties: undefined,
    };
    const service2: DummyService = { prop2: 'value2' };

    render(
      <PandinoProvider ctx={bundleContext}>
        <TestComponent
          filter={`(${OBJECTCLASS}=dummy-service-2)`}
          onRender={(tracker) => {
            renderedTracker = tracker;
            return renderedTracker;
          }}
        />
      </PandinoProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('undefined-1'));
    await waitFor(() => {
      expect(renderedTracker.service).toBe(undefined);
      expect(renderedTracker.properties).toBe(undefined);
    });

    act(() => {
      bundleContext.registerService('dummy-service-2', service2);
    });

    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('defined-2'));
    await waitFor(() => {
      expect(renderedTracker.service).toEqual(service2);
    });
  });

  it('should clear service on UNREGISTERING event', async () => {
    let renderedTracker: SimpleTracker<DummyService> = {
      service: undefined,
      properties: undefined,
    };

    render(
      <PandinoProvider ctx={bundleContext}>
        <TestComponent
          filter={`(${OBJECTCLASS}=dummy-service)`}
          onRender={(tracker) => {
            renderedTracker = tracker;
            return renderedTracker;
          }}
        />
      </PandinoProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('defined-1'));

    act(() => {
      dummyServiceReg.unregister();
    });

    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('undefined-2'));
    await waitFor(() => {
      expect(renderedTracker.service).toBe(undefined);
      expect(renderedTracker.properties).toBe(undefined);
    });
  });

  it('should remove service listener on unmount', async () => {
    const { unmount } = render(
      <PandinoProvider ctx={bundleContext}>
        <TestComponent filter={`(${OBJECTCLASS}=dummy-service)`} onRender={() => {}} />
      </PandinoProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('defined-1'));

    let listeners = (bundleContext.getBundle() as any).dispatcher.svcListeners as Map<any, any>;

    expect(listeners.size).toEqual(1);
    expect(bundleContext.ungetService).toHaveBeenCalledTimes(1);

    unmount();

    listeners = (bundleContext.getBundle() as any).dispatcher.svcListeners as Map<any, any>;

    expect(listeners.size).toEqual(0);
    expect(bundleContext.ungetService).toHaveBeenCalledTimes(2);
  });

  it('should update properties on MODIFIED event without service reference change', async () => {
    let renderedTracker: SimpleTracker<DummyService> = {
      service: undefined,
      properties: undefined,
    };

    render(
      <PandinoProvider ctx={bundleContext}>
        <TestComponent
          filter={`(${OBJECTCLASS}=dummy-service)`}
          onRender={(tracker) => {
            renderedTracker = tracker;
          }}
        />
      </PandinoProvider>,
    );

    const svc1 = renderedTracker.service;

    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('defined-1');
      expect(renderedTracker.properties?.prop1).toEqual('hello');
    });
    await waitFor(() => {});

    act(() => {
      dummyServiceReg.setProperties({ prop1: 'dance!' });
    });

    const svc2 = renderedTracker.service;

    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('defined-2');
      expect(renderedTracker.properties?.prop1).toEqual('dance!');
      expect(svc2).toEqual(svc1);
    });
  });

  it('should update tracker when filter changes from found to not found', async () => {
    let renderedTracker: SimpleTracker<DummyService> = {
      service: undefined,
      properties: undefined,
    };

    const { rerender } = render(
      <PandinoProvider ctx={bundleContext}>
        <TestComponent
          filter={`(${OBJECTCLASS}=dummy-service)`}
          onRender={(tracker) => {
            renderedTracker = tracker;
          }}
        />
      </PandinoProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('defined-1'));
    expect(renderedTracker.service).toEqual(dummyService);

    rerender(
      <PandinoProvider ctx={bundleContext}>
        <TestComponent
          filter={`(${OBJECTCLASS}=non-existent-service)`}
          onRender={(tracker) => {
            renderedTracker = tracker;
          }}
        />
      </PandinoProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('undefined-3'));
    expect(renderedTracker.service).toBe(undefined);
  });

  it('should update tracker when filter changes from not found to found', async () => {
    let renderedTracker: SimpleTracker<DummyService> = {
      service: undefined,
      properties: undefined,
    };

    const { rerender } = render(
      <PandinoProvider ctx={bundleContext}>
        <TestComponent
          filter={`(${OBJECTCLASS}=non-existent-service)`}
          onRender={(tracker) => {
            renderedTracker = tracker;
          }}
        />
      </PandinoProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('undefined-1'));
    expect(renderedTracker.service).toBe(undefined);

    rerender(
      <PandinoProvider ctx={bundleContext}>
        <TestComponent
          filter={`(${OBJECTCLASS}=dummy-service)`}
          onRender={(tracker) => {
            renderedTracker = tracker;
          }}
        />
      </PandinoProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('defined-3'));
    expect(renderedTracker.service).toEqual(dummyService);
  });
});
