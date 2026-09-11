import { vi } from 'vitest';
import type { BundleActivator } from '../framework/interfaces';
import type { BundleModule } from '../types/bundle-metadata';

interface BundleModuleOptions {
  bundleName?: string;
  bundleDescription?: string;
  bundleManifestVersion?: string;
  [key: string]: any;
}

const NAMED_HEADERS = ['bundleName', 'bundleDescription', 'bundleManifestVersion'];

/**
 * Builds the resolved `BundleModule` that `framework.installBundle()` expects.
 * Any extra `options` entry is passed through as an additional manifest header.
 */
export function createBundleModule(
  symbolicName: string = 'test.bundle',
  version: string = '1.0.0',
  options: BundleModuleOptions = {},
  activator: BundleActivator = { start: vi.fn(), stop: vi.fn() },
): Promise<BundleModule> {
  return Promise.resolve({
    default: {
      headers: {
        bundleSymbolicName: symbolicName,
        bundleVersion: version,
        bundleName: options.bundleName,
        bundleDescription: options.bundleDescription,
        bundleManifestVersion: options.bundleManifestVersion,
        ...Object.entries(options)
          .filter(([key]) => !NAMED_HEADERS.includes(key))
          .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {}),
      },
      activator,
    },
  });
}
