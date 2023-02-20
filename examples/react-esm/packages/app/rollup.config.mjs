import * as dotenv from 'dotenv';
import replace from '@rollup/plugin-replace';
import clear from 'rollup-plugin-clear';
import copy from 'rollup-plugin-copy';
import esbuild from 'rollup-plugin-esbuild';
import html from '@rollup/plugin-html';
import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import {customTemplate} from "./rollup/helpers.mjs";

dotenv.config();

const ENV = process.env.NODE_ENV;

const repackagedConfig = {
    plugins: [
        replace({
            preventAssignment: false,
            values: {
                'process.env.NODE_ENV': JSON.stringify('production'),
            },
        }),
        nodeResolve(),
        commonjs(),
        esbuild({
            minify: ENV === 'production',
        }),
    ],
};

export default [
    {
        input: 'src/main.tsx',
        output: {
            dir: 'dist',
            format: 'system',
            sourcemap: ENV === 'production',
        },
        external: ['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime', '@pandino/pandino'],
        plugins: [
            clear({
                targets: ['dist'],
            }),
            replace({
                preventAssignment: false,
                values: {
                    'process.env.NODE_ENV': JSON.stringify('production'),
                },
            }),
            nodeResolve(),
            commonjs(),
            esbuild({
                minify: ENV === 'production',
            }),
            copy({
                targets: [
                    {src: '../component-one/dist/*', dest: 'dist'},
                    {src: '../../node_modules/systemjs/dist/*', dest: 'dist/systemjs'},
                    {src: '../../node_modules/@pandino/bundle-installer-dom/dist/*.*', dest: 'dist'},
                    {src: '../../node_modules/react/umd/*', dest: 'dist/react'},
                    {src: '../../node_modules/@pandino/pandino/dist/system/*.*', dest: 'dist/pandino'},
                ],
            }),
            html({
                title: 'React + Pandino',
                template: customTemplate,
            }),
        ],
    },
    {
        input: 'repackaged/react-jsx-runtime.tsx',
        output: {
            file: 'dist/react/react-jsx-runtime.system.js',
            format: 'system',
            sourcemap: ENV === 'production',
        },
        external: ['react'],
        ...repackagedConfig,
    },
    {
        input: 'repackaged/react-is.tsx',
        output: {
            file: 'dist/react/react-is.system.js',
            format: 'system',
            sourcemap: ENV === 'production',
        },
        external: ['react'],
        ...repackagedConfig,
    },
    {
        input: 'repackaged/react-dom-client.tsx',
        output: {
            file: 'dist/react/react-dom-client.system.js',
            format: 'system',
            sourcemap: ENV === 'production',
        },
        external: ['react'],
        ...repackagedConfig,
    },
];
