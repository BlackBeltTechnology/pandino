import typescript from '@rollup/plugin-typescript';
import { pandinoExternalizeReact } from '@pandino/rollup-plugin-pandino-react-externalize';
import { readFileSync } from "fs";

const packageJSON = JSON.parse(readFileSync('package.json').toString('utf8'));

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/app-custom.mjs',
      format: 'esm',
    }
  ],
  plugins: [
    typescript({ tsconfig: './tsconfig.json' }),
    pandinoExternalizeReact({
      prettify: true,
      externalRefsMap: [
        { token: 'useBundleContext',  identifier: '@example/app-platform-api/useBundleContext' },
        { token: 'jsxs',              identifier: '@pandino/react-provider/react/jsx-runtime/jsxs' },
        // { token: 'Fragment',          identifier: '@pandino/react-provider/react/jsx-runtime/Fragment' },
        { token: 'jsx',               identifier: '@pandino/react-provider/react/jsx-runtime/jsx' },
        // { token: 'useState',          identifier: '@pandino/react-provider/react/useState' },
        // { token: 'Component',         identifier: '@pandino/react-provider/react/Component' },
      ],
      componentsMap: [
        {
          component: 'CustomDashboardPageComponent',
          identifier: '@scope/react-ts-component-proxy/pages/Dashboard',
          props: {
            'service.ranking': 90,
          },
        },
      ],
      manifestData: {
        "Bundle-ManifestVersion": "1",
        "Bundle-SymbolicName": packageJSON.name,
        "Bundle-Name": "App Custom",
        "Bundle-Version": packageJSON.version,
        "Bundle-Description": packageJSON.description,
        "Bundle-Activator": "./app-custom.mjs",
        "Require-Capability": "app.platform;filter:=\"(type=DOM)\""
      },
    }),
  ],
};
