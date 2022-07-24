const path = require('path');
const fs = require('fs');

function getNameFromToken(token) {
  return token.substring(2, token.lastIndexOf('}'));
}

const generateManifest = (options = {}) => {
  const { target, extraTokens = {}, hook = 'buildEnd' } = options
  return {
    name: 'generate-manifest',
    [hook]: () => {
      if (!target) {
        throw new Error('Missing mandatory configuration attribute: "target"!');
      }

      const packageString = fs.readFileSync(path.resolve('package.json')).toString('utf8');
      const packageJson = JSON.parse(packageString);

      if (typeof packageJson === 'object' && packageJson.pandino && packageJson.pandino.manifest) {
        const manifest = packageJson.pandino.manifest;
        let raw = JSON.stringify(manifest, null, 4);

        const tokens = [...new Set(Array.from(raw.matchAll(/\$\{\w+}/gm)).map(e => e[0].trim()))];
        const tokensPure = [...tokens.map(t => getNameFromToken(t)), ...Object.keys(extraTokens)];
        const knownKeys = [...Object.keys(packageJson), ...Object.keys(extraTokens)];
        const missingTokens = tokensPure.filter(t => !knownKeys.includes(t));

        if (missingTokens.length) {
          throw new Error(`Error: pandino.manifest section in package.json file refers to attributes which do not exist in the file: [${missingTokens.join(', ')}]`)
        }

        let targetRaw = raw;

        for (const token of tokens) {
          const packageJsonValue = packageJson[getNameFromToken(token)];
          targetRaw = targetRaw.replaceAll(token, packageJsonValue ? packageJsonValue : extraTokens[getNameFromToken(token)]);
        }

        const targetPath = path.resolve(target);

        const lastSeparator = targetPath.lastIndexOf(path.sep);
        const targetFolder = lastSeparator > -1 ? targetPath.substring(0, lastSeparator) : '.';

        fs.mkdirSync(targetFolder, { recursive: true }); // ensure folder is created

        fs.writeFileSync(targetPath, JSON.stringify(JSON.parse(targetRaw), null, 4), { encoding: 'utf8' });
      }
    }
  }
}

module.exports = generateManifest;
