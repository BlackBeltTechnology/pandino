# Pandino

[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lerna.js.org/)
[![build-test](https://github.com/BlackBeltTechnology/pandino/actions/workflows/build-test.yml/badge.svg)](https://github.com/BlackBeltTechnology/pandino/actions/workflows/build-test.yml)

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

## When to use Pandino

- There is a need to decouple an application at design time
- Functionality can come and go at runtime
- Parts of an application need to be customized without rebuilding the complete application
- You don't want to vendor-lock yourself to e.g.: build tools or complete frameworks
- You want to have complete control over how you manage your functionality

If you cannot see such requirements in your project, then this tool either a wrong fit for you, or you will likely only
be able to introduce a limited set of it's functionality!

## Understanding the main building blocks

### 1. Bundle

In Pandino a Bundle is a unit of modularization. A bundle is comprised of:
- A JSON descriptor containing details of a Bundle (Manifest Headers)
- At least one JavaScript file containing the actual code.

#### 1.1. Bundle Manifest Headers

Manifest Headers can be used by bundle developers to supply descriptive information about a Bundle.

#### 1.2. Bundle Lifecycle

Bundle lifecycle in Pandino is a simplified/modified version of the OSGi Bundle lifecycle.

```mermaid
stateDiagram-v2

[*] --> Installed
Installed --> Uninstalled
Uninstalled --> Installed
Installed --> Starting
Starting --> Stopping
Starting --> Active
Active --> Stopping
Stopping --> Installed
```

**Installed**

A Bundle goes to an `Installed` state when it's JavaScript code has been loaded successfully, or when it has been
stopped.

**Starting**

A Bundle changes state to `Starting` once all of it's pre-defined dependencies are met, and it's `activate()` method has
been called. Any Bundle failing to activate briefly transitions to the `Stopping` state.

**Active**

When a Bundle's `activate()` method has successfully ran, the `Starting` concludes, and the Bundle transitions to the
`Active` state.

> A Bundle's pre-defined `Providers` are only considered usable by the Framework if their host Bundle is in the `Active`
state!

**Stopping**

A Bundle can go to the `Stopping` state either when it's `stop()` method has been pragmatically called, or when it
fails to `activate()`.

Successful stopping results in the Bundle transitioning to the `Installed` state.

**Uninstalled**

The main differences between `Installed` and `Uninstalled` states are: if a Bundle ends up in a state of `Uninstalled`,
then it no longer participates in the Bundle resolution process, which means that even it's dependencies are satisfied
and resolved, it still won't be considered usable by the Framework. This means that other Bundles depending on such
Bundle won't ever start.

The only state a Bundle can transition from `Uninstalled` to is `Installed`, via programmatically re-installing it.

### 2. Service

Bundles are built around a set of cooperating Services available from a shared Service Registry. Such a Pandino service
is defined semantically by its Service Interface and implemented as a Service Object.

The Service Object is owned by, and runs within, a Bundle. This Bundle must register the Service Object with the
Pandino Service Registry so that the service's functionality is available to other Bundles under the control of Pandino.

Dependencies between the Bundle owning the Service and the Bundles using it are managed by the Framework. For example,
when a Bundle is stopped, all the Services registered with Pandino by that Bundle must be automatically unregistered.

Pandino also provides an event mechanism so that bundles can receive events of Services that are registered, modified,
or unregistered.

#### 2.1 Service References

In general, registered service objects are referenced through `ServiceReference` objects. This avoids creating
unnecessary dynamic service dependencies between bundles when a bundle needs to know about a service but does not
require the service object itself.

A `ServiceReference` object can be stored and passed on to other bundles without the implications of dependencies.
A `ServiceReference` object encapsulates the properties and other meta-information about the service object it
represents. This meta-information can be queried by a bundle to assist in the selection of a service that best suits its
needs.

#### 2.2 Service Interfaces

A service interface is the specification of the service's public methods.

In practice, a bundle developer creates a service object by implementing its service interface and registers the service
object with the Framework service registry via a `string` representing the interface.

> Since JavaScript does not support interfaces on a language level, we need to manually maintain a `string ` to
> `interface` pairing.
 
Once a bundle has registered a service object under an interface name, the associated service can be acquired by bundles
under that interface name.

When requesting a service object from the Framework, a bundle can specify the name of the service interface that the
requested service object must implement. In the request, the bundle may also specify a filter string to narrow the
search.

One class may implement multiple interfaces therefore when such service needs to be registered, we can do so by
providing a `string[]` representing each interface. On a consumer side, we can of course still obtain a
`ServiceReference` object corresponding to a single interface by requesting a service object by only one of it's
interface-representing strings.

#### 2.3 Service Properties

Properties hold information as key/value pairs. The key must be a `string` and the value should be a type recognized by
`Filter` objects. Multiple values for the same key are supported with arrays ([]).

The values of properties should be limited to primitive types to prevent unwanted inter bundle dependencies.

The key of a property is **case sensitive**. ObjectClass, OBJECTCLASS and objectclass are **NOT** the same property
keys.

The service properties are intended to provide information about the service. The properties should not be used to
participate in the actual function of the service. Modifying the properties for the service registration is a
potentially expensive operation.

The Filter interface supports complex filtering; it can be used to find matching services. Therefore, all properties
share a single namespace in the Framework service registry. Filter strings MUST adhere to LDAP standard filter patterns,
e.g.: `(|(someProp=test)(someProp=test-other))`

#### 2.4 Service Scopes

Currently, there are two types of scopes supported:

- `SINGLETON`
- `PROTOTYPE`

**SINGLETON**:

Whenever a developer tries to obtain a service via calling `bundleContext.getService<any>(reference)`, the framework
will always provide the same reference of the registered service.

**PROTOTYPE**:

Whenever a developer tries to obtain services via calling:

```typescript
const serviceObject = bundleContext.getServiceObjects<any>(reference);
const service1 = serviceObject.getService();
const service2 = serviceObject.getService();
```

the framework will provide a new instance from the registered `ServiceFactory<any>` for every `serviceObject.getService()`
call.

> Registration and handling of different scoped services will be discussed in a more detailed way later. In the meantime
> behavior can be observed in the corresponding tests: [bundle-context-impl.test.ts](./packages/@pandino/pandino/src/lib/framework/bundle-context-impl.test.ts)

## Beginner's guide

For brevity's sake, we will demonstrate how to add Pandino to a pure and plain JavaScript application. We will also load
a custom service which will alter the application it self.

> Please visit the [examples](./examples) folder for more complex use-cases!

### 1) Create the Application

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
- `pandino.manifest.fetcher`: an object with a `fetch()` method where we implement the Manifest loading mechanism
- `pandino.bundle.importer`: an object with an `import()` method where we implement the JavaScript loading mechanism

The reason why we need to manually define the `pandino.manifest.fetcher` and `pandino.bundle.importer` behavior is that 
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

### 3) Wire in the Bundle into our application

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

## Diving deeper

### Bundle Requirements and Capabilities

#### Provided Capabilities

A Bundle can define `0..*` "Capabilities" in it's Manifest, which is/are `string` / `string[]` values representing any
functionality provided by the Bundle. This string can be anything, the Bundle developer decides what these values are.

```json
{
  "Provide-Capability": "@scope/some-functionality;prop1=\"value1\";prop2=123"
}
```

In order for Bundles to further specify their capabilities, the capabilities can have additional attributes (separated
by semicolons), which Bundle consumers can use to filter for specific behavior if multiple bundles provide the same
functionality, but with different details (these are the `prop1` and `prop2` values in the example above).

#### Required Capabilities

A Bundle can define `0..*` required capabilities which it needs for it to be able to start. These are `string` /
`string[]` values.

```json
{
  "Require-Capability": "@scope/some-functionality;filter:=\"(prop2>=100)\""
}
```

When we would like to specify a required capability we can add an extra `filter` `directive` where we can fine-grain our
search criteria if needed. This filter **MUST** be in an LDAP filter compatible format! 

#### Concrete example

Let's say we would like to achieve the following:

```mermaid
classDiagram

    BundleA <.. BundleB : Requires funcionality from
    BundleA <.. BundleC : Requires funcionality from
    BundleB <.. BundleC : Requires funcionality from
    class BundleA {
    }
    class BundleB {
    }
    class BundleC {
    }
```

**bundle-a-manifest.json**:

```json
{
  "Bundle-ManifestVersion": "1",
  "Bundle-SymbolicName": "@example/bundle-a",
  "Bundle-Name": "Bundle A",
  "Bundle-Version": "0.1.0",
  "Bundle-Activator": "./bundle-a.js",
  "Provide-Capability": "@example/functionality;version=\"0.1.0\";bool-prop=true"
}
```

**bundle-b-manifest.json**:

```json
{
  "Bundle-ManifestVersion": "1",
  "Bundle-SymbolicName": "@example/bundle-b",
  "Bundle-Name": "Bundle B",
  "Bundle-Version": "1.4.12",
  "Bundle-Activator": "./bundle-b.js",
  "Provide-Capability": "@example/another-functionality;version=\"1.4.12\"",
  "Require-Capability": "@example/functionality;filter:=\"(&(version>=0.1.0)(bool-prop=true))\""
}
```

**bundle-c-manifest.json**:

```json
{
  "Bundle-ManifestVersion": "1",
  "Bundle-SymbolicName": "@example/bundle-c",
  "Bundle-Name": "Bundle C",
  "Bundle-Version": "0.0.12",
  "Bundle-Activator": "./bundle-c.js",
  "Require-Capability": [
    "@example/functionality;filter:=\"(version=0.1.0)\"",
    "@example/another-functionality;filter:=\"(version=*)\""
  ]
}
```

Please note that in case of `bundle-c-manifest.json` we do not define any `Provide-Capability` properties which is
completely fine if we do not want to allow other bundles to depend on it.

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

### Persistence Manager

- [API](./packages/@pandino/persistence-manager-api)
- [Persistence Manager - In Memory](./packages/@pandino/persistence-manager-memory)
- [Persistence Manager - Localstorage](./packages/@pandino/persistence-manager-localstorage)

### Configuration Management

- [API](./packages/@pandino/configuration-management-api)
- [Configuration Management](./packages/@pandino/configuration-management)

### Event Admin

- [API](./packages/@pandino/event-api)
- [Event Admin](./packages/@pandino/event-admin)

### React (DOM)

- [API](./packages/@pandino/react-dom-api)
- [React (DOM)](./packages/@pandino/react-dom)
- [Router (DOM)](./packages/@pandino/react-router-dom)

### Bundler Plugins

- [rollup-plugin-react-externalize](./packages/@pandino/rollup-plugin-react-externalize)
