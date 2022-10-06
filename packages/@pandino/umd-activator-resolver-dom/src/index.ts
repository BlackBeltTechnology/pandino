import {
  ActivatorResolver,
  BUNDLE_SYMBOLICNAME,
  BUNDLE_UMD_NAME,
  BundleActivator,
  BundleManifestHeaders,
} from '@pandino/pandino-api';

const resolver: ActivatorResolver = {
  resolve(module: any, bundleHeaders: BundleManifestHeaders): BundleActivator {
    const umdName: any = bundleHeaders[BUNDLE_UMD_NAME];

    if (!umdName) {
      throw new Error(`Resolution failed, missing ${BUNDLE_UMD_NAME} parameter in Manifest Headers!`);
    }

    const moduleToLoad: any = window[umdName];

    if (!moduleToLoad.default) {
      throw new Error(`${bundleHeaders[BUNDLE_SYMBOLICNAME]} (UMD) has no default export, aborting!`);
    }

    return moduleToLoad.default as BundleActivator;
  },
};

export default resolver;
