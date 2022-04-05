const { EOL } = require('os');
const { sep } = require('path');
const terserMinify = require('terser').minify;
const prettier = require('prettier');

const providerTemplate = (componentMap) => {
  const props = typeof componentMap.props === 'object' ? JSON.stringify(componentMap.props) : '{}';

  return `
        const provide${componentMap.component} = {
            getComponent: () => ${componentMap.component},
            getFilter: () => undefined,
            getIdentifier: () => '${componentMap.identifier}',
        };
        this.provide${componentMap.component}Registration = context.registerService(provide${componentMap.component}.getIdentifier(), provide${componentMap.component}, ${props});
  `
};

const externalRefsTemplate = ({token, identifier}) => {
  return `
        this.${token}Ref = context.getServiceReference('${identifier}');
        const ${token} = context.getService(this.${token}Ref);  
  `;
};

const template = (componentsMap, externalRefsMap, codes) => `
class Activator {
    ${externalRefsMap.map(m => `${m.token}Ref`).join(EOL)}
    ${componentsMap.map(m => `provide${m.component}Registration`).join(EOL)}

    async start(context) {
        /**** External Refs ****/
        ${externalRefsMap.map(externalRefsTemplate).join(EOL)}
        
        /**** Components ****/
        ${codes.join(EOL)}
        
        /**** Register Providers ****/
        ${componentsMap.map(providerTemplate).join(EOL)}
    }

    async stop(context) {
        ${externalRefsMap.map(m => `context.ungetService(this.${m.token}Ref);`).join(EOL)}
        ${componentsMap.map(m => `this.provide${m.component}Registration?.unregister();`).join(EOL)}
    }
}

export { Activator as default };

`;

const pandinoExternalizeReact = ({
  componentsMap = {},
  externalRefsMap = {},
  minify = false,
  prettify = false,
  prettierConfig = {
    parser: 'babel',
    printWidth: 120,
    singleQuote: true,
    trailingComma: 'all',
  },
  manifestData = {},
}) => {
  const codes = [];

  return {
    name: 'pandino-externalize-react',
    renderChunk: async (code, chunk, options) => {
      for (module of Object.values(chunk.modules)) {
        codes.push(module.code);
      }
    },
    generateBundle: async (options, bundle, isWrite) => {
      const key = Object.keys(bundle)[0];
      const result = template(componentsMap, externalRefsMap, codes);
      const code = prettify ? prettier.format(result, prettierConfig) : result;
      bundle[key].code = minify ? (await terserMinify(code)).code : code;

      const manifestKey = key.replace(/\.(m?)js$/, '-manifest.json');
      const manifestFile = key
        .substring(key.lastIndexOf(sep))
        .replace(/\.(m?)js$/, '-manifest.json');

      bundle[manifestKey] = {
        name: manifestFile,
        isAsset: true,
        type: 'asset',
        fileName: manifestFile,
        source: JSON.stringify(manifestData, null, 4),
      };
    },
  }
}

module.exports = {
  pandinoExternalizeReact,
};
