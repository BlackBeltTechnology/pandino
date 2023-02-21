# React SystemJS

## packages

- app: application project
- component-api: abstraction for N number of implementations
- component-one: example implementation of `component-api`

## Why SystemJS?

When we are dealing with JSX, the JSX code gets transpiled in a way where
bundlers include additional imports for e.g.: `react/jsx-runtime`.

Due to this nature, we need a module system which is capable to handle "static"
imports. Our choice is [SystemJS](https://github.com/systemjs/systemjs).

The other reason why we need this is because we are building standalone packages, and are not "splitting" code
from a central source-code folder.

> Fun fact: we wouldn't need SystemJS if all browsers would support [import-maps](https://github.com/WICG/import-maps).

## Architecture

Since we are working with SystemJS and third party dependency imports need to be handled
properly (eliminate potential duplicate evaluation of same code) the current architecture
relies on:

- copied UMD modules such as `react`
- and additional manually re-packaged dependencies such as `react/jsx-runtime`, and `react-dom`

This re-packaging is done via dedicated `rollup` entry-points, e.g.: `generateRepackagedOutput('react-jsx-runtime', 'react/react-jsx-runtime'),`

Since the `app` project is our main entry point, the re-packaging is done here, but this is not mandatory.

### Re-packaging third party dependencies

Please check the `generateRepackagedOutput` helper function in `packages/app/rollup/helpers.mjs` for details.

> This is a super simple task to do in most cases, don't be afraid, no real black-magic is applied!

The generated sources are copied to `packages/app/dist`

When re-packaging third-party libraries, it is super important to pay attention to what is being imported from where!
The reason why we are not only `export * from 'whatever';` in all repackaged content is precisely this. To eliminate
redundant code evaluation. 
