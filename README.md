# Pandino

[![build-test](https://github.com/BlackBeltTechnology/pandino/actions/workflows/build-test.yml/badge.svg)](https://github.com/BlackBeltTechnology/pandino/actions/workflows/build-test.yml)
[![Discord](https://img.shields.io/discord/1014474039017865256)](https://img.shields.io/discord/1014474039017865256)
[![license](https://img.shields.io/badge/license-EPL%20v2.0-blue.svg)](https://github.com/BlackBeltTechnology/pandino)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![Conventional Changelog](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-conventional--changelog-e10079.svg?style=flat)](https://github.com/conventional-changelog/conventional-changelog)
[![lerna--lite](https://img.shields.io/badge/maintained%20with-lerna--lite-e137ff)](https://github.com/ghiscoding/lerna-lite)

An OSGi - lite framework for JavaScript runtimes.

## Inspiration

Pandino is inspired by the [OSGi](https://www.osgi.org/resources/what-is-osgi/) framework originally created for Java.

Given the wast differences between the Java platform and JavaScript, Pandino only utilizes a limited set of the
[original specification](https://docs.osgi.org/specification/osgi.core/8.0.0/). In certain cases the "porting" of
features even altered the original standard. Such differences can be observed in the source code via comments, or in the
documentation it self.

#### Highlighted differences compared to OSGI

Most noteworthy differences compared to the OSGi standard are explained in the
[docs/osgi-comparison.md](./docs/osgi-comparison.md) document.

## Recommended use-cases

- There is a need to decouple an application at design time
- Functionality can come and go at runtime
- Parts of an application need to be customized without rebuilding the complete application
- You don't want to vendor-lock yourself to e.g.: build tools or complete frameworks
- You want to have complete control over how you manage your functionality

## Supported platforms

Pandino can be used as an [ES Module](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules) in browsers
and NodeJS v14, v16, and v18 as well. To support legacy setups, we export CJS modules as well, where applicable.

## Beginner's guide

For brevity's sake, we will demonstrate how to add Pandino to a pure and plain JavaScript application. We will also load
a custom service which will alter the application it self.

> Please visit the [examples](./examples) folder for more complex use-cases!

### 1) Create an Application

**index.html**
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="ie=edge" />
    <title>App with inverter</title>
  </head>
  <body>
    <h1>Hello!</h1>
    <p id="text-to-invert">This text should be inverted!</p>

    <script type="module">
      window.addEventListener('DOMContentLoaded', async () => {
        // 0. Import Pandino it self. Since we are running in the browsers with modules, we need
        // the .mjs version.
        const Pandino = (await import('./pandino.mjs')).default;
        const pandino = new Pandino({
          'pandino.manifest.fetcher': {
            fetch: async (uri) => (await fetch(uri)).json(),
          },
          'pandino.bundle.importer': {
            import: (activatorLocation) => import(activatorLocation),
          },
        });

        await pandino.init();
        await pandino.start();

        // Pandino should be up and running, which should be visible by looking at the console
        // window of your browser's dev-tools
      });
    </script>
  </body>
</html>
```

Pandino has 2 mandatory init parameters:
- `pandino.manifest.fetcher`: an object with a `fetch()` method where we implement the [Manifest](./docs/basics.md) loading mechanism
- `pandino.bundle.importer`: an object with an `import()` method where we implement the [Activator](./docs/basics.md) loading mechanism

The reason for why we need to manually define `pandino.manifest.fetcher` and `pandino.bundle.importer` is that 
Pandino it self is platform agnostic, which means that the "file loading" mechanism will be different in e.g. a Browser
compared to NodeJS.

Another benefit is that this way the library user can fine-tune the loading logic if needed (e.g.: handle proxies,
etc...).

A complete list of Framework configuration properties can be found in the corresponding source code:
[framework-config-map.ts](packages/@pandino/pandino-api/src/framework/framework-config-map.ts)

> For different platforms or languages, please check the [installation documentation](./docs/installation.md)!

### 2) Create a Bundle which exposes a string-inverter service

Every Bundle consists of at least 2 artifacts:
- One JSON file containing Manifest info necessary for Pandino to manage the Bundle and it's dependencies / features
- One Activator JavaScript file with or without the source code bundled into it
  - the Activator it self **MUST** be default exported!

**string-inverter.js**
```javascript
const STRING_INVERTER_INTERFACE_KEY = '@example/string-inverter/StringInverter';

class StringInverterImpl {
  invert(str) {
    return str.split('').reverse().join('');
  }
}

export default class Activator {
  inverterRegistration;

  async start(context) {
    // Registers the service with the scope type of SINGLETON
    this.inverterRegistration = context.registerService(STRING_INVERTER_INTERFACE_KEY, new StringInverterImpl());
  }

  async stop(context) {
    this.inverterRegistration.unregister();
  }
}
```

**string-inverter-manifest.json**
```json
{
  "Bundle-ManifestVersion": "1",
  "Bundle-SymbolicName": "@example/string-inverter",
  "Bundle-Name": "String Inverter",
  "Bundle-Version": "0.1.0",
  "Bundle-Activator": "./string-inverter.js"
}
```

The `Bundle-SymbolicName` property should be considered to be similar to the `name` property in a `package.json` file.

The `Bundle-SymbolicName` and `Bundle-Version` properties together serve as "composite keys" (make the bundle uniquely
identifiable)!

A complete list of Bundle Manifest Header properties can be found in the corresponding source code:
[bundle-manifest-headers.ts](packages/@pandino/pandino-api/src/bundle/bundle-manifest-headers.ts)

### 3) Wire the Bundle into our application

**index.html**
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="ie=edge" />
    <title>App with inverter</title>
  </head>
  <body>
    <h1>Hello!</h1>
    <p id="text-to-invert">This text should be inverted!</p>

    <script type="module">
      window.addEventListener('DOMContentLoaded', async () => {
        const Pandino = (await import('./pandino.mjs')).default;
        const pandino = new Pandino({
          'pandino.manifest.fetcher': {
            fetch: async (uri) => (await fetch(uri)).json(),
          },
          'pandino.bundle.importer': {
            import: (activatorLocation) => import(activatorLocation),
          },
        });

        await pandino.init();
        await pandino.start();
        
        // 1. Install our new bundle via it's manifest:
        const context = pandino.getBundleContext();
        
        await context.installBundle('./string-inverter-manifest.json');
        
        // 2. Obtain a Service Object
        const inverterReference = context.getServiceReference('@example/string-inverter/StringInverter');
        const inverterService = context.getService(inverterReference);
        
        // 3. Use our Service to invert some text in our DOM
        const paragraphToInvert = document.getElementById('text-to-invert');
        paragraphToInvert.textContent = inverterService.invert(paragraphToInvert.textContent);
      });
    </script>
  </body>
</html>
```
Keep in mind that Bundles can be managed by other Bundles as well! This means that you do not need to pass the actual
`pandino` or `BundleContext` reference in your app!

## Documentation

For detailed information about Pandino and it's internals, please check the [Documentation](./docs/README.md) page.

## Example Projects

Multiple example projects are available under the [examples](./examples) folder. Each example is a stand-alone,
dedicated project, which means that specific instructions regarding how to operate them are detailed in their respective
folders.

## Extras

This repository contains extra packages, e.g.: specifications, corresponding reference-implementations solving
common software development problems. Usage is opt-in of course.

### Bundle Installer

- [Bundle Installer - DOM](./packages/@pandino/bundle-installer-dom)
- [Bundle Installer - NodeJS](./packages/@pandino/bundle-installer-nodejs)

### Configuration Management

- [API](./packages/@pandino/configuration-management-api)
- [Configuration Management](./packages/@pandino/configuration-management)

### Event Admin

- [API](./packages/@pandino/event-api)
- [Event Admin](./packages/@pandino/event-admin)

### Persistence Manager

- [API](./packages/@pandino/persistence-manager-api)
- [Persistence Manager - In Memory](./packages/@pandino/persistence-manager-memory)
- [Persistence Manager - Localstorage](./packages/@pandino/persistence-manager-localstorage)

### Bundler Plugins

- [rollup-plugin-generate-manifest](./packages/@pandino/rollup-plugin-generate-manifest)

## License

Eclipse Public License - v 2.0
