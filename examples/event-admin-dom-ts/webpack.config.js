import path from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';

export default {
  experiments: {
    outputModule: true,
  },
  entry: {
    'app': './src/index.ts',
  },
  mode: 'development',
  devtool: 'inline-source-map',
  devServer: {
    port: 3000,
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
    path: path.resolve('dist'),
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Pandino - Event Admin DOM TS',
      template: path.resolve('src', 'index.ejs'),
      scriptLoading: 'module',
    }),
  ],
};
