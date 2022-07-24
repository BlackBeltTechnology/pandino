# rollup-plugin-generate-manifest

Generates Pandino Manifest JSON files based on `package.json` info.

## Install

### Set up the pandino section in your package.json file

The `pandino.manifest` section may contain variables in format similar to JavaScript template strings,
e.g.: `${variable}`.

Variable resolution is firstly based off of every first-level attribute in `package.json`, but you may add additional
values via plugin config explained below.

```json
{
  "name": "@test/test-api",
  "version": "0.1.0",
  "description": "Test API",
  "pandino": {
    "manifest": {
      "Bundle-ManifestVersion": "1",
      "Bundle-SymbolicName": "${name}",
      "Bundle-Name": "Long name of our Bundle",
      "Bundle-Version": "${version}",
      "Bundle-Description": "${description}",
      "Bundle-Activator": "./test-api-dom.mjs",
      "Provide-Capability": "${name};type=\"DOM\";test=${test}"
    }
  }
}

```

### Add plugin to your rollup config

```javascript
// other imports
import generateManifest from '@pandino/rollup-plugin-generate-manifest';

export default {
  input: 'src/index.ts',
  output: {
    dir: 'dist',
    format: 'cjs'
  },
  // ...
  plugins: [
    // ...
    generateManifest({
      target: 'dist/test-api-manifest.json',
    }),
  ],
};
```

## Configuration options

### target

Type: `string`

Required: `true`

Target to the manifest file we would like to generate.

### extraTokens

Type: `Record<string, string | number | boolean>`

Target to the manifest file we would like to generate.

You may add additional key-value pairs here. These values will be picked up besides the root level attributes coming
from `package.json`.

Example:

```javascript
import generateManifest from '@pandino/rollup-plugin-generate-manifest';

export default {
  // ...
  plugins: [
    // ...
    generateManifest({
      target: 'dist/test-api-manifest.json',
      extraTokens: {
        test: '444',
      },
    }),
  ],
};
```
