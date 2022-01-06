#!/bin/bash

rm -rf assets/deploy
mkdir -p assets/deploy

cp ../../../../packages/@pandino/pandino-bundle-installer-dom/dist/pandino-bundle-installer-dom-manifest.json assets/deploy/pandino-bundle-installer-dom-manifest.json
cp ../../../../packages/@pandino/pandino-bundle-installer-dom/dist/pandino-bundle-installer-dom.js assets/deploy/pandino-bundle-installer-dom.js
cp ../../../../packages/@pandino/pandino-bundle-installer-dom/dist/pandino-bundle-installer-dom.js.map assets/deploy/pandino-bundle-installer-dom.js.map

cp ../bundle-a/dist/bundle-a-manifest.json assets/deploy/bundle-a-manifest.json
cp ../bundle-a/dist/bundle-a.js assets/deploy/bundle-a.js

cp ../bundle-b/dist/bundle-b-manifest.json assets/deploy/bundle-b-manifest.json
cp ../bundle-b/dist/bundle-b.js assets/deploy/bundle-b.js
