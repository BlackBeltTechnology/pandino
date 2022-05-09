import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import path from 'path';
import CopyPlugin from 'copy-webpack-plugin';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default {
  experiments: {
    outputModule: true,
  },
  entry: {
    'bundle-installer-dom': './src/index.ts',
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
  output: {
    filename: '[name].mjs',
    libraryTarget: 'module',
    umdNamedDefine: true,
    path: path.resolve(__dirname, 'dist'),
  },
  plugins: [
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      openAnalyzer: false,
    }),
    new CopyPlugin({
      patterns: [
        { from: "assets", to: "" },
      ],
    }),
  ],
};
