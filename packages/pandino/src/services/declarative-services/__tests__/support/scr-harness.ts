import { vi } from 'vitest';
import { OSGiFramework } from '../../../../framework/framework';
import type { BundleContext, ServiceEvent, ServiceReference } from '../../../../framework/interfaces';
import { ServiceComponentRuntime } from '../../scr';

/** A started framework with an SCR bound to its bundle context. */
export interface ScrHarness {
  framework: OSGiFramework;
  scr: ServiceComponentRuntime;
  bundleContext: BundleContext;
  bundleId: number;
}

export interface ScrHarnessOptions {
  /** Runs against the bundle context before the SCR is constructed, e.g. to register a ConfigurationAdmin. */
  setup?: (bundleContext: BundleContext) => void;
}

/** Boots a real `OSGiFramework` and an SCR on its bundle context. */
export async function createScrHarness(options: ScrHarnessOptions = {}): Promise<ScrHarness> {
  const framework = new OSGiFramework();
  await framework.start();
  const bundleContext = framework.getBundleContext();
  options.setup?.(bundleContext);
  const scr = new ServiceComponentRuntime(framework, bundleContext);
  return { framework, scr, bundleContext, bundleId: bundleContext.getBundle().getBundleId() };
}

/**
 * A service reference stub backed by `properties`, which answer `getProperty`
 * and `getPropertyKeys` (e.g. `{ 'service.ranking': 10 }` for ranking tests).
 */
export function makeServiceRef(properties: Record<string, unknown> = {}): ServiceReference<any> {
  return {
    getProperty: vi.fn((key: string) => properties[key]),
    getPropertyKeys: vi.fn(() => Object.keys(properties)),
    getBundle: vi.fn(),
    isAssignableTo: vi.fn().mockReturnValue(true),
  } as unknown as ServiceReference<any>;
}

/** A service event stub of `type` carrying `ref`. */
export function makeServiceEvent(type: number, ref: ServiceReference<any>): ServiceEvent {
  return { getType: () => type, getServiceReference: () => ref } as unknown as ServiceEvent;
}

/**
 * Points the context's registry lookups at `refs`. `resolve` maps a reference to
 * its service; pass a plain value to resolve every reference to it.
 */
export function stubServiceRegistry(
  bundleContext: BundleContext,
  refs: ServiceReference<any>[],
  resolve?: unknown | ((ref: ServiceReference<any>) => unknown),
): void {
  bundleContext.getServiceReferences = vi.fn().mockReturnValue(refs);
  bundleContext.getService =
    typeof resolve === 'function'
      ? vi.fn(resolve as (ref: ServiceReference<any>) => unknown)
      : vi.fn().mockReturnValue(resolve ?? null);
}

/** Yields to the event loop so the SCR's floating event-queue drain can finish. */
export const flushEventQueue = (ms = 10): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/** Resolves the SCR that `ServiceComponentRuntimeBundleActivator` registered on the context. */
export function getScrService(bundleContext: BundleContext): ServiceComponentRuntime {
  const ref = bundleContext.getServiceReference('ServiceComponentRuntime')!;
  return bundleContext.getService(ref) as any;
}
