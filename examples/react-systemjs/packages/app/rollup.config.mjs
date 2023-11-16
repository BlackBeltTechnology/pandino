import * as dotenv from 'dotenv';
import replace from '@rollup/plugin-replace';
import clear from 'rollup-plugin-clear';
import copy from 'rollup-plugin-copy';
import esbuild from 'rollup-plugin-esbuild';
import html from '@rollup/plugin-html';
import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import {customTemplate, generateRepackagedOutput} from "./rollup/helpers.mjs";

dotenv.config();

const ENV = process.env.NODE_ENV;

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
                    {src: '../../node_modules/react/umd/*', dest: 'dist/react'},
                    {src: '../../node_modules/@pandino/pandino/dist/@pandino/*.*', dest: 'dist/@pandino/pandino'},
                    {
                        src: '../../node_modules/@pandino/bundle-installer-dom/dist/@pandino/*.*',
                        dest: 'dist/@pandino/bundle-installer-dom'
                    },
                ],
            }),
            html({
                title: 'React + Pandino',
                template: customTemplate,
            }),
        ],
    },
    generateRepackagedOutput('react-jsx-runtime', 'react/react-jsx-runtime'),
    generateRepackagedOutput('react-is', 'react/react-is'),
    generateRepackagedOutput('react-dom-client', 'react/react-dom-client'),
];
