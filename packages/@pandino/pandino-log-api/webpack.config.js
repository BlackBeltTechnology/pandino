const path = require('path');

module.exports = {
  entry: {
    'pandino-log-api': './src/index.ts',
  },
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
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: '[name].js',
    libraryTarget: 'umd',
    library: {
      name: 'PandinoLogAPI',
      type: 'commonjs',
    },
    umdNamedDefine: true,
    globalObject: 'this',
    path: path.resolve(__dirname, 'dist'),
  },
};
