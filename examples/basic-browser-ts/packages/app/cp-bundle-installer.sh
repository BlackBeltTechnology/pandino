#!/bin/bash

rm -rf assets/deploy
mkdir -p assets/deploy

cp ../../../../packages/@pandino/pandino-bundle-installer-dom/dist/pandino-bundle-installer-dom-manifest.json assets/deploy/pandino-bundle-installer-dom-manifest.json
cp ../../../../packages/@pandino/pandino-bundle-installer-dom/dist/pandino-bundle-installer-dom.js assets/deploy/pandino-bundle-installer-dom.js
