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
    typescript({ tsconfig: './tsconfig.json' }),
    pandinoExternalizeReact({
      prettify: true,
      externalRefsMap: [
        { token: 'jsxs',                  identifier: '@pandino/pandino-react-dom/react/jsx-runtime/jsxs' },
        { token: 'jsx',                   identifier: '@pandino/pandino-react-dom/react/jsx-runtime/jsx' },
        { token: 'Fragment',              identifier: '@pandino/pandino-react-dom/react/jsx-runtime/Fragment' },
        { token: 'useState',              identifier: '@pandino/pandino-react-dom/react/useState' },
        { token: 'useEffect',             identifier: '@pandino/pandino-react-dom/react/useEffect' },
        { token: 'useReactBundleContext', identifier: '@pandino/pandino-react-dom/useReactBundleContext' },

        { token: 'Link',                  identifier: '@pandino/pandino-react-router-dom/react-router-dom/Link' },
      ],
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
        "Bundle-Name": "Settings",
        "Bundle-Version": packageJSON.version,
        "Bundle-Description": packageJSON.description,
        "Bundle-Activator": "./feature-pokemon.mjs",
        "Require-Capability": [
          "@pandino/pandino-react-dom;filter:=\"(type=dom)\"",
          "@pandino/pandino-react-router-dom;filter:=\"(type=dom)\""
        ],
        "Provide-Capability": "@pokedex/feature;type=\"dom\""
      },
    }),
  ],
};
