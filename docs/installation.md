# Installation

In the sections below, we will showcase different use-cases in which you can install Pandino

## Adding Pandino to a plain JavaScript project

```html
<script type="module">
  window.addEventListener('DOMContentLoaded', async () => {
    const Pandino = (await import('./pandino.js')).default;
    const pandino = new Pandino({
      'pandino.bundle.importer': {
        import: (activatorLocation) => import(activatorLocation),
      },
      'pandino.manifest.fetcher': {
        fetch: async (uri) => (await fetch(uri)).json(),
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
    fetch: async (uri: string, deploymentRoot?: string) => (await fetch(uri)).json(),
  },
  [PANDINO_BUNDLE_IMPORTER_PROP]: {
    import: (activatorLocation: string, manifestLocation: string, deploymentRoot?: string) =>
      import(/* webpackIgnore: true */ activatorLocation),
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
const Pandino = require("@pandino/pandino");
const path = require("path");
const fs = require("fs");

const deploymentRoot = path.normalize(path.join(__dirname, 'deploy'));

const pandino = new Pandino({
  'pandino.deployment.root': deploymentRoot,
  'pandino.bundle.importer': {
    import: (activatorLocation, manifestLocation, deploymentRoot) => {
      return require(path.normalize(path.join(deploymentRoot, activatorLocation)));
    },
  },
  'pandino.manifest.fetcher': {
    fetch: async (uri, deploymentRoot) => {
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
