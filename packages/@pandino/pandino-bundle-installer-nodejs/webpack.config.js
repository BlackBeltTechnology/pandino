const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const path = require('path');
const HandlebarsPlugin = require('handlebars-webpack-plugin');

const packageJSON = require('./package.json');
const entryName = packageJSON.name.split('/').pop();

const createManifestHandlebars = (target, entryName, extension) => {
  return new HandlebarsPlugin({
    entry: path.resolve(__dirname, 'assets/manifest.hbs'),
    output: path.resolve(__dirname, `dist/${target}/${entryName}-manifest.json`),
    data: {
      ...packageJSON,
      entryName,
      extension,
    },
  });
};

const baseConfig = {
  entry: {
    [entryName]: './src/index.ts',
  },
  mode: 'production',
  devtool: false,
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
    extensions: ['.tsx', '.ts', '.js'],
  },
  plugins: [
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      openAnalyzer: false,
    }),
  ],
};

const esm = {
  ...baseConfig,
  experiments: {
    outputModule: true,
  },
  output: {
    filename: '[name].mjs',
    libraryTarget: 'module',
    path: path.resolve(__dirname, 'dist/esm'),
  },
  externals: {
    'fs': 'fs'
  },
  plugins: [
    ...baseConfig.plugins,
    createManifestHandlebars('esm', entryName, 'mjs'),
  ],
};

const cjs = {
  ...baseConfig,
  experiments: {
    outputModule: false,
  },
  output: {
    filename: '[name].js',
    libraryTarget: 'commonjs',
    path: path.resolve(__dirname, 'dist/cjs'),
  },
  externals: {
    'fs': 'commonjs fs'
  },
  plugins: [
    ...baseConfig.plugins,
    createManifestHandlebars('cjs', entryName, 'js'),
  ],
};

module.exports = [cjs, esm];
