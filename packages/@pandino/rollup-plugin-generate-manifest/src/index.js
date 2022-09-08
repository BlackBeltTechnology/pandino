const { defaultOptions, generateManifest } = require('@pandino/manifest-generator');
const path = require("path");

const generateManifestPlugin = (options = defaultOptions) => {

  return {
    name: 'generate-manifest',
    writeBundle: (bundleOptions) => {
      const targetFile = Array.isArray(bundleOptions.file) ? bundleOptions.file[0] : bundleOptions.file;

      // const target = bundleOptions.file.substring(0, bundleOptions.file.lastIndexOf('.')) + '-manifest.json';
      // const targetPath = path.resolve(target);
      // const lastSeparator = targetPath.lastIndexOf(path.sep);
      // const targetFolder = lastSeparator > -1 ? targetPath.substring(0, lastSeparator) : '.';

      generateManifest(options, path.resolve(targetFile));
    }
  }
}

module.exports = generateManifestPlugin;
