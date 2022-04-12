import typescript from '@rollup/plugin-typescript';
import { pandinoExternalizeReact } from './rollup/index';
import { readFileSync } from "fs";

const packageJSON = JSON.parse(readFileSync('package.json').toString('utf8'));

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/feature-settings.mjs',
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

        { token: 'useNavigate',           identifier: '@pandino/pandino-react-router-dom/react-router-dom/useNavigate' },
        { token: 'HashRouter',            identifier: '@pandino/pandino-react-router-dom/react-router-dom/HashRouter' },
        { token: 'Routes',                identifier: '@pandino/pandino-react-router-dom/react-router-dom/Routes' },
        { token: 'Route',                 identifier: '@pandino/pandino-react-router-dom/react-router-dom/Route' },
        { token: 'Link',                  identifier: '@pandino/pandino-react-router-dom/react-router-dom/Link' },

        { token: 'useReactBundleContext', identifier: '@pandino/pandino-react-dom/useReactBundleContext' },
      ],
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
          "@pandino/pandino-react-dom;filter:=\"(type=dom)\"",
          "@pandino/pandino-react-router-dom;filter:=\"(type=dom)\""
        ],
        "Provide-Capability": "@pokedex/feature;type=\"dom\""
      },
    }),
  ],
};
