import clear from 'rollup-plugin-clear';
import typescript from '@rollup/plugin-typescript';
import nodeResolve from "@rollup/plugin-node-resolve";

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/esm/log-api.mjs',
      format: 'esm',
    },
    {
      file: 'dist/cjs/log-api.cjs',
      format: 'cjs',
    },
  ],
  plugins: [
    clear({
      targets: ['dist'],
    }),
    nodeResolve(),
    typescript(),
  ],
};
