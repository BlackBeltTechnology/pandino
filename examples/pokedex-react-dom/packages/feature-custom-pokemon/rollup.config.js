import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import { pandinoExternalizeReact } from '@pandino/rollup-plugin-pandino-react-externalize';
import { readFileSync } from "fs";

const packageJSON = JSON.parse(readFileSync('package.json').toString('utf8'));

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/feature-pokemon.mjs',
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
          component: 'CustomPokemon',
          identifier: 'pokedex-pokemon',
          props: {
            'service.ranking': 90,
            'name': 'feature-pokemon',
          },
        },
      ],
      manifestData: {
        "Bundle-ManifestVersion": "1",
        "Bundle-SymbolicName": packageJSON.name,
        "Bundle-Name": "Custom Pokemon List",
        "Bundle-Version": packageJSON.version,
        "Bundle-Description": packageJSON.description,
        "Bundle-Activator": "./feature-pokemon.mjs",
        "Require-Capability": [
          "pokedex-application;filter:=(type=dom)"
        ]
      },
    }),
  ],
};
