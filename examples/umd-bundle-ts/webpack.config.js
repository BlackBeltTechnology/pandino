const path = require('path');
const { CleanWebpackPlugin  } = require('clean-webpack-plugin');
const CopyPlugin = require("copy-webpack-plugin");
const GenerateManifestPlugin = require('@pandino/webpack-plugin-generate-manifest');

module.exports = {
  entry: './src/index.ts',
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts'],
  },
  output: {
    filename: 'umd-bundle-ts.js',
    library: {
      type: 'umd',
      name: 'umd-bundle-ts',
    },
    path: path.resolve(__dirname, 'dist'),
  },
  plugins: [
    new CleanWebpackPlugin(),
    new GenerateManifestPlugin(),
    new CopyPlugin({
      patterns: [
        { from: "public/" },
        { from: '../../node_modules/@pandino/pandino/dist/@pandino/pandino.mjs' },
        { from: '../../node_modules/@pandino/loader-configuration-dom/dist/@pandino/loader-configuration-dom.mjs' },
        { from: '../../node_modules/@pandino/umd-activator-resolver-dom/dist/@pandino/umd-activator-resolver-dom.mjs' },
        { from: '../../node_modules/@pandino/bundle-installer-dom/dist/@pandino/bundle-installer-dom.mjs' },
        { from: '../../node_modules/@pandino/bundle-installer-dom/dist/@pandino/bundle-installer-dom-manifest.json' },
      ],
    }),
  ],
};
