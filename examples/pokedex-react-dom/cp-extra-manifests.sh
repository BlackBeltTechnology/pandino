#!/bin/bash

cp ../../packages/@pandino/pandino/dist/esm/pandino.mjs packages/runtime/pandino.mjs

cp ../../packages/@pandino/bundle-installer-dom/dist/bundle-installer-dom-manifest.json packages/runtime/bundle-installer-dom-manifest.json
cp ../../packages/@pandino/bundle-installer-dom/dist/bundle-installer-dom.mjs packages/runtime/bundle-installer-dom.mjs

cp ../../packages/@pandino/react-dom/dist/esm/react-dom-manifest.json packages/runtime/react-dom-manifest.json
cp ../../packages/@pandino/react-dom/dist/esm/react-dom.mjs packages/runtime/react-dom.mjs

cp ../../packages/@pandino/react-router-dom/dist/esm/react-router-dom-manifest.json packages/runtime/react-router-dom-manifest.json
cp ../../packages/@pandino/react-router-dom/dist/esm/react-router-dom.mjs packages/runtime/react-router-dom.mjs

cp ../../packages/@pandino/persistence-manager-localstorage/dist/persistence-manager-localstorage-manifest.json packages/runtime/persistence-manager-localstorage-manifest.json
cp ../../packages/@pandino/persistence-manager-localstorage/dist/persistence-manager-localstorage.mjs packages/runtime/persistence-manager-localstorage.mjs

cp ../../packages/@pandino/configuration-management/dist/esm/configuration-management-manifest.json packages/runtime/configuration-management-manifest.json
cp ../../packages/@pandino/configuration-management/dist/esm/configuration-management.mjs packages/runtime/configuration-management.mjs

cp ../../packages/@pandino/mission-control-dom/dist/esm/mission-control-dom-manifest.json packages/runtime/mission-control-dom-manifest.json
cp ../../packages/@pandino/mission-control-dom/dist/esm/mission-control-dom.mjs packages/runtime/mission-control-dom.mjs
