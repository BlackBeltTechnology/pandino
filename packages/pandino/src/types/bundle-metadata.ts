import type { BundleActivator } from '../framework/interfaces';

/** Metadata describing a bundle (used in bundle headers). */
export interface BundleMetadata {
  bundleSymbolicName: string;
  bundleVersion: string;
  bundleName?: string;
  bundleDescription?: string;
  bundleManifestVersion?: string;
  bundleActivator?: string;
  importPackage?: string;
  exportPackage?: string;
  requireBundle?: string;
  [key: string]: any;
}

export interface BundleManifest {
  headers: {
    'Bundle-SymbolicName': string;
    'Bundle-Version': string;
    [key: string]: string;
  };
  metadata: BundleMetadata;
}

/**
 * The shape of a Pandino bundle module. This is what `import()` of a bundle returns.
 * Typically produced by `@pandino/rollup-bundle-plugin` or written by hand.
 *
 * @example
 * ```ts
 * export default {
 *   headers: { bundleSymbolicName: 'com.example.my', bundleVersion: '1.0.0' },
 *   activator: myActivator,
 *   components: [MyServiceImpl],
 * };
 * ```
 */
export interface BundleModule {
  default: {
    headers: {
      bundleSymbolicName: string;
      bundleVersion: string;
      bundleName?: string;
      bundleDescription?: string;
      bundleManifestVersion?: string;
      /** Set this to attach the bundle as a fragment to the named host. */
      fragmentHost?: string;
      [key: string]: any;
    };
    /** Optional activator with start/stop lifecycle callbacks. */
    activator?: BundleActivator;
    /** Classes decorated with @Component to be registered with SCR. */
    components?: (new (...args: any[]) => any)[];
    /** Map of logical resource paths to actual URLs. */
    resources?: { [logicalPath: string]: string };
  };
}
