import { renderHook } from '@testing-library/react';
import { type ReactNode, useMemo } from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PandinoContext } from '../../context/pandino-context';
import { useBundleContext } from '../../hooks/use-bundle-context';
import { PandinoTestUtils } from '../test-utils/pandino-test-utils';
import { cleanupPandinoTest, PandinoTestWrapper, setupPandinoTest } from '../test-utils/test-wrapper';

let pandinoUtils: PandinoTestUtils;

describe('useBundleContext', () => {
  beforeEach(async () => {
    pandinoUtils = await setupPandinoTest();
  });

  afterEach(async () => {
    await cleanupPandinoTest(pandinoUtils);
  });

  it('should return the bundle context from the Pandino context', () => {
    const { result } = renderHook(() => useBundleContext(), {
      wrapper: ({ children }) => <PandinoTestWrapper pandinoUtils={pandinoUtils}>{children}</PandinoTestWrapper>,
    });

    const realBundleContext = pandinoUtils.getBundleContext();

    expect(result.current).toBe(realBundleContext);
  });

  it('should return null when bundle context is not available', () => {
    const nullContextValue = {
      framework: null,
      bundleContext: null,
      isInitialized: false,
      error: null,
    };

    const { result } = renderHook(() => useBundleContext(), {
      wrapper: ({ children }) => <PandinoContext.Provider value={nullContextValue}>{children}</PandinoContext.Provider>,
    });

    expect(result.current).toBeNull();
  });

  it('should not cause unnecessary re-renders', () => {
    let renderCount = 0;

    const TestComponentWithCounter = () => {
      const bundleContext = useBundleContext();
      renderCount++;
      return <div>Bundle context: {bundleContext ? 'exists' : 'null'}</div>;
    };

    const MemoizedWrapper = ({ children }: { children: ReactNode }) => {
      const contextValue = useMemo(() => pandinoUtils.createContextValue(), []);

      return (
        <PandinoContext.Provider value={contextValue}>
          <TestComponentWithCounter />
          {children}
        </PandinoContext.Provider>
      );
    };

    const { rerender } = renderHook(() => {}, {
      wrapper: MemoizedWrapper,
    });

    expect(renderCount).toBe(1);

    rerender();

    expect(renderCount).toBe(2);

    const newContextValue = {
      ...pandinoUtils.createContextValue(),
      bundleContext: { ...pandinoUtils.getBundleContext() } as any,
    };

    renderHook(() => {}, {
      wrapper: ({ children }) => (
        <PandinoContext.Provider value={newContextValue}>
          <TestComponentWithCounter />
          {children}
        </PandinoContext.Provider>
      ),
    });

    expect(renderCount).toBe(3);
  });
});
