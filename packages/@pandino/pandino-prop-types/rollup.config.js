import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import excludeDependenciesFromBundle from "rollup-plugin-exclude-dependencies-from-bundle";
import commonjs from '@rollup/plugin-commonjs';
import { pandinoExternalizeReact } from './rollup/index';
import { readFileSync } from "fs";

const packageJSON = JSON.parse(readFileSync('package.json').toString('utf8'));

const exportPackage = '@pandino/pandino-prop-types/prop-types';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/esm/pandino-mui-core.mjs',
      format: 'esm',
    }
  ],
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
      minify: true,
      externalRefsMap: [
        // { token: 'isValidElement',                identifier: '@pandino/pandino-react-dom/react/isValidElement' },
      ],
      componentsMap: [
        { component: 'propTypes',         identifier: `${exportPackage}/PropTypes` },
      ],
      manifestData: {
        "Bundle-ManifestVersion": "1",
        "Bundle-SymbolicName": packageJSON.name,
        "Bundle-Name": "Prop Types",
        "Bundle-Version": packageJSON.version,
        "Bundle-Description": packageJSON.description,
        "Bundle-Activator": "./pandino-prop-types.mjs",
        "Require-Capability": [
          "@pandino/pandino-react-dom;filter:=\"(type=dom)\"",
        ],
        "Provide-Capability": "@pandino/pandino-prop-types;type=\"dom\""
      },
    }),
  ],
};
