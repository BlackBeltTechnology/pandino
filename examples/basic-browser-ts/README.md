# Basic Browser TS

A TypeScript example showcasing Pandino implementation details for a Browser-based project.

In this case not only the App it self, but our runtime Bundles are also written in TypeScript, in detached packages.

## Setup
- `npm i`
- `npm run build` to build the two bundles which we will pull in in the `app` package
- `./cp-dependencies.sh` to copy the built resources to `app`
- `npm start` to start the app
