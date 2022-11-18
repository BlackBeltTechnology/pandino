import clear from 'rollup-plugin-clear';
import typescript from '@rollup/plugin-typescript';

export default {
  input: 'src/index.ts',
  output: {
    file: 'dist/contract.mjs',
    format: 'esm',
  },
  plugins: [
    clear({
      targets: ['dist'],
    }),
    typescript(),
  ],
};
