# Installation

In the sections below, we will showcase different use-cases in which you can install Pandino

## Adding Pandino to a plain JavaScript project

```html
<script type="module">
    import loaderConfiguration from 'https://unpkg.com/@pandino/loader-configuration-dom@latest/dist/@pandino/loader-configuration-dom.mjs';
    import Pandino from 'https://unpkg.com/@pandino/pandino@latest/dist/@pandino/pandino.mjs';

    const pandino = new Pandino({
        ...loaderConfiguration,
    });

    await pandino.init();
    await pandino.start();

    console.log(pandino.getBundleContext());
</script>
```

## Adding Pandino to a TypeScript project (e.g. with Webpack)

Install Pandino via `npm install --save @pandino/pandino @pandino/pandino-api`.

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

Install Pandino via `npm install --save @pandino/pandino`.

Initialize it somewhere close in you applications own init logic, e.g.:

```javascript
const Pandino = require("@pandino/pandino");
const path = require("path");
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
