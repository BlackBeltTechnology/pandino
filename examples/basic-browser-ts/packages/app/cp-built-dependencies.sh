#!/bin/bash

rm -rf assets/external-bundles
mkdir -p assets/external-bundles

cp ../../../../packages/@pandino/pandino-extra-document-manifests/dist/pandino-extra-document-manifests-manifest.json assets/external-bundles/pandino-extra-document-manifests-manifest.json
cp ../../../../packages/@pandino/pandino-extra-document-manifests/dist/pandino-extra-document-manifests.js assets/external-bundles/pandino-extra-document-manifests.js
cp ../../../../packages/@pandino/pandino-extra-document-manifests/dist/pandino-extra-document-manifests.js.map assets/external-bundles/pandino-extra-document-manifests.js.map

cp ../bundle-a/dist/bundle-a-manifest.json assets/external-bundles/bundle-a-manifest.json
cp ../bundle-a/dist/bundle-a.js assets/external-bundles/bundle-a.js

cp ../bundle-b/dist/bundle-b-manifest.json assets/external-bundles/bundle-b-manifest.json
cp ../bundle-b/dist/bundle-b.js assets/external-bundles/bundle-b.js
