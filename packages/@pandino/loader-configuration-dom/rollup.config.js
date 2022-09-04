import clear from 'rollup-plugin-clear';
import { terser } from 'rollup-plugin-terser';
import ts from 'rollup-plugin-ts';
import nodeResolve from '@rollup/plugin-node-resolve';

const ENV = process.env.PRODUCTION ? 'PRODUCTION' : 'DEVELOPMENT';

export default {
  input: 'src/index.ts',
  output: {
    sourcemap: ENV === 'PRODUCTION',
    file: 'dist/loader-configuration-dom.mjs',
    format: 'esm',
  },
  plugins: [
    clear({
      targets: ['dist'],
    }),
    nodeResolve(),
    ts(),
    ...[ENV === 'PRODUCTION' ? terser({
      // All of this is so that we can keep the webpack ignore comment in source so that webpack does not
      // error out for runtime imports...
      format: {
        comments: function (node, comment) {
          const text = comment.value;
          return /webpackIgnore/i.test(text);
        },
      },
    }) : undefined],
  ],
};
