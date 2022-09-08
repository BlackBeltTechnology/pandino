const path = require('path');
const { defaultOptions, generateManifest } = require('@pandino/manifest-generator');

class GenerateManifestPlugin {
  constructor(options = defaultOptions) {
    this.options = options;
  }

  apply(compiler) {
    compiler.hooks.done.tap('GenerateManifestPlugin', ({ compilation }) => {
      const { chunks } = compilation;
      const targetPath = compilation.options.output.path;

      for (const chunk of Array.from(chunks)) {
        const targetFile = Array.from(chunk.files).find(f => f.endsWith('js') || f.endsWith('cjs') || f.endsWith('mjs'));
        generateManifest(this.options, path.resolve(path.join(targetPath, targetFile)));
      }
    });
  }
}

module.exports = GenerateManifestPlugin;
