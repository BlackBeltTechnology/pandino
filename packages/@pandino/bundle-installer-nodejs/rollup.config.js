import clear from 'rollup-plugin-clear';
import { terser } from 'rollup-plugin-terser';
import ts from 'rollup-plugin-ts';
import generateManifest from '@pandino/rollup-plugin-generate-manifest';
import nodeResolve from '@rollup/plugin-node-resolve';

const ENV = process.env.PRODUCTION ? 'PRODUCTION' : 'DEVELOPMENT';

export default {
  input: 'src/index.ts',
  output: [
    {
      sourcemap: ENV === 'PRODUCTION',
      file: 'dist/esm/bundle-installer-nodejs.js',
      format: 'esm',
    },
    {
      sourcemap: ENV === 'PRODUCTION',
      file: 'dist/cjs/bundle-installer-nodejs.js',
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
    generateManifest(),
  ],
};
