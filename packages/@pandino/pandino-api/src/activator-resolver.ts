import type { BundleActivator, BundleManifestHeaders } from './bundle';

export interface ActivatorResolver {
  /**
   * ActivatorResolvers are responsible to return a {@code BundleActivator} for a given {@code BundleType}. E.g.:
   * Resolving UMD modules are different compared to plain ESM.
   *
   * Resolvers can be added to Pandino's PANDINO_ACTIVATOR_RESOLVERS ConfigMap entry.
   *
   * @param module        Any reference to a particular module.
   * @param bundleHeaders Headers for the Bundle we would like to activate
   */
  resolve(module: any, bundleHeaders: BundleManifestHeaders): BundleActivator;
}
