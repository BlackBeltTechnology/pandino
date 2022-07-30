import clear from 'rollup-plugin-clear';
import ts from 'rollup-plugin-ts';
import nodeResolve from "@rollup/plugin-node-resolve";

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/esm/pandino-api.js',
      format: 'esm',
    },
    {
      file: 'dist/cjs/pandino-api.js',
      format: 'cjs',
    },
  ],
  plugins: [
    clear({
      targets: ['dist'],
    }),
    nodeResolve(),
    ts(),
  ],
};
