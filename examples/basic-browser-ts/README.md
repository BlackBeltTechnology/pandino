# Basic Browser TS

A TypeScript example showcasing Pandino implementation details for a Browser-based project.

In this case not only the App it self, but our runtime Bundles are also written in TypeScript, in detached packages.

## Setup
- Run `npm run build` in the Git Repository root
- Run `npm install` in this folder in order to update NPM links to the Pandino built sources
- Run `npm run build` in this folder to build dynamically imported Bundles for the `packages/app` project
- Run all the `./cp-dependencies.sh` commands in the `packages/app` folder to obtain dependencies

## Running the actual app
Run `npm start` in the `packages/app` folder to start a Webpack Dev Server

> Server will start at: http://localhost:8080

## Bonus

As an added bonus this project customizes the Framework's logging behaviour by printing messages in the DOM tree
instead of logging into the standard Browser Console ([packages/app/src/dom-logger.ts](./packages/app/src/dom-logger.ts)).
