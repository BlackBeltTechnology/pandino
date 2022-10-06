# Activator Resolvers

Pandino supports different types of Bundles. By default it comes with support for ESM, but any number of additional
resolvers can be added.

An optional first-party resolver is provided for loading of UMD Bundles: [@pandino/umd-activator-resolver-dom](../../packages/@pandino/umd-activator-resolver-dom)

## Creating an ActivatorResolver

First you need to implement [ActivatorResolver](../../packages/@pandino/pandino-api/src/activator-resolver.ts).

```typescript
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
```

## Registering an ActivatorResolver

ActivatorResolvers can be registered with the [FrameworkConfigMap](../../packages/@pandino/pandino-api/src/framework/framework-config-map.ts)'s
`PANDINO_ACTIVATOR_RESOLVERS` entry by:

- providing the [BundleType](../../packages/@pandino/pandino-api/src/bundle/bundle-type.ts)
- with the corresponding [ActivatorResolver](../../packages/@pandino/pandino-api/src/activator-resolver.ts) implementation

```javascript
import loaderConfiguration from 'https://unpkg.com/@pandino/loader-configuration-dom/dist/loader-configuration-dom.mjs';
import umdActivatorResolver from 'https://unpkg.com/@pandino/umd-activator-resolver-dom/dist/umd-activator-resolver-dom.mjs';
import Pandino from 'https://unpkg.com/@pandino/pandino/dist/esm/pandino.mjs';

const pandino = new Pandino({
    ...loaderConfiguration,
    'pandino.activator.resolvers': {
        'umd': umdActivatorResolver,
    },
});

await pandino.init();
await pandino.start();

// ...
```

## Providing necessary Bundle Manifest Headers for UMD Bundles

Every UMD Bundle **MUST** provide the following Manifest Headers:
- Bundle-Type: `string`
- Bundle-UMD-Name: `string`

```json
{
    "Bundle-SymbolicName": "@scope/my-umd-bundle",
    "Bundle-Version": "1.0.0",
    "Bundle-Activator": "./my-umd-bundle.js",
    "Bundle-Type": "umd",
    "Bundle-UMD-Name": "my-umd-bundle"
}
```

> The `Bundle-UMD-Name` must be the library name which the bundle registers it self on e.g. the `window` object in 
  browsers. It can be different compared to the file name.

If any bundle is loaded to Pandino which has a `Bundle-Type` without a registered `ActivatorResolver`, then the
framework will throw an Error.
