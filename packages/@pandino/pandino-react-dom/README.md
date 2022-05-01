# pandino-react-dom

**EXPERIMENTAL TECHNOLOGY!**

A Pandino Bundle wrapping [React](https://reactjs.org/) itself with 
[React DOM](https://reactjs.org/docs/react-dom.html).

## Installation

### Install via adding it to `pandino-manifests`

> Only works, if *@pandino/pandino-bundle-installer-dom* is installed!

```html
<script type="pandino-manifests">
  [
    ...,
    "./pandino-react-dom-manifest.json"
  ]
</script>
```

### Install via BundleContext API

E.g.: directly via the Pandino instance.

```typescript
const pandino: Bundle;

// ...

pandino.getBundleContext().installBundle('./pandino-react-dom-manifest.json');
```

## Usage

### Install react and react-dom as peerDependencies

```json
{
  "peerDependencies": {
    "@pandino/pandino-react-dom": "^0.1.0",
    "@types/react": "^17.0.43",
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  }
}
```
> Sadly `@types/react` is not enough, not all tokens / variables / functions / etc are defined in it...

When working with Pandino-wrapped bundles we usually rely on their usual exports, therefore we need the actual sources.

The plugin [@pandino/rollup-plugin-pandino-react-externalize](../rollup-plugin-pandino-react-externalize) will exclude them at the build step!

### Define React App component DOM node

Somewhere in your HTML file define a DOM-node where we mount React as-per usual:

```html
<body>
    <div id="root"></div>
    <!-- ... -->
</body>
```
### Provider startup parameters for the Bundle

```javascript
const pandino = new Pandino({
    // ...
    'react-dom-element-selector': '#root',
    'react-dom-application-object-class': 'example-application',
});
```

**Params:**
- `react-dom-element-selector`: component CSS selector for the root-node
- `react-dom-application-object-class`: `objectClass` of the React component which we want to mount

> As you can see, it is expected from Bundle users to register at least the root component as a Pandino Service.

### Create the root component

#### Application.tsx

```tsx
import { useState } from 'react';

export function Application() {
    const [greeting] = useState<string>('Sir');
    
    return (
        <h3>Hello {greeting}!</h3>
    );
} 
```

#### index.tsx

```tsx
export * from './Application';
```

### Configure bundler to generate a proper bundle artifact

In this example we'll use Rollup, since we have a first-party plugin for it already: [@pandino/rollup-plugin-pandino-react-externalize](../rollup-plugin-pandino-react-externalize).

```javascript
import typescript from '@rollup/plugin-typescript';
import { pandinoExternalizeReact } from '@pandino/rollup-plugin-pandino-react-externalize';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { readFileSync } from 'fs';

const packageJSON = JSON.parse(readFileSync('package.json').toString('utf8'));

export default {
    input: 'src/index.ts',
    output: [
        {
            file: 'dist/application.mjs',
            format: 'esm',
        }
    ],
    plugins: [
        nodeResolve(),
        commonjs(),
        typescript({ tsconfig: './tsconfig.json' }),
        pandinoExternalizeReact({
            prettify: true,
            componentsMap: [
                {
                    component: 'Application',
                    identifier: 'example-application',
                    props: {
                        'some-prop': 'yayy',
                    },
                },
            ],
            manifestData: {
                "Bundle-ManifestVersion": "1",
                "Bundle-SymbolicName": packageJSON.name,
                "Bundle-Name": "Application",
                "Bundle-Version": packageJSON.version,
                "Bundle-Description": packageJSON.description,
                "Bundle-Activator": "./application.mjs",
                "Require-Capability": [
                    "@pandino/pandino-react-dom;filter:=\"(type=dom)\""
                ],
                "Provide-Capability": "example-application;type=\"dom\""
            },
        }),
    ],
};
```

Please note that in the `componentsMap` section we are exporting a component wrapper service with the `identifier` of
`example-application` which matches the value we provided as a `react-dom-application-object-class` value in the
previous section!
