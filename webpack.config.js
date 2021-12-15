const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: {
    'pandino': './src/pandino.ts',
    'bundle-a': './src/bundles/bundle-a/index.ts',
    'bundle-b': './src/bundles/bundle-b/index.ts',
  },
  experiments: {
    outputModule: true,
  },
  output: {
    publicPath: '',
    path: path.resolve(__dirname, './public'),
    module: true,
  },
  devtool: 'source-map',
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
  devServer: {
    static: {
      directory: path.join(__dirname, 'public'),
    },
    compress: true,
    port: 9000,
  },
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      template: 'src/index.html',
      chunks: [], // we'll lazy import everything
    }),
  ],
};
