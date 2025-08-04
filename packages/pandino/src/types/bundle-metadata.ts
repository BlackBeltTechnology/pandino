import type { BundleActivator } from '~/framework/interfaces';

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

export interface BundleModule {
  default: {
    headers: {
      bundleSymbolicName: string;
      bundleVersion: string;
      bundleName?: string;
      bundleDescription?: string;
      bundleManifestVersion?: string;
      fragmentHost?: string;
      [key: string]: any;
    };
    activator?: BundleActivator;
    components?: (new (...args: any[]) => any)[];
    resources?: { [logicalPath: string]: string };
  };
}
