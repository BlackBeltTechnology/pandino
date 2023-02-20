import clear from 'rollup-plugin-clear';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
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
    {
      sourcemap: ENV === 'PRODUCTION',
      file: 'dist/system/pandino.js',
      format: 'system',
    },
  ],
  plugins: [
    clear({
      targets: ['dist'],
    }),
    nodeResolve(),
    typescript(),
    ...[ENV === 'PRODUCTION' ? terser() : undefined],
  ],
};
