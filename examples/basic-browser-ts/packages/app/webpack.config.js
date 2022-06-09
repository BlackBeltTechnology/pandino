const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  experiments: {
    outputModule: true,
  },
  entry: {
    'app': './src/index.ts',
  },
  mode: 'development',
  devtool: 'inline-source-map',
  devServer: {
    port: 8080,
    static: {
      directory: path.join(__dirname, 'assets'),
    },
  },
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
    filename: '[name].js',
    library: {
      type: 'module',
    },
    umdNamedDefine: true,
    path: path.resolve(__dirname, 'dist'),
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: "assets", to: "assets" },
      ],
    }),
    new HtmlWebpackPlugin({
      title: 'Pandino - Basic Browser TS',
      template: path.resolve(__dirname, 'src', 'index.ejs'),
      scriptLoading: 'module',
    }),
  ],
};
