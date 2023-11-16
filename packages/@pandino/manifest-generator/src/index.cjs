const { sep, resolve, join } = require('node:path');
const { readFileSync, readdirSync, copyFileSync, mkdirSync, writeFileSync } = require('node:fs');

const defaultOptions = {
  addBundleLicenseEntry: true,
  bundleLicenseValue: 'relative-path',
  licenseFileRegex: '^LICENSE(\\.txt)?$',
};

const generateManifest = (options = defaultOptions, targetFile) => {
  const addBundleLicenseEntry =
    typeof options.addBundleLicenseEntry === 'boolean' ? options.addBundleLicenseEntry : true;
  const bundleLicenseValue =
    typeof options.bundleLicenseValue === 'string' ? options.bundleLicenseValue : 'relative-path';
  const licenseFileRegex =
    typeof options.licenseFileRegex === 'string' ? options.licenseFileRegex : '^LICENSE(\\.txt)?$';
  const defaultActivator = './' + targetFile.substring(targetFile.lastIndexOf(sep) + 1);
  const packageString = readFileSync(resolve('package.json')).toString('utf8');
  const packageJson = JSON.parse(packageString);
  let manifest = {};

  if (typeof packageJson === 'object' && packageJson.pandino && packageJson.pandino.manifest) {
    manifest = packageJson.pandino.manifest;
  }

  const target = targetFile.substring(0, targetFile.lastIndexOf('.')) + '-manifest.json';
  const targetPath = resolve(target);
  const lastSeparator = targetPath.lastIndexOf(sep);
  const targetFolder = lastSeparator > -1 ? targetPath.substring(0, lastSeparator) : '.';

  let content = {
    'Bundle-SymbolicName': packageJson.name,
    'Bundle-Version': packageJson.version,
  };

  if (packageJson.description) {
    content['Bundle-Description'] = packageJson.description;
  }

  if (packageJson.author) {
    content['Author'] = packageJson.author;
  }

  if (defaultActivator) {
    content['Bundle-Activator'] = defaultActivator;
  }

  if (addBundleLicenseEntry) {
    const files = readdirSync(resolve(), { withFileTypes: true })
      .filter((item) => !item.isDirectory())
      .map((item) => item.name)
      .filter((item) => item.match(new RegExp(licenseFileRegex)));

    if (files.length) {
      switch (bundleLicenseValue) {
        case 'relative-path':
          mkdirSync(targetFolder, { recursive: true }); // ensure folder is created
          copyFileSync(resolve(files[0]), join(targetFolder, files[0]));
          content['Bundle-License'] = './' + files[0];
          break;
        case 'inline':
          content['Bundle-License'] = readFileSync(resolve(files[0]), { encoding: 'utf-8' }).toString();
          break;
        case 'package-license':
          content['Bundle-License'] = packageJson.license;
          break;
        default:
          throw new Error(`Invalid configuration value for 'bundleLicenseValue': ${bundleLicenseValue}!`);
      }
    }
  }

  const finalContent = {
    ...content,
    ...manifest,
  };

  mkdirSync(targetFolder, { recursive: true }); // ensure folder is created

  writeFileSync(targetPath, JSON.stringify(finalContent, null, 4), { encoding: 'utf8' });
};

module.exports = {
  generateManifest,
  defaultOptions,
};
