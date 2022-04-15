# Custom Elements Web JS

A simple, poor man's SPA utilizing `@pandino/pandino-bundle-installer-dom`.

## Setup
- Run `npm run build` in the Git Repository root
- Run `./cp-extra-manifests.sh` in this folder to obtain dependencies

## Running the example
Run `npm start` in this folder to start a web server

> Server will start at: http://localhost:5001

## Contents
By default this example "ships" with a Dashboard Feature

> Other Features can be added by hand. See description below!

## Manually adding extra Features
- Copy any sources from the `tmp` folder
- Modify the `pandino-manifests` script in `index.html` for it to pick up new features
- Refresh page

### About
The About Bundle will register it self with the `AppWire`'s menu, and router as well.

### Hidden
The Hidden Bundle will only register it's route with `AppWire`, but no menu entry.
