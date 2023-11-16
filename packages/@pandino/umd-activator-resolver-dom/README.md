# umd-activator-resolver-dom

[![build-test](https://github.com/BlackBeltTechnology/pandino/actions/workflows/build-test.yml/badge.svg)](https://github.com/BlackBeltTechnology/pandino/actions/workflows/build-test.yml)
[![license](https://img.shields.io/badge/license-EPL%20v2.0-blue.svg)](https://github.com/BlackBeltTechnology/pandino)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)

Activator Resolver supporting UMD modules for browsers.

## Context

This package is part of the [pandino-root](https://github.com/BlackBeltTechnology/pandino) monorepo. For detailed
information about what is Pandino / how this package fits into the ecosystem, please consult with the related
documentation(s).

## Usage

### Add the Resolver to the Pandino configuration

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
```

### Fill additional Manifest Headers for UMD Bundles

Every UMD Bundle **MUST** provide the following Manifest Headers:
- Bundle-Type: `'umd'`
- Bundle-UMD-Name: `string`

**Example:**

```json
{
    "Bundle-SymbolicName": "@scope/my-umd-bundle",
    "Bundle-Version": "1.0.0",
    "Bundle-Activator": "./my-umd-bundle.js",
    "Bundle-Type": "umd",
    "Bundle-UMD-Name": "MyUMDBundle"
}
```

> The `Bundle-UMD-Name` must be the library name which the bundle registers it self on e.g. the `window` object in
browsers. It can be different compared to the file name.

## License

Eclipse Public License - v 2.0
