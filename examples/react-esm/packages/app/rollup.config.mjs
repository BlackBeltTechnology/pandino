import { EOL } from 'node:os';
import { readFileSync } from 'node:fs';
import * as dotenv from 'dotenv';
import replace from '@rollup/plugin-replace';
import clear from 'rollup-plugin-clear';
import copy from 'rollup-plugin-copy';
import esbuild from 'rollup-plugin-esbuild';
import html from '@rollup/plugin-html';
import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

dotenv.config();

const pkg = JSON.parse(readFileSync('package.json').toString());
const ENV = process.env.NODE_ENV;

const makeHtmlAttributes = (attributes) => {
    if (!attributes) {
        return '';
    }
    const keys = Object.keys(attributes);
    return keys.reduce((result, key) => (result += ` ${key}="${attributes[key]}"`), '');
};

const customTemplate = ({ attributes, files, meta, publicPath, title }) => {
    const scripts = (files.js || [])
        .map(({ fileName }) => {
            const attrs = makeHtmlAttributes(attributes.script);
            return `<script src="${publicPath}${fileName}"${attrs}></script>`;
        })
        .join(EOL);

    const links = (files.css || [])
        .map(({ fileName }) => {
            const attrs = makeHtmlAttributes(attributes.link);
            return `<link href="${publicPath}${fileName}" rel="stylesheet"${attrs}>`;
        })
        .join(EOL);

    const metas = meta
        .map((input) => {
            const attrs = makeHtmlAttributes(input);
            return `<meta${attrs}>`;
        })
        .join(EOL);

    return `
<!doctype html>
<html${makeHtmlAttributes(attributes.html)}>
  <head>
    ${metas}
    <title>${title}</title>
    ${links}
    <script type="pandino-manifests">
      [
        ${pkg.pandino['bundle-installer-dom'].bundles.map(b => `"${b}"`).join(', ')}
      ]
  </script>
  </head>
  <body>
    ${scripts}
  </body>
</html>`;
};

export default [
    {
        input: 'src/main.tsx',
        output: {
            dir: 'dist',
            format: 'esm',
            sourcemap: ENV === 'production',
        },
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
                    { src: '../component-one/dist/*', dest: 'dist' },
                ],
            }),
            html({
                title: 'React + Pandino',
                template: customTemplate,
            }),
        ],
    },
];
