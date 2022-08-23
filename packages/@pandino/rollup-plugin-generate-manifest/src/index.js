const path = require('path');
const fs = require('fs');

const generateManifest = (options = {}) => {
  const { addBundleLicenseEntry = true, copyBundleLicense = true, licenseFileRegex = '^LICENSE(\\.txt)?$' } = options
  return {
    name: 'generate-manifest',
    writeBundle: (bundleOptions) => {
      const targetFile = Array.isArray(bundleOptions.file) ? bundleOptions.file[0] : bundleOptions.file;
      const defaultActivator = './' + targetFile.substring(targetFile.lastIndexOf('/') + 1);
      const target = bundleOptions.file.substring(0, bundleOptions.file.lastIndexOf('.')) + '-manifest.json';
      const packageString = fs.readFileSync(path.resolve('package.json')).toString('utf8');
      const packageJson = JSON.parse(packageString);
      let manifest = {};

      if (typeof packageJson === 'object' && packageJson.pandino && packageJson.pandino.manifest) {
        manifest = packageJson.pandino.manifest;
      }

      const targetPath = path.resolve(target);
      const lastSeparator = targetPath.lastIndexOf(path.sep);
      const targetFolder = lastSeparator > -1 ? targetPath.substring(0, lastSeparator) : '.';

      let content = {
        'Bundle-SymbolicName': packageJson.name,
        'Bundle-Version': packageJson.version,
      };

      if (packageJson.description) {
        content['Bundle-Description'] = packageJson.description;
      }

      if (packageJson.license) {
        content['License'] = packageJson.license;
      }

      if (packageJson.author) {
        content['Author'] = packageJson.author;
      }

      if (defaultActivator) {
        content['Bundle-Activator'] = defaultActivator;
      }

      if (addBundleLicenseEntry) {
        const files = fs.readdirSync(path.resolve(), { withFileTypes: true })
          .filter(item => !item.isDirectory())
          .map(item => item.name)
          .filter(item => item.match(new RegExp(licenseFileRegex)));

        if (files.length) {
          if (copyBundleLicense) {
            fs.copyFileSync(path.resolve(files[0]), path.join(targetFolder, files[0]));
            content['Bundle-License'] = './' + files[0];
          } else {
            content['Bundle-License'] = fs.readFileSync(path.resolve(files[0]), { encoding: 'utf-8' }).toString();
          }
        }
      }

      const finalContent = {
        ...content,
        ...manifest,
      };

      fs.mkdirSync(targetFolder, { recursive: true }); // ensure folder is created

      fs.writeFileSync(targetPath, JSON.stringify(finalContent, null, 4), { encoding: 'utf8' });
    }
  }
}

module.exports = generateManifest;
