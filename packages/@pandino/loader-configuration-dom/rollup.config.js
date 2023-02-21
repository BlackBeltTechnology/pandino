import clear from 'rollup-plugin-clear';
import typescript from '@rollup/plugin-typescript';
import nodeResolve from '@rollup/plugin-node-resolve';
import {generateOutputs} from "../../../rollup/rollup-utils.mjs";

export default {
  input: 'src/index.ts',
  output: [
    ...generateOutputs('loader-configuration-dom', ['esm', 'system'], { keepWebpackIgnore: true }),
  ],
  plugins: [
    clear({
      targets: ['dist'],
    }),
    nodeResolve(),
    typescript(),
  ],
};
