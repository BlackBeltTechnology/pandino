import * as dotenv from 'dotenv';
import clear from 'rollup-plugin-clear';
import esbuild from 'rollup-plugin-esbuild';

dotenv.config();

const ENV = process.env.NODE_ENV;

export default [
  {
    input: 'src/index.ts',
    output: {
      dir: 'dist',
      format: 'esm',
      sourcemap: ENV === 'production',
    },
    plugins: [
      clear({
        targets: ['dist'],
      }),
      esbuild({
        minify: ENV === 'production',
      }),
    ],
  },
];
