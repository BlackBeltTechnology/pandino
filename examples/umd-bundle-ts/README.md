# UMD Bundle TS

A TypeScript example showcasing Pandino loading an UMD Bundle instead of standard ESM.

## Setup
- `npm i`
- `npm run build`
- `npx serve dist` to start a dev server

## Explanation

Given the example:

```javascript
import loaderConfiguration from 'https://unpkg.com/@pandino/loader-configuration-dom/dist/loader-configuration-dom.mjs';
import Pandino from '...';

const pandino = new Pandino({
  ...loaderConfiguration,
  'pandino.activator.resolvers': {
    'umd': {
      resolve: (module, headers) => {
        return window[headers['Bundle-UMD-Name']].default;
      },
    },
  },
});
```

we are adding an `ActivatorResolver` to the `PANDINO_ACTIVATOR_RESOLVERS` (pandino.activator.resolvers) configuration
