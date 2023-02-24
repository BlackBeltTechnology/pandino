import clear from 'rollup-plugin-clear';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import nodeResolve from '@rollup/plugin-node-resolve';
import copy from 'rollup-plugin-copy';

const ENV = process.env.PRODUCTION ? 'PRODUCTION' : 'DEVELOPMENT';

export default {
  input: 'src/index.ts',
  output: {
    sourcemap: ENV === 'PRODUCTION',
    file: 'dist/app.mjs',
    format: 'esm',
  },
  plugins: [
    clear({
      targets: ['dist'],
    }),
    nodeResolve(),
    typescript(),
    ...[ENV === 'PRODUCTION' ? terser() : undefined],
    copy({
      targets: [
        { src: 'assets/*', dest: 'dist' },
        { src: '../../node_modules/@pandino/bundle-installer-dom/dist/esm/*.*', dest: 'dist' },
        { src: '../hidden-page/dist/*.(json|mjs)', dest: 'dist' },
        { src: '../about-page/dist/*.(json|mjs)', dest: 'dist' },
      ]
    }),
  ],
};
