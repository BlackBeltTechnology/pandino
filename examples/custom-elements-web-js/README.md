# Custom Elements Web JS

A simple, poor man's SPA utilizing `@pandino/pandino-bundle-installer-dom`.

## Running the example
- Run `pnpm run build` first in the project root to create local artifacts
- Run `./cp-dependencies.sh` to copy library artifacts
- Run `npx serve dist` in this folder to start a web server

> Server will start at: http://localhost:3000

## Contents
By default this example "ships" with a Dashboard Feature

> Other Features can be added by hand. See description below!

## Manually adding extra Features
- Copy manifests and scripts from the `tmp` folder
- Modify the `pandino-manifests` script in `index.html` for it to pick up new features
- Refresh page

### About
The About Bundle will register it self with the `AppWire`'s menu, and router as well.

### Hidden
The Hidden Bundle will only register it's route with `AppWire`, but no menu entry.
