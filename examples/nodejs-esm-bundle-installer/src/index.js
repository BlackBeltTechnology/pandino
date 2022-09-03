import express from 'express';
import {fileURLToPath} from 'url';
import path from 'path';
import Pandino from '@pandino/pandino';
import loaderConfiguration from '@pandino/loader-configuration-nodejs';
import bundleInstallerHeaders from '@pandino/bundle-installer-nodejs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
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
