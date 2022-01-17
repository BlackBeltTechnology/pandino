# Pandino

[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lerna.js.org/)
[![build-test](https://github.com/BlackBeltTechnology/pandino/actions/workflows/build-test.yml/badge.svg)](https://github.com/BlackBeltTechnology/pandino/actions/workflows/build-test.yml)

Everything is dynamic.

## Motivation

TBA

## Usage

The most important documentation is available in the [packages/@pandino/pandino-api](./packages/@pandino/pandino-api)
package. Please refer to it in order to learn how to use Pandino.

## Examples

Multiple examples are available under the [examples](./examples) folder. Each example is a stand-alone, dedicated
project, which means that specific instructions are detailed in all of the folders.

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
