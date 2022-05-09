# bundle-installer-nodejs

A Pandino Bundle which can load external Bundles defined in the file-system.

## Usage

### Install dependencies

`npm install @pandino/pandino @pandino/bundle-installer-nodejs`;

### Setup Pandino and the Bundle Installer Bundle

```javascript
const Pandino = require("@pandino/pandino").default;
const bundleInstallerHeaders = require('@pandino/bundle-installer-nodejs').default;
const path = require("path");
const fs = require("fs");

const deploymentRoot = path.normalize(path.join(__dirname, 'deploy'));

(async () => {
    const app = express();
    const port = 3000;
    const pandino = new Pandino({
        'pandino.deployment.root': deploymentRoot,
        'pandino.bundle.importer': {
            import: (deploymentRoot, activatorLocation) => {
                return require(path.normalize(path.join(deploymentRoot, activatorLocation)));
            },
        },
        'pandino.manifest.fetcher': {
            fetch: async (deploymentRoot, uri) => {
                const data = fs.readFileSync(path.normalize(path.join(deploymentRoot, uri)), {encoding: 'utf8'});
                return JSON.parse(data);
            },
        },
    });

    await pandino.init();
    await pandino.start();

    await pandino.getBundleContext().installBundle(bundleInstallerHeaders);
})();
```
### Detecting Bundles

Based on the config above, the Bundle Installer will detect changes in the `./deploy` folder, and install / uninstall
all Bundles placed under it.
