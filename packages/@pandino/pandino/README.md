# Pandino

[![build-test](https://github.com/BlackBeltTechnology/pandino/actions/workflows/build-test.yml/badge.svg)](https://github.com/BlackBeltTechnology/pandino/actions/workflows/build-test.yml)
[![license](https://img.shields.io/badge/license-EPL%20v2.0-blue.svg)](https://github.com/BlackBeltTechnology/pandino)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![Conventional Changelog](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-conventional--changelog-e10079.svg?style=flat)](https://github.com/conventional-changelog/conventional-changelog)

This is the reference implementation of the [Pandino Framework API](../pandino-api).

## Context

This package is part of the [pandino-root](https://github.com/BlackBeltTechnology/pandino) monorepo. For detailed
information about what is Pandino / how this package fits into the ecosystem, please consult with the related
documentation(s).

## Adding Pandino to a plain JavaScript project

```html
<script type="module">
    import loaderConfiguration from 'https://unpkg.com/@pandino/loader-configuration-dom/dist/loader-configuration-dom.mjs';
    import Pandino from 'https://unpkg.com/@pandino/pandino/dist/esm/pandino.mjs';
    
    const pandino = new Pandino({
        ...loaderConfiguration,
    });
    
    await pandino.init();
    await pandino.start();
    
    console.log(pandino.getBundleContext());
</script>
```

## Adding Pandino to a TypeScript project (e.g. with Webpack)

Install Pandino via `npm install --save @pandino/pandino @pandino/loader-configuration-dom`.

Initialize it somewhere close in you applications own init logic, e.g.:

```typescript
import Pandino from '@pandino/pandino';
import loaderConfiguration from '@pandino/loader-configuration-dom';

const pandino = new Pandino({
  ...loaderConfiguration,
});

await pandino.init();
await pandino.start();

await pandino.getBundleContext().installBundle('some-bundle-manifest.json');
```

## Adding Pandino to a NodeJS (CJS) project

Install Pandino via `npm install --save @pandino/pandino @pandino/loader-configuration-nodejs`.

Initialize it somewhere close in you applications own init logic, e.g.:

```javascript
const Pandino = require("@pandino/pandino");
const loaderConfiguration = require("@pandino/loader-configuration-nodejs");

const deploymentRoot = path.normalize(path.join(__dirname, 'deploy'));

const pandino = new Pandino({
    ...loaderConfiguration,
    'pandino.deployment.root': deploymentRoot,
});

(async () => {
  await pandino.init();
  await pandino.start();

  await pandino.getBundleContext().installBundle('some-bundle-manifest.json');
})();
```

## License

Eclipse Public License - v 2.0
