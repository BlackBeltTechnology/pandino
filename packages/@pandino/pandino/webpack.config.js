const path = require('path');

module.exports = {
  experiments: {
    outputModule: true,
  },
  entry: {
    'pandino': './src/pandino.ts',
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
      // name: 'Platform',
      type: 'module',
    },
    umdNamedDefine: true,
    path: path.resolve(__dirname, 'dist'),
  },
};
