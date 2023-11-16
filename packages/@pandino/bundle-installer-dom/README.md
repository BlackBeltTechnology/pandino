# bundle-installer-dom

[![build-test](https://github.com/BlackBeltTechnology/pandino/actions/workflows/build-test.yml/badge.svg)](https://github.com/BlackBeltTechnology/pandino/actions/workflows/build-test.yml)
[![license](https://img.shields.io/badge/license-EPL%20v2.0-blue.svg)](https://github.com/BlackBeltTechnology/pandino)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)

A Pandino Bundle which can load external Bundles defined in a dedicated DOM node.

## Context

This package is part of the [pandino-root](https://github.com/BlackBeltTechnology/pandino) monorepo. For detailed
information about what is Pandino / how this package fits into the ecosystem, please consult with the related
documentation(s).

## Usage

### Define manifests
Define a `<script type="pandino-manifests" />` tag in your `index.html`, e.g.:

```html
<script type="pandino-manifests">
  [
    "./bundle-a-manifest.json",
    "./bundle-b-manifest.json"
  ]
</script>
```

### Install this Bundle in your Application

E.g.: directly via the Pandino instance.

```javascript
import loaderConfiguration from 'https://unpkg.com/@pandino/loader-configuration-dom/dist/loader-configuration-dom.mjs';
import Pandino from 'https://unpkg.com/@pandino/pandino/dist/esm/pandino.mjs';

const pandino = new Pandino({
    ...loaderConfiguration,
});

await pandino.init();
await pandino.start();

await pandino.getBundleContext().installBundle('https://unpkg.com/@pandino/bundle-installer-dom/dist/bundle-installer-dom-manifest.json');
```

## License

Eclipse Public License - v 2.0
