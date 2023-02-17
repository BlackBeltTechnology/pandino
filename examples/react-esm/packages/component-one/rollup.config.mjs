import * as dotenv from 'dotenv';
import clear from 'rollup-plugin-clear';
import esbuild from 'rollup-plugin-esbuild';
import generateManifest from '@pandino/rollup-plugin-generate-manifest';
import nodeResolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";

dotenv.config();

const ENV = process.env.NODE_ENV;

export default [
    {
        input: 'src/index.tsx',
        output: {
            file: 'dist/component-one.mjs',
            format: 'esm',
            sourcemap: ENV === 'production',
        },
        plugins: [
            clear({
                targets: ['dist'],
            }),
            nodeResolve(),
            commonjs(),
            esbuild({
                minify: ENV === 'production',
            }),
            generateManifest(),
        ],
        external: [
            'react/jsx-runtime',
            'react-dom/client',
            'react',
        ],
    },
];
