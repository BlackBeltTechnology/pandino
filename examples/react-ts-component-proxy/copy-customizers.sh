#!/bin/bash

cp -R ./packages/app-custom/dist/* ./packages/app-platform/public/deploy

cp ../../packages/@pandino/pandino-bundle-installer-dom/dist/pandino-bundle-installer-dom.mjs ./packages/app-platform/public/deploy
cp ../../packages/@pandino/pandino-bundle-installer-dom/dist/pandino-bundle-installer-dom-manifest.json ./packages/app-platform/public/deploy
