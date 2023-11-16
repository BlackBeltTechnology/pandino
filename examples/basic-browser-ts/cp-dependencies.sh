#!/bin/bash

set -e

cp packages/bundle-a/dist/bundle-a-manifest.json packages/app/assets/bundle-a-manifest.json
cp packages/bundle-a/dist/bundle-a.js packages/app/assets/bundle-a.js

cp packages/bundle-b/dist/bundle-b-manifest.json packages/app/assets/bundle-b-manifest.json
cp packages/bundle-b/dist/bundle-b.js packages/app/assets/bundle-b.js

cp -r ../../packages/@pandino/bundle-installer-dom/dist/@pandino ./packages/app/assets
