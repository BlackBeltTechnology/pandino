# bundle-installer-nodejs

[![build-test](https://github.com/BlackBeltTechnology/pandino/actions/workflows/build-test.yml/badge.svg)](https://github.com/BlackBeltTechnology/pandino/actions/workflows/build-test.yml)
[![license](https://img.shields.io/badge/license-EPL%20v2.0-blue.svg)](https://github.com/BlackBeltTechnology/pandino)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)

A Pandino Bundle which can load external Bundles defined in the file-system.

## Context

This package is part of the [pandino-root](https://github.com/BlackBeltTechnology/pandino) monorepo. For detailed
information about what is Pandino / how this package fits into the ecosystem, please consult with the related
documentation(s).

## Usage

### Install dependencies

`npm install @pandino/pandino @pandino/bundle-installer-nodejs`;

### Setup Pandino and the Bundle Installer Bundle

```javascript
import Pandino from '@pandino/pandino';
import loaderConfiguration from '@pandino/loader-configuration-nodejs';
import bundleInstallerHeaders from '@pandino/bundle-installer-nodejs';
const path = require("path");

const deploymentRoot = path.normalize(path.join(__dirname, 'deploy'));

(async () => {
    const app = express();
    const port = 3000;
    const pandino = new Pandino({
        ...loaderConfiguration,
        'pandino.deployment.root': deploymentRoot,
    });

    await pandino.init();
    await pandino.start();

    await pandino.getBundleContext().installBundle(bundleInstallerHeaders);
})();
```
### Detecting Bundles

Based on the config above, the Bundle Installer will detect changes in the `./deploy` folder, and install / uninstall
all Bundles placed under it.

## License

Eclipse Public License - v 2.0
