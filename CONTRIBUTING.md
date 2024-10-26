# Contributing to Pandino

## Environment

If you don't have it already, we recommend installing [nvm](https://github.com/nvm-sh/nvm?tab=readme-ov-file#installing-and-updating).

Once installed, you can issue the following command to set up the appropriate NodeJS version:

```bash
nvm use
```

For package management we use [PNPM](https://pnpm.io/) instead of NPM. If you don't have it already, you can install it via:

```bash
npm i - g pnpm
```

## CMDs

```
# Install deps:
pnpm i

# Format code:
pnpm run format

# Build all packages (excluding example project):
pnpm run build

# Run tests
pnpm run test
```

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

## Notes

### Tree-shaking
Do not export `enum`s, messes up tree-shaking, use `type`s instead!

### Testing

In order for IDEs to be able to provide proper breakpoints and debugging support, JEST needs a dedicated
`tsconfig.test.json` file in every project.

The reason for this is that in bundle outputs we usually do not provide source-maps, but IDEs rely on them.

## Sources

- https://docs.osgi.org/specification/osgi.core/8.0.0/framework.lifecycle.html
- https://docs.osgi.org/specification/osgi.core/8.0.0/framework.service.html
- https://docs.osgi.org/specification/osgi.core/8.0.0/framework.api.html

## Temporary scripts

```
npx conventional-changelog-cli -p angular -i CHANGELOG.md -s -r 0
```
