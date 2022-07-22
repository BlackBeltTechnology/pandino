import typescript from '@rollup/plugin-typescript';
import clear from 'rollup-plugin-clear';

export default {
  input: 'src/index.ts',
  output: {
    dir: 'dist',
    format: 'cjs'
  },
  plugins: [
    clear({
      targets: ['dist'],
    }),
    typescript(),
  ],
};
