// import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
// import path from 'path';
// import {fileURLToPath} from 'url';
//
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const path = require('path');

const baseConfig = {
  entry: {
    'pandino': './src/index.ts',
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
  }
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
  }
};

module.exports = [cjs, esm];
