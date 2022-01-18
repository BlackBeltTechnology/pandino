# Pandino

[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lerna.js.org/)
[![build-test](https://github.com/BlackBeltTechnology/pandino/actions/workflows/build-test.yml/badge.svg)](https://github.com/BlackBeltTechnology/pandino/actions/workflows/build-test.yml)

An OSGi - lite framework for JavaScript runtimes.

## Motivation

Currently we are living in a world of ever-growing dependencies in our projects. We are piling up tools
from left to right achieve functionality necessary to deliver projects.

Some of our dependencies are meant to solve build pipeline-related tasks, some to solve bundling and splitting up
projects based on feature islands, a.k.a.: micro-frontends, etc...

The goal of Pandino is to provide a dynamic runtime for the JavaScript platform, while eliminating or at least reducing
the need of bundlers or other tools to manage dependencies, or decoupling of functionality.

Although we are calling Pandino a "framework", it's only actually warranted in a sense where it provides best
practices and guidelines how you can integrate with / into it, but it's not exclusive in a sense where it can be
actually used as a side-car library for partial functionality.

## Inspiration

Pandino is inspired by the [OSGi](https://www.osgi.org/resources/what-is-osgi/) framework originally created for Java.

Given the wast differences between the Java platform and JavaScript, Pandino only utilizes a limited set of the
[original specification](https://docs.osgi.org/specification/osgi.core/8.0.0/). In certain cases the "porting" of
features even altered the original standard. Such differences can be observed in the source code via comments, or in the
documentation it self.

## Who is Pandino intended for

The core of Pandino is aimed at projects where:
- There is a need for runtime decoupling
- Functionality can come and go at runtime
- The project is utilizing other libraries / frameworks which can be either wrapped in Pandino Bundles, or partially
  comply with real dynamic behaviour (installation, modification, uninstallation)

If you cannot see such requirements in your project, then this tool either a wrong fit for you, or you will likely only
be able to introduce a limited set of it's functionality!

Pandino also comes with a growing list of first-party "extra" Bundles which build on top of it's core and provide
functionality on a higher level, e.g.: Bundle loaders, eventing systems, configuration management, etc...

Such extras are physically separated into external packages so that you can pull them in on-demand.

## What Pandino is not / caveats

> Pandino won't solve business problems. Pandino is intended to solve technical problems.

It is important to note that when we start to incorporate more and more dynamism in our projects, the complexity can
easily sky-rocket!

Given resources are managed in/via Bundles, the quality of each third-party Bundle can cause serious issues if a Bundle
in question is poorly implemented, e.g.: not handling lifecycle properly or not freeing up resources properly.

Every Bundle which we want to introduce **SHOULD** be inspected in detail to make sure it has minimal or no negative
side effects in our scope!

In our case, the quote "With Great Power Comes Great Responsibility" truly applies.

## Key Architectural Decisions

- Pandino is built on top of TypeScript, and TS support will always be a given for all first party packages
- Supported platforms are: Browsers and NodeJS
- Service decoupling is achieved via interfacing, which means that cross-bundle service references do not require
  class imports which results in super-lean bundles.
- Testing is paramount, but from a coverage perspective, reaching 100% coverage is not a goal. The actual goal is
  reaching confidence
- "Extra" Bundles may or may not contain tests, depending on how complicated they are
- Some necessary initialization parameters such as the `BundleImporter` and `ManifestFetcher` will always rely on
  platform specific standard solutions, e.g.: native `import` / `require` and native `fetch` depending on platform.
- Similarly to OSGi, Pandino it self is a Bundle as well, just like any other building block
- Configurability of the Pandino instance is paramount

## Highlighted differences compared to OSGI

| Feature                   | OSGi                                                                     | Pandino                                                                                                                     |
|---------------------------|--------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------|
| `BundleActivator` methods | `sync`                                                                   | `async`                                                                                                                     |
| Bundle States             | A Bundle only goes to `RESOLVED` state once the class loader is prepared | Every Bundle goes to `RESOLVED` from `INSTALLED` instantly since there is no class loader in JavaScript                     |
| Service Scopes            | `SINGLETON`, `PROTOTYPE`, `BUNDLE`                                       | Only `SINGLETON` is supported currently                                                                                     |
| Version Type              | Self-defined `Version` type                                              | Full-blown `SemVer`                                                                                                         |
| `BundleContext` APIs      | Self-defined, full                                                       | Limited / modified set of the OSGi specification                                                                            |
| `Wiring` and `Wire` APIs  | Self-defined, full                                                       | Limited set of the OSGi specification                                                                                       |
| Persistent Storage        | Self-defined, e.g.: Configuration, Bundle-caches, etc...                 | None by default, but for "extras" a custom implementation of the `PersistenceManager` may persist to Browser storage / Disk |
| Caching in general        | Self-defined                                                             | Nothing is cached in a traditional sense, all core-information is stored in memory                                          |
| BundleArchive             | `.jar` file(s) containing manifests and Java classes                     | `json` file containing manifest headers, plus a mandatory reference to an activator file (`.js`)                            |
| `StartLevel` concept      | Self-defined, full                                                       | Completely omitted                                                                                                          |
| `Bundle-ActivationPolicy` header | `EAGER`, `LAZY`                                                   | Only `EAGER`                                                                                                                |
| `Require-Bundle` header   | Supported                                                                | Not supported yet                                                                                                           |
| `Import-Package`, `Export-Package` headers | Self-defined, full                                      | No support planned                                                                                                          |
| Requirement `Resolution` directive    | Self-defined, full                                           | Not implemented, every Requirement is considered `mandatory`                                                                |

## Key Building blocks

### 1. Bundle

In Pandino a Bundle is a unit of modularization. A bundle is comprised of:
- Headers describing details of a Bundle and
- A JavaScript file containing the actual code (Activator).

#### 1.1. Bundle Manifest Headers

Manifest Headers can be used by bundle developers to supply descriptive information about a Bundle.

There are a few mandatory headers which **MUST** be provided by a Manifest:

```typescript
export interface BundleManifestHeaders {
  [BUNDLE_SYMBOLICNAME]: string;
  [BUNDLE_VERSION]: string;
  [BUNDLE_ACTIVATOR]: string | BundleActivator;
  // ...
}
```
> Missing out any of the above will result in a bundle being stuck in a `RESOLVED` state indefinitely.

#### 1.2. Bundle Version

Every Bundle must provide a [semver-compliant](https://www.npmjs.com/package/semver) version number in all relevant
parts of a Manifest!

### 2. Service

Bundles are built around a set of cooperating Services available from a shared Service Registry. Such a Pandino service
is defined semantically by its Service Interface and implemented as a Service Object.

The Service Interface should be specified with as few implementation details as possible. In Pandino we have specified
many Service Interfaces for common needs and will specify more in the future.

The Service Object is owned by, and runs within, a Bundle. This Bundle must register the Service Object with the
Pandino Service Registry so that the service's functionality is available to other Bundles under the control of Pandino.

Dependencies between the Bundle owning the Service and the Bundles using it are managed by the Framework. For example,
when a Bundle is stopped, all the Services registered with Pandino by that Bundle must be automatically unregistered.

Pandino maps Services to their underlying Service Objects, and provides a simple but powerful query mechanism that
enables a bundle to request the Services it needs. Pandino also provides an event mechanism so that bundles can receive
events of Services that are registered, modified, or unregistered.

## Usage

### Configuration for initialization

There are a couple of mandatory parameters which need to be provided in order to instantiate Pandino.

The complete configuration schema is the following (available under [framework-config-map.ts](packages/@pandino/pandino-api/src/framework/framework-config-map.ts)):

```typescript
export interface FrameworkConfigMap extends Record<string, any> {
  [DEPLOYMENT_ROOT_PROP]: string;
  [PANDINO_MANIFEST_FETCHER_PROP]: ManifestFetcher;
  [PANDINO_BUNDLE_IMPORTER_PROP]: BundleImporter;
  [LOG_LOGGER_PROP]?: Logger;
  [LOG_LEVEL_PROP]?: LogLevel;
}
```

### Adding Pandino to a plain JavaScript project

```html
<script type="module">
  window.addEventListener('DOMContentLoaded', async () => {
    const Pandino = (await import('./pandino.js')).default;
    const pandino = new Pandino({
      'pandino.deployment.root': location.href,
      'pandino.bundle.importer': {
        import: (deploymentRoot, activatorLocation) => import(activatorLocation),
      },
      'pandino.manifest.fetcher': {
        fetch: async (deploymentRoot, uri) => (await fetch(uri)).json(),
      },
    });

    await pandino.init();
    await pandino.start();

    console.log(pandino.getBundleContext());
  });
</script>
```

### Adding Pandino to a TypeScript project (e.g. with Webpack)

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
    fetch: async (deploymentRoot: string, uri: string) => (await fetch(deploymentRoot + '/' + uri)).json(),
  },
  [PANDINO_BUNDLE_IMPORTER_PROP]: {
    import: (deploymentRoot: string, activatorLocation: string, manifestLocation: string) =>
      import(/* webpackIgnore: true */ deploymentRoot + '/' + activatorLocation),
  },
});

await pandino.init();
await pandino.start();

await pandino.getBundleContext().installBundle('some-bundle-manifest.json');
```

### Creating a Bundle which exposes a Service (TypeScript)

#### index.ts

```typescript
import { Activator } from './activator';
export * from './string-inverter';

export default Activator;
```

#### activator.ts

```typescript
import { BundleActivator, BundleContext, Logger, ServiceReference } from '@pandino/pandino-api';
import { SERVICE_INTERFACE, StringInverter } from './string-inverter';
import { stringInverterImpl } from './string-inverter-impl';

export default class Activator implements BundleActivator {
  private inverterRegistration: ServiceRegistration<StringInverter>;

  async start(context: BundleContext): Promise<void> {
    this.inverterRegistration = context
            .registerService<StringInverter>(SERVICE_INTERFACE, stringInverterImpl);

    return Promise.resolve();
  }

  async stop(context: BundleContext): Promise<void> {
    inverterRegistration.unregister();

    return Promise.resolve();
  }
}
```

#### string-inverter.ts

It is important to export every interface separately in order to let consumer Bundles to be able to tree shake off the
implementation from their own contexts! The actual implementation will be provided by Pandino when appropriate.

```typescript
export const SERVICE_INTERFACE = '@scope/exmaple/StringInverter';

export type StringInverter = (str: string) => string;
```

#### string-inverter-impl.ts

```typescript
import { StringInverter } from './string-inverter';

export const stringInverterImpl: StringInverter = (str: string) => {
  return str.split('').reverse().join('');
};
```

### Consuming Services exposed by other Bundles (TypeScript)

The following example relies on the fact that we are consuming a Service which is guaranteed to be available
at the time our `BundleActivator` implementation `start()`s.

In a more real-world scenario this is not guaranteed, therefore a `null` check has to be applied, and in case
the requested Service is not yet ready, we would need to register a `ServiceListener` to get notified once said
Service becomes available!

#### activator.ts

```typescript
import { BundleActivator, BundleContext, Logger, ServiceReference } from '@pandino/pandino-api';

export default class Activator implements BundleActivator {
  private loggerReference: ServiceReference<Logger>;
  private logger: Logger;

  async start(context: BundleContext): Promise<void> {
    this.loggerReference = context.getServiceReference<Logger>('@pandino/pandino/Logger');
    this.logger = context.getService(this.loggerReference);

    this.logger.info('Yayy');

    return Promise.resolve();
  }

  async stop(context: BundleContext): Promise<void> {
    context.ungetService(this.loggerReference);
    return Promise.resolve();
  }
}

```

## Example Projects

Multiple example projects are available under the [examples](./examples) folder. Each example is a stand-alone,
dedicated project, which means that specific instructions regarding how to operate them are detailed in their respective
folders.

## Extras

This repository contains extra packages, e.g.: specifications, corresponding reference-implementations solving 
common software development problems. Usage is opt-in of course.

### Bundle Installer

- [API](./packages/@pandino/pandino-bundle-installer-api)
- [Pandino - DOM](./packages/@pandino/pandino-bundle-installer-dom)
- [Pandino - NodeJS](./packages/@pandino/pandino-bundle-installer-nodejs)

### Persistence Manager

- [API](./packages/@pandino/pandino-persistence-manager-api)
- [Pandino - In Memory](./packages/@pandino/pandino-persistence-manager-memory)

### Configuration Management

- [API](./packages/@pandino/pandino-configuration-management-api)

### Event Admin

- [API](./packages/@pandino/pandino-event-api)
- [Pandino - Event Admin](./packages/@pandino/pandino-event-admin)

## TODO

- Add ConfigAdmin implementation
- Add EventAdmin implementation
- Remove json manifest concept, and use js-only bundles to improve DX
- Improve Logger API, and built in Logger implementation
- Add more tests for Bundle Activator lifecycle
  - e.g.: auto de-registration of services on `stop()`
- Add more tests for bundle dependency chains
  - e.g.: 50+ pre-generated bundle configurations as a tree
- Change bundling system (separate target environments instead of 1 mixed module) 
  - provide CJS modules
  - provide ESM modules
- Document use-cases
- Go through `TODO` and `FIXME` blocks in code and finish / close such sections
- Bring back NodeJS 14 support ( ? )
