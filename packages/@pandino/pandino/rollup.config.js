import clear from 'rollup-plugin-clear';
import { terser } from 'rollup-plugin-terser';
import ts from 'rollup-plugin-ts';
import nodeResolve from '@rollup/plugin-node-resolve';

const ENV = process.env.PRODUCTION ? 'PRODUCTION' : 'DEVELOPMENT';

export default {
  input: 'src/index.ts',
  output: [
    {
      sourcemap: ENV === 'PRODUCTION',
      file: 'dist/esm/pandino.mjs',
      format: 'esm',
    },
    {
      sourcemap: ENV === 'PRODUCTION',
      file: 'dist/cjs/pandino.cjs',
      format: 'cjs',
    },
  ],
  plugins: [
    clear({
      targets: ['dist'],
    }),
    nodeResolve(),
    ts(),
    ...[ENV === 'PRODUCTION' ? terser() : undefined],
  ],
};
