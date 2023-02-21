import {EOL} from 'node:os';
import * as dotenv from 'dotenv';
import replace from '@rollup/plugin-replace';
import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import esbuild from 'rollup-plugin-esbuild';

dotenv.config();

const ENV = process.env.NODE_ENV;

const makeHtmlAttributes = (attributes) => {
    if (!attributes) {
        return '';
    }
    const keys = Object.keys(attributes);
    return keys.reduce((result, key) => (result += ` ${key}="${attributes[key]}"`), '');
};

export const customTemplate = ({attributes, files, meta, publicPath, title}) => {
    // const scripts = (files.js || [])
    //     .map(({ fileName }) => {
    //         const attrs = makeHtmlAttributes(attributes.script);
    //         return `<script src="${publicPath}${fileName}"${attrs}></script>`;
    //     })
    //     .join(EOL);

    const links = (files.css || [])
        .map(({fileName}) => {
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
    <script src="systemjs/system.min.js"></script>
    <script src="systemjs/extras/amd.min.js"></script>
    <script type="systemjs-importmap">
      {
        "imports": {
          "react": "./react/react.development.js",
          "react-is": "./react/react-is.system.js",
          "react-dom/client": "./react/react-dom-client.system.js",
          "react/jsx-runtime": "./react/react-jsx-runtime.system.js",
          "@pandino/pandino": "./@pandino/pandino/system/pandino.min.js"
        }
      }
    </script>
    <script type="pandino-manifests">
      [
      ]
    </script>
  </head>
  <body>
    <div id="root"></div>
    <script type="systemjs-module" src="./main.js"></script>
  </body>
</html>`;
};

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

export const generateRepackagedOutput = (inputName, targetName) => {
    return {
        input: `repackaged/${inputName}.tsx`,
        output: {
            file: `dist/${targetName}.system.js`,
            format: 'system',
            sourcemap: ENV === 'production',
        },
        external: ['react'],
        ...repackagedConfig,
    };
};
