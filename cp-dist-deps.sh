#!/bin/bash

cd packages/@pandino/example

rm -rf dist 2> /dev/null

mkdir dist

cp src/index.html dist
cp src/extra-manifests.json dist

cp ../pandino/dist/pandino.js dist/pandino.js
cp ../pandino/dist/pandino.js.map dist/pandino.js.map

cp ../bundle-a/dist/bundle-a-manifest.json dist/bundle-a-manifest.json
cp ../bundle-a/dist/bundle-a.js dist/bundle-a.js
cp ../bundle-a/dist/bundle-a.js.map dist/bundle-a.js.map

cp ../bundle-b/dist/bundle-b-manifest.json dist/bundle-b-manifest.json
cp ../bundle-b/dist/bundle-b.js dist/bundle-b.js
cp ../bundle-b/dist/bundle-b.js.map dist/bundle-b.js.map
