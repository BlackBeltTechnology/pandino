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
  window.addEventListener('DOMContentLoaded', async () => {
    const Pandino = (await import('./pandino.mjs')).default;
    const pandino = new Pandino({
      'pandino.deployment.root': location.href,
      'pandino.bundle.importer': {
        import: (deploymentRoot, activatorLocation) => import(activatorLocation),
      },
      'pandino.manifest.fetcher': {
        fetch: async (deploymentRoot, uri) => (await fetch(uri)).json(),
      },
    });

    await pandino.init();
    await pandino.start();

    console.log(pandino.getBundleContext());
  });
</script>
```

## Adding Pandino to a TypeScript project (e.g. with Webpack)

Install Pandino via `npm install --save @pandino/pandino @pandino/pandino-api`.

Initialize it somewhere close in you applications own init logic, e.g.:

```typescript
import Pandino from '@pandino/pandino';
import {
  PANDINO_MANIFEST_FETCHER_PROP,
  PANDINO_BUNDLE_IMPORTER_PROP,
  DEPLOYMENT_ROOT_PROP,
} from '@pandino/pandino-api';

const pandino = new Pandino({
  [DEPLOYMENT_ROOT_PROP]: location.href + 'deploy',
  [PANDINO_MANIFEST_FETCHER_PROP]: {
    fetch: async (deploymentRoot: string, uri: string) => (await fetch(deploymentRoot + '/' + uri)).json(),
  },
  [PANDINO_BUNDLE_IMPORTER_PROP]: {
    import: (deploymentRoot: string, activatorLocation: string, manifestLocation: string) =>
      import(/* webpackIgnore: true */ deploymentRoot + '/' + activatorLocation),
  },
});

await pandino.init();
await pandino.start();

await pandino.getBundleContext().installBundle('some-bundle-manifest.json');
```

## Adding Pandino to a NodeJS (CJS) project

Install Pandino via `npm install --save @pandino/pandino`.

Initialize it somewhere close in you applications own init logic, e.g.:

```javascript
const Pandino = require("@pandino/pandino").default;
const path = require("path");
const fs = require("fs");

const deploymentRoot = path.normalize(path.join(__dirname, 'deploy'));

const pandino = new Pandino({
  'pandino.deployment.root': deploymentRoot,
  'pandino.bundle.importer': {
    import: (deploymentRoot, activatorLocation) => {
      return require(path.normalize(path.join(deploymentRoot, activatorLocation)));
    },
  },
  'pandino.manifest.fetcher': {
    fetch: async (deploymentRoot, uri) => {
      const data = fs.readFileSync(path.normalize(path.join(deploymentRoot, uri)), { encoding: 'utf8' });
      return JSON.parse(data);
    },
  },
});

(async () => {
  await pandino.init();
  await pandino.start();

  await pandino.getBundleContext().installBundle('some-bundle-manifest.json');
})();
```

## License

Eclipse Public License - v 2.0
