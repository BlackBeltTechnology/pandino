import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import excludeDependenciesFromBundle from "rollup-plugin-exclude-dependencies-from-bundle";
import external from '@yelo/rollup-node-external';
import commonjs from '@rollup/plugin-commonjs';
import { pandinoExternalizeReact } from './rollup/index';
import { readFileSync } from "fs";

const packageJSON = JSON.parse(readFileSync('package.json').toString('utf8'));

const exportPackage = '@pandino/pandino-mui-core/material';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/esm/pandino-mui-core.mjs',
      format: 'esm',
    }
  ],
  // external: external({}),
  plugins: [
    nodeResolve(),
    commonjs(),
    excludeDependenciesFromBundle({
      peerDependencies: true,
    }),
    typescript({ tsconfig: './tsconfig.json' }),
    pandinoExternalizeReact({
      mockProcess: {
        env: {
          NODE_ENV: 'production'
        },
      },
      prettify: true,
      minify: false,
      externalRefsMap: [
        { token: 'React__default',        identifier: '@pandino/pandino-react-dom/react/React' },
        { token: 'React',                 identifier: '@pandino/pandino-react-dom/react/React' },
        { token: 'Fragment',              identifier: '@pandino/pandino-react-dom/react/jsx-runtime/Fragment' },
        { token: 'jsx',                   identifier: '@pandino/pandino-react-dom/react/jsx-runtime/jsx' },
        { token: 'jsxs',                  identifier: '@pandino/pandino-react-dom/react/jsx-runtime/jsxs' },
        { token: 'createElement',         identifier: '@pandino/pandino-react-dom/react/createElement' },
        { token: 'useContext',            identifier: '@pandino/pandino-react-dom/react/useContext' },
        { token: 'useRef',                identifier: '@pandino/pandino-react-dom/react/useRef' },
        { token: 'createContext',         identifier: '@pandino/pandino-react-dom/react/createContext' },
        { token: 'forwardRef',            identifier: '@pandino/pandino-react-dom/react/forwardRef' },
        // { token: 'PropTypes',          identifier: '@pandino/pandino-prop-types/prop-types/PropTypes' },
      ],
      componentsMap: [
        { component: 'TextField',         identifier: `${exportPackage}/TextField/TextField` },
        { component: 'Tabs',              identifier: `${exportPackage}/Tabs/Tabs` },
        { component: 'Tab',               identifier: `${exportPackage}/Tab/Tab` },
        { component: 'Box',               identifier: `${exportPackage}/Box/Box` },
      ],
      manifestData: {
        "Bundle-ManifestVersion": "1",
        "Bundle-SymbolicName": packageJSON.name,
        "Bundle-Name": "Material UI Core",
        "Bundle-Version": packageJSON.version,
        "Bundle-Description": packageJSON.description,
        "Bundle-Activator": "./pandino-mui-core.mjs",
        "Require-Capability": [
          "@pandino/pandino-react-dom;filter:=\"(type=dom)\"",
          // "@pandino/pandino-prop-types;filter:=\"(type=dom)\"",
        ],
        "Provide-Capability": "@pandino/pandino-mui-core;type=\"dom\""
      },
    }),
  ],
};
