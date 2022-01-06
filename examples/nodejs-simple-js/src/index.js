import Pandino from '@pandino/pandino';
import express from 'express';
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  const app = express();
  const port = 3000;

  const pandino = new Pandino({
    'pandino.deployment.root': path.normalize(path.join(__dirname, 'deploy')),
    'pandino.bundle.importer': {
      import: (deploymentRoot, activatorLocation) => {
        return import(path.normalize(`file://${path.join(deploymentRoot, activatorLocation)}`));
      },
    },
    'pandino.manifest.fetcher': {
      fetch: async (deploymentRoot, uri) => {
        const data = fs.readFileSync(path.normalize(uri), { encoding: 'utf8' });
        return JSON.parse(data);
      },
    },
  });

  await pandino.init();
  await pandino.start();

  await pandino.getBundleContext().installBundle(path.normalize(path.join(__dirname, 'deploy/echo-resource-manifest.json')));

  app.get('/', (req, res) => {
    res.send('Hello World!');
  });

  app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
  });
})();
