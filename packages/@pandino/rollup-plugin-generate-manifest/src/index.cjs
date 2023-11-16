const { defaultOptions, generateManifest } = require('@pandino/manifest-generator');
const { resolve, join } = require('node:path');

const generateManifestPlugin = (options = defaultOptions) => {
  let generated = false;
  return {
    name: 'generate-manifest',
    outro: (opts) => {
      if (generated === false && opts.fileName.match(/\.(mjs|cjs|js)$/)) {
        generateManifest(options, resolve(join(options.dist ?? 'dist', opts.fileName)));
        generated = true;
      }
    },
  };
};

module.exports = generateManifestPlugin;
