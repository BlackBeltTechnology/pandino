# rollup-plugin-react-externalize

**EXPERIMENTAL TECHNOLOGY!**

Rollup plugin to generate Pandino Bundles with decoupled React Components.

Plain JavaScript / TypeScript Bundles do not rely on bundler plugins, since we can write our `BundleActivator`s.

The reason why this plugin has been created is because when we are working with React, by using `JSX`, transpilers
generate code which relies on imported references. Such references however **SHOULD NOT** be bundled into our bundles,
given we don't want to duplicate `React` it self in each and every Bundle we create.

To negate this problem, one possible workaround is to exclude external dependencies from our packages, and generate
variables with corresponding Pandino Service References.

> Keep in mind that although `@pandino/pandino-react-dom` registers `React` references as services, other third party
  features should be bundled by third parties / you in order for them to be available at runtime!

This plugin will always generate service-reference based variable resolution code whether the corresponding services are
actually available or not.

## Usage

Example usage on creating TypeScript powered React components integrated into Pandino.

```javascript
import typescript from '@rollup/plugin-typescript';
import { pandinoExternalizeReact } from '@pandino/rollup-plugin-react-externalize';
import { readFileSync } from "fs";

const packageJSON = JSON.parse(readFileSync('package.json').toString('utf8'));

export default {
    input: 'src/index.ts',
    output: [
        {
            file: 'dist/app-custom.mjs',
            format: 'esm',
        }
    ],
    plugins: [
        typescript({ tsconfig: './tsconfig.json' }),
        pandinoExternalizeReact({
            prettify: true,
            componentsMap: [
                {
                    component: 'CustomDashboardPageComponent',
                    identifier: '@scope/react-ts-component-proxy/pages/Dashboard',
                    props: {
                        'service.ranking': 90,
                    },
                },
            ],
            manifestData: {
                "Bundle-ManifestVersion": "1",
                "Bundle-SymbolicName": packageJSON.name,
                "Bundle-Name": "App Custom",
                "Bundle-Version": packageJSON.version,
                "Bundle-Description": packageJSON.description,
                "Bundle-Activator": "./app-custom.mjs",
                "Require-Capability": "app.platform;filter:=\"(type=DOM)\""
            },
        }),
    ],
};

```

## Configuration

### manifestData
Type: `object`

Bundle Header info representing our Bundle.

Example:

```javascript
const { readFileSync } = require('fs');
const packageJSON = JSON.parse(readFileSync('package.json').toString('utf8'));

pandinoExternalizeReact({
    // ...
    manifestData: {
        "Bundle-ManifestVersion": "1",
        "Bundle-SymbolicName": packageJSON.name,
        "Bundle-Name": "My Bundle",
        "Bundle-Version": packageJSON.version,
        "Bundle-Description": packageJSON.description,
        "Bundle-Activator": "./my-bundle.mjs",
        "Require-Capability": [
            "@package/some-capability;filter:=(type=dom)",
            "@other-package/other-cap;filter:=(objectClass=@other/package/myClass)"
        ],
        "Provide-Capability": "@example/super-feat;keyword=rule-the-world"
    }
})
```

### componentsMap
Type: `Array<{component: string, identifier: string, props: object}>`

A list of component descriptors. The `component` name **MUST** match with the generated token of the component you want
to expose.

The `identifier` will be the `objectClass` value which the component will be mapped to (wrapped by a service).

You can also provide any number of `props`.

### externalsMapping
Type: `Record<string, string>`

A collection of key-value pairs representing actual import path -> Pandino service mapping.

When you are writing your bundle code, you will have external imports, e.g.: `import { useEffect } from 'react';`.

In such cases you must tell the bundler what code should it generate in order to procure the necessary `useEffect`
reference.

Example:

```javascript
const defaultExternalsMapping = {
  // ...
  'react': '@pandino/react-dom/react',
};
```
In such case the bundler will generate the following code fragment:

```javascript
this.useEffectRef = context.getServiceReference('@pandino/react-dom/react/useEffect');
const useEffect = context.getService(this.useEffectRef);
```

### externalRefs
Type: `Array<{token: string, identifier: string}>`

An explicit list of mappings where you can define which import `token` should come from what service and what `identifier`.

> This is a fine-grained extension of the `externalsMapping` configuration

Only use this option if for some reason the generated token(s) produced by the `externalsMapping` fail / do not match!

Example:

```javascript
externalRefsMap: [
    { token: 'useBundleContext',  identifier: '@example/app-platform-api/useBundleContext' },
    { token: 'jsx',               identifier: '@pandino/react-provider/react/jsx-runtime/jsx' },
],
```

### minify
Type: `boolean`

Whether to minify the output or not. Sourcemaps are not supported yet!

### prettify
Type: `boolean`

Whether to prettify the generated source code or not.

Default formatting rules:

```javascript
const defaultPrettierConfig = {
  parser: 'babel',
  printWidth: 120,
  singleQuote: true,
  trailingComma: 'all',
};
```

### prettierConfig
type: `object`

Custom Prettier config if the built-ins are not sufficient. 

### peerDependencies
Type: `boolean`

Default: `true`

Whether the bundler should exclude every import coming from the `package.json` file's `peerDependencies` section.
Excluded sources will not be included in the generated source code, therefore most likely you'll need `externalsMapping`s. 

### dependencies
Type: `boolean`

Default: `false`

Whether the bundler should exclude every import coming from the `package.json` file's `dependencies` section.

> Works similarly to the `peerDependencies` configuration.

### mockProcess
Type: `object?`

Some third party packages rely on a `process` variable. In such cases at least an empty "implementation" could be
necessary. The provided value will be serialized into a valid JSON object. The generated code segment will be placed at
the beginning of the file.


## Troubleshooting

### Unresolved reference error

If you configured the plugin to resolve tokens from pandino bundles, but the corresponding service(s) is/are not
registered when your bundle's activator tries to start, you'll get a reference error from JavaScript it self.

To resolve this, check the generated code, and search for

- unresolved variables
- service identifiers which you can look up whether they are not available
