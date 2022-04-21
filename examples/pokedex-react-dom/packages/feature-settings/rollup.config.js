import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
const typescript = require('@rollup/plugin-typescript');
const { pandinoExternalizeReact } = require('@pandino/rollup-plugin-pandino-react-externalize');
const { readFileSync } = require('fs');

const packageJSON = JSON.parse(readFileSync('package.json').toString('utf8'));

module.exports = {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/feature-settings.mjs',
      format: 'esm',
    }
  ],
  plugins: [
    nodeResolve(),
    commonjs(),
    typescript({ tsconfig: './tsconfig.json' }),
    pandinoExternalizeReact({
      prettify: true,
      componentsMap: [
        {
          component: 'settingsFeature',
          identifier: '@pokedex/feature',
          props: {
            'service.ranking': 90,
            'name': 'feature-settings',
          },
        },
      ],
      manifestData: {
        "Bundle-ManifestVersion": "1",
        "Bundle-SymbolicName": packageJSON.name,
        "Bundle-Name": "Settings",
        "Bundle-Version": packageJSON.version,
        "Bundle-Description": packageJSON.description,
        "Bundle-Activator": "./feature-settings.mjs",
        "Require-Capability": [
          "pokedex-application;filter:=\"(type=dom)\"",
          "@pandino/pandino-configuration-management;filter:=\"(objectClass=@pandino/pandino-configuration-management/ConfigurationAdmin)\""
        ],
        "Provide-Capability": "@pokedex/feature;type=\"dom\""
      },
    }),
  ],
};
