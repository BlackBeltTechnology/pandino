import {EOL} from 'node:os';

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
          "@pandino/pandino": "./pandino/pandino.js"
        }
      }
    </script>
  </head>
  <body>
    <div id="root"></div>
    <script type="systemjs-module" src="./main.js"></script>
  </body>
</html>`;
};
