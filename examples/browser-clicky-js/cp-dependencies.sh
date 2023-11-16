#!/bin/bash

set -e

rm -rf dist/@pandino

mkdir -p dist/@pandino

cp -r ../../packages/@pandino/bundle-installer-dom/dist/@pandino ./dist
cp -r ../../packages/@pandino/loader-configuration-dom/dist/@pandino ./dist
cp -r ../../packages/@pandino/pandino/dist/@pandino ./dist
