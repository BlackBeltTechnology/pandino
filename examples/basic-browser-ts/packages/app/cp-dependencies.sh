#!/bin/bash

cp ../bundle-a/dist/bundle-a-manifest.json assets/bundle-a-manifest.json
cp ../bundle-a/dist/bundle-a.js assets/bundle-a.js

cp ../bundle-b/dist/bundle-b-manifest.json assets/bundle-b-manifest.json
cp ../bundle-b/dist/bundle-b.js assets/bundle-b.js

cp ../../../../packages/@pandino/bundle-installer-dom/dist/bundle-installer-dom-manifest.json assets/bundle-installer-dom-manifest.json
cp ../../../../packages/@pandino/bundle-installer-dom/dist/bundle-installer-dom.mjs assets/bundle-installer-dom.mjs
cp ../../../../packages/@pandino/bundle-installer-dom/dist/bundle-installer-dom.mjs.map assets/bundle-installer-dom.mjs.map

