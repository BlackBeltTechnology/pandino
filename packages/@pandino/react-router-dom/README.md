# react-router-dom

**EXPERIMENTAL TECHNOLOGY!**

A Pandino Bundle wrapping [React Router](https://reactrouterdotcom.fly.dev/) (DOM) itself

## Installation

### Install via adding it to `pandino-manifests`

> Only works, if *@pandino/bundle-installer-dom* is installed!

```html
<script type="pandino-manifests">
  [
    ...,
    "./react-router-dom-manifest.json"
  ]
</script>
```

### Install via BundleContext API

E.g.: directly via the Pandino instance.

```typescript
const pandino: Bundle;

// ...

pandino.getBundleContext().installBundle('./react-router-dom-manifest.json');
```

## Usage

### Install react-router-dom and @types/react-router-dom as peerDependencies

```json
{
  "peerDependencies": {
    "@types/react-router-dom": "^5.3.3",
    "@types/react": "^17.0.43",
    "react-router-dom": "^6.3.0"
  }
}
```
> Sadly `@types/react` is not enough, not all tokens / variables / functions / etc are defined in it...

When working with Pandino-wrapped bundles we usually rely on their usual exports, therefore we need the actual sources.

### imports

Since we will be using [@pandino/rollup-plugin-react-externalize](../rollup-plugin-react-externalize) we
can import any router-based sources as-per usual:

```typescript
import { HashRouter, Route, Routes, Link } from 'react-router-dom';

// ...
```

This is because third-party exports will be excluded from the generated artifact, and replaced with `pandino-react-router-dom`
service references.

### Configure bundler to generate a proper bundle artifact

We **MUST** declare a `Require-Capability` pointing to `@pandino/pandino-react-dom`:

```javascript
// ...
import { readFileSync } from 'fs';

const packageJSON = JSON.parse(readFileSync('package.json').toString('utf8'));

export default {
    // ...
    plugins: [
        // ...
        pandinoExternalizeReact({
            // ...
            manifestData: {
                // ...
                "Require-Capability": [
                    "@pandino/react-dom;filter:=\"(type=dom)\""
                ],
            },
        }),
    ],
};
```
