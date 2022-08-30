# rollup-plugin-generate-manifest

[![build-test](https://github.com/BlackBeltTechnology/pandino/actions/workflows/build-test.yml/badge.svg)](https://github.com/BlackBeltTechnology/pandino/actions/workflows/build-test.yml)
[![license](https://img.shields.io/badge/license-EPL%20v2.0-blue.svg)](https://github.com/BlackBeltTechnology/pandino)
[![Conventional Changelog](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-conventional--changelog-e10079.svg?style=flat)](https://github.com/conventional-changelog/conventional-changelog)

Generates Pandino Manifest JSON files based on `package.json` info.

## Context

This package is part of the [pandino-root](https://github.com/BlackBeltTechnology/pandino) monorepo. For detailed
information about what is Pandino / how this package fits into the ecosystem, please consult with the related
documentation(s).

## Install

### Add the plugin to your rollup config

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
    generateManifest(),
  ],
};
```

### [OPTIONAL] Set up a pandino section in your package.json file

Firstly you need to set up a `pandino.manifest` section in your `package.json` file.

This section may contain Pandino Manifest Header contents. By default the plugin will generate the basics based on the
info in `package.json`. Any entry in this section overrides the default values, you may use this feature to override
defaults.

Example: adding a `"Provide-Capability"` section to the generated Manifest file.

```json
{
  "name": "@test/test-api",
  "version": "0.1.0",
  "description": "Test API",
  "pandino": {
    "manifest": {
      "Provide-Capability": "${name};type=\"DOM\";test=${test}"
    }
  }
}

```

> The `"Bundle-Activator"` part of the Manifest is generated based on the Rollup context, so it should be taken care of
out-of-box for any number of outputs.

## Configuration options

### addBundleLicenseEntry

default: `true`

Whether the plugin should add the `Bundle-License` entry to the manifest.

### bundleLicenseValue

values: `'relative-path'` | `'inline'` | `'package-license'`

default: `'relative-path'`

**'relative-path':**

This option sets the `Bundle-License` header value to a relative file path, and copies the License file.

**'inline':**

This option inlines the License file contents to the value of the `Bundle-License` header.

**'package-license':**

This option sets the `Bundle-License` header value to whatever you have set in as a `license` value in your
`package.json` file.

### licenseFileRegex

default: `'^LICENSE(\\.txt)?$'`

The regex pattern to use to find LICENSE files in our projects.

## License

Eclipse Public License - v 2.0
