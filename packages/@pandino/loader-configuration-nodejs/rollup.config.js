import clear from 'rollup-plugin-clear';
import typescript from '@rollup/plugin-typescript';
import generateManifest from '@pandino/rollup-plugin-generate-manifest';
import nodeResolve from '@rollup/plugin-node-resolve';
import {generateOutputs} from "../../../rollup/rollup-utils.mjs";

export default {
  input: 'src/index.ts',
  output: [
    ...generateOutputs('loader-configuration-nodejs', ['esm', 'cjs']),
  ],
  plugins: [
    clear({
      targets: ['dist'],
    }),
    nodeResolve(),
    typescript(),
    generateManifest(),
  ],
};
