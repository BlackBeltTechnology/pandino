import clear from 'rollup-plugin-clear';
import typescript from '@rollup/plugin-typescript';
import nodeResolve from '@rollup/plugin-node-resolve';
import {generateOutputs} from "../../../rollup/rollup-utils.mjs";

export default {
  input: 'src/index.tsx',
  output: [
    ...generateOutputs('react-hooks', ['esm', 'cjs', 'system']),
  ],
  external: ['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime', '@pandino/pandino'],
  plugins: [
    clear({
      targets: ['dist'],
    }),
    nodeResolve(),
    typescript(),
  ],
};
