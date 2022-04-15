# pokedex-react-dom

This is a complex, decoupled, highly dynamic, and configurable app, showcasing multiple Pandino capabilities.

## Setup
- Run `npm run build` in the Git Repository root
- Run `./cp-extra-manifests.sh` in this folder to obtain dependencies

## Building all bundles
Run `npm run build` in this folder to compile all Bundles.

> Every Bundle can be built on it's own. Also, every Bundle copies the build results to the `runtime` package!

## Starting the app
- Run `./start.sh` in the current folder

The app will be available at: http://localhost:8000/packages/runtime/

## Project details

### Runtime

It is a super-simple, classic HTML page which pulls in Pandino, and other bundles. There is no need for NPM, or any
build step. Just edit the `index.html` as you please.

Installation of Bundles is done via adding / removing elements from the `<script type="pandino-manifests">` tag in the
`index.html` file.

It also contains the baseline CSS, which adjusts the already pulled in Bootstrap styling. Styling is expected to be done
here, like in the old days. This should ensure that styling is centralized, and is easily adjustable / modifiable.

### Application Contract

This is a TypeScript project which serves as the typedef host for all Bundles / packages wishing to be introduced to our
app.

### Application

The application Bundle brings in the React entry point component to the application. It also contains 2 built in
components / pages:

- Dashboard
- Pokemon

#### Dashboard

Nothing special, is just a plain dashboard

#### Pokemon

Lists Pokemons. But also:

- Page body can be overridden via any service bringing a React component registered on the `pokedex-pokemon` objectClass
- If we install the `@pandino/pandino-configuration-management` Bundle (totally optional), then it can process 
  configuration info. The configuration properties are defined in the `app-contract` package's `SettingsModel` interface

#### Settings Feature

This Bundle brings a Settings page to the application (with a menu entry), where we can manage configurations of our
application. It is optional, and every component relying on configuration is providing a default behavior (values) as
per requirements in the CM specification.

#### Custom Pokemon Feature

This is an "adjuster" bundle. If installed, it will override the default Pokemon listing page. The new behavior is a
"tiled" setup instead of the default Table.

#### Pokemon Details Feature

If installed, will bring in a new page, where details of a Pokemon can be viewed.

> This page will obviously not appear in the menu.

This Page relies on other components being able to prepare to support it, otherwise no navigation could happen which
could lead users to it.
