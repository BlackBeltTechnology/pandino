const { defaultOptions, generateManifest } = require('@pandino/manifest-generator');
const path = require('path');

const generateManifestPlugin = (options = defaultOptions) => {
  return {
    name: 'generate-manifest',
    writeBundle: (bundleOptions) => {
      const targetFile = Array.isArray(bundleOptions.file) ? bundleOptions.file[0] : bundleOptions.file;

      generateManifest(options, path.resolve(targetFile));
    },
  };
};

module.exports = generateManifestPlugin;
