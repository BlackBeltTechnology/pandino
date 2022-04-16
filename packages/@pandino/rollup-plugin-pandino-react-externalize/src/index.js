const { EOL } = require('os');
const { sep } = require('path');
const terserMinify = require('terser').minify;
const prettier = require('prettier');
const { getExternal } = require('./externals');

const providerTemplate = (componentMap) => {
  const props = typeof componentMap.props === 'object' ? JSON.stringify(componentMap.props) : '{}';

  return `this.provide${componentMap.component}Registration = context.registerService('${componentMap.identifier}', ${componentMap.component}, ${props});`
};

const externalRefsTemplate = ({token, identifier}) => {
  return `
    this.${token}Ref = context.getServiceReference('${identifier}');
    const ${token} = context.getService(this.${token}Ref);  
  `;
};

const template = (componentsMap, externalRefsMap, codes, mockProcess) => `
class Activator {
  ${externalRefsMap.map(m => `${m.token}Ref`).join(EOL)}
  ${componentsMap.map(m => `provide${m.component}Registration`).join(EOL)}

  async start(context) {
    ${mockProcess ? `const process = Object.freeze(${JSON.stringify(mockProcess, null, 2)});` : ''}

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

const defaultExternalsMapping = {
  '@pandino/pandino-react-dom': '@pandino/pandino-react-dom',
  'react/jsx-runtime': '@pandino/pandino-react-dom/react/jsx-runtime',
  'react': '@pandino/pandino-react-dom/react',
  'react-router-dom': '@pandino/pandino-react-router-dom/react-router-dom',
};

const defaultPrettierConfig = {
  parser: 'babel',
  printWidth: 120,
  singleQuote: true,
  trailingComma: 'all',
};

const pandinoExternalizeReact = ({
  componentsMap = [],
  externalRefs = [],
  minify = false,
  prettify = false,
  peerDependencies = true,
  dependencies = false,
  prettierConfig = defaultPrettierConfig,
  externalsMapping = defaultExternalsMapping,
  manifestData = {},
  mockProcess,
}) => {
  const codes = [];
  const generatedExternals = [];

  return {
    name: 'pandino-externalize-react',
    options: (opts) => ({
      ...opts,
      external: getExternal(opts.external, peerDependencies, dependencies),
    }),
    renderChunk: async (code, chunk, options) => {
      const externalsBindings = Object.keys(externalsMapping);
      for (const binding in chunk.importedBindings) {
        if (externalsBindings.includes(binding)) {
          for (const token of chunk.importedBindings[binding]) {
            generatedExternals.push({
              token,
              identifier: `${externalsMapping[binding]}/${token}`,
            });
          }
        }
      }

      for (module of Object.values(chunk.modules)) {
        codes.push(module.code);
      }
    },
    generateBundle: async (options, bundle, isWrite) => {
      const key = Object.keys(bundle)[0];
      const externals = [...generatedExternals, ...externalRefs];
      const result = template(componentsMap, externals, codes, mockProcess);
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
  defaultExternalsMapping,
  defaultPrettierConfig,
};
