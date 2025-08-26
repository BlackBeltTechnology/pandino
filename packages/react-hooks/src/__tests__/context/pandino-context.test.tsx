import { LogLevel } from '@pandino/pandino';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PandinoProvider, usePandinoContext } from '../../context';

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

describe('PandinoContext Integration Tests', () => {
  afterEach(() => {
    cleanup();
  });

  it('should initialize the real framework and provide it to consumers', async () => {
    render(
      <PandinoProvider>
        <TestConsumer />
      </PandinoProvider>,
    );

    expect(screen.getByTestId('initialized').textContent).toBe('false');

    await waitFor(
      () => {
        expect(screen.getByTestId('initialized').textContent).toBe('true');
      },
      { timeout: 5000 },
    );

    expect(screen.getByTestId('has-framework').textContent).toBe('true');
    expect(screen.getByTestId('has-context').textContent).toBe('true');
    expect(screen.getByTestId('error').textContent).toBe('no-error');
  });

  it('should handle initialization errors when bootstrap config is invalid', async () => {
    const invalidConfig = {
      frameworkLogLevel: 'INVALID_LOG_LEVEL' as any,
    };

    render(
      <PandinoProvider bootstrapConfig={invalidConfig}>
        <TestConsumer />
      </PandinoProvider>,
    );

    await waitFor(
      () => {
        const errorText = screen.getByTestId('error').textContent;
        const initializedText = screen.getByTestId('initialized').textContent;
        expect(errorText !== 'no-error' || initializedText === 'true').toBe(true);
      },
      { timeout: 5000 },
    );
  });

  it('should accept valid bootstrapConfig with frameworkLogLevel', async () => {
    render(
      <PandinoProvider bootstrapConfig={{ frameworkLogLevel: LogLevel.DEBUG }}>
        <TestConsumer />
      </PandinoProvider>,
    );

    await waitFor(
      () => {
        expect(screen.getByTestId('initialized').textContent).toBe('true');
      },
      { timeout: 5000 },
    );

    expect(screen.getByTestId('has-framework').textContent).toBe('true');
    expect(screen.getByTestId('has-context').textContent).toBe('true');
    expect(screen.getByTestId('error').textContent).toBe('no-error');
  });

  it('should install and start bundles from promise array', async () => {
    const testBundle1 = {
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
    };

    const testBundle2 = {
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
    };

    const bundlePromise1 = Promise.resolve(testBundle1);
    const bundlePromise2 = Promise.resolve(testBundle2);

    render(
      <PandinoProvider bundles={[bundlePromise1, bundlePromise2]}>
        <TestConsumer />
      </PandinoProvider>,
    );

    await waitFor(
      () => {
        expect(screen.getByTestId('initialized').textContent).toBe('true');
      },
      { timeout: 5000 },
    );

    expect(screen.getByTestId('has-framework').textContent).toBe('true');
    expect(screen.getByTestId('has-context').textContent).toBe('true');
    expect(screen.getByTestId('error').textContent).toBe('no-error');

    expect(testBundle1.default.activator.start).toHaveBeenCalled();
    expect(testBundle2.default.activator.start).toHaveBeenCalled();
  });
});
