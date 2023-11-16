import type { ActivatorResolver, BundleActivator, BundleManifestHeaders } from '@pandino/pandino-api';

export class EsmActivatorResolver implements ActivatorResolver {
  resolve(module: any, bundleHeaders: BundleManifestHeaders): BundleActivator {
    return module.default;
  }
}
