import express from 'express';
import {fileURLToPath} from 'url';
import path from 'path';
import Pandino from '@pandino/pandino';
import bundleInstallerHeaders from '@pandino/pandino-bundle-installer-nodejs';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const deploymentRoot = path.normalize(path.join(__dirname, 'deploy'));

(async () => {
  const app = express();
  const port = 3000;
  const pandino = new Pandino({
    'pandino.deployment.root': deploymentRoot,
    'pandino.bundle.importer': {
      import: (deploymentRoot, activatorLocation) => {
        return import(path.normalize(`file://${path.join(deploymentRoot, activatorLocation)}`));
      },
    },
    'pandino.manifest.fetcher': {
      fetch: async (deploymentRoot, uri) => {
        const data = fs.readFileSync(path.normalize(path.join(deploymentRoot, uri)), { encoding: 'utf8' });
        return JSON.parse(data);
      },
    },
  });

  await pandino.init();
  await pandino.start();

  const pandinoContext = pandino.getBundleContext();
  const loggerReference = pandinoContext.getServiceReference('@pandino/pandino/Logger');
  const logger = pandinoContext.getService(loggerReference);

  await pandinoContext.installBundle(bundleInstallerHeaders);
  pandinoContext.addServiceListener({
    serviceChanged: (event) => {
      if (event.getType() === 'REGISTERED') {
        const reference = event.getServiceReference();
        const factory = pandino.getBundleContext().getService(reference);
        factory.init(app);
      }
    }
  }, '(objectClass=@pandino/nodejs-esm-bundle-installer/resource-manager)');

  app.get('/', (req, res) => {
    res.send('Hello World!');
  });

  app.listen(port, () => {
    logger.info(`Example app listening at http://localhost:${port}`);
  });
})();
