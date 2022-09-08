const GenerateManifestPlugin = require('./src');

module.exports = {
  entry: {
    'app1': './test/index.js',
    'app2': './test/index.js',
  },
  mode: 'production',
  resolve: {
    extensions: ['.js'],
  },
  output: {
    filename: '[name].js',
  },
  plugins: [
    new GenerateManifestPlugin({
      message: 'Yooo!',
    }),
  ],
};
