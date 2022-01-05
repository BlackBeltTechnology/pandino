const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  experiments: {
    outputModule: true,
  },
  entry: {
    'pandino-bundle-installer-dom': './src/index.ts',
  },
  mode: 'production',
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
        { from: "assets", to: "" },
      ],
    }),
  ],
};
