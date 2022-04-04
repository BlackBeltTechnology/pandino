import typescript from '@rollup/plugin-typescript';
import { pandinoExternalizeReact } from '@pandino/rollup-plugin-pandino-react-externalize';
import { readFileSync } from "fs";

const packageJSON = JSON.parse(readFileSync('package.json').toString('utf8'));

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/custom-application.mjs',
      format: 'esm',
    }
  ],
  plugins: [
    typescript({ tsconfig: './tsconfig.json' }),
    pandinoExternalizeReact({
      prettify: true,
      externalRefsMap: [
        { token: 'jsxs',              identifier: '@pandino/pandino-react-dom/react/jsx-runtime/jsxs' },
        { token: 'jsx',               identifier: '@pandino/pandino-react-dom/react/jsx-runtime/jsx' },
        { token: 'HashRouter',        identifier: '@pandino/pandino-react-router-dom/react-router-dom/HashRouter' },
        { token: 'Routes',            identifier: '@pandino/pandino-react-router-dom/react-router-dom/Routes' },
        { token: 'Route',             identifier: '@pandino/pandino-react-router-dom/react-router-dom/Route' },
        { token: 'Link',              identifier: '@pandino/pandino-react-router-dom/react-router-dom/Link' },
        { token: 'Outlet',            identifier: '@pandino/pandino-react-router-dom/react-router-dom/Outlet' },
      ],
      componentsMap: [
        {
          component: 'CustomApplication',
          identifier: '@example/react-pandino/application',
          props: {
            'service.ranking': 90,
          },
        },
      ],
      manifestData: {
        "Bundle-ManifestVersion": "1",
        "Bundle-SymbolicName": packageJSON.name,
        "Bundle-Name": "Custom Application",
        "Bundle-Version": packageJSON.version,
        "Bundle-Description": packageJSON.description,
        "Bundle-Activator": "./custom-application.mjs",
        "Require-Capability": "@pandino/pandino-react-router-dom;filter:=\"(type=dom)\"",
        "Provide-Capability": "@example/react-pandino;type=\"dom\""
      },
    }),
  ],
};
