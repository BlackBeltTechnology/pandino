import express from 'express';
import {setupPandino} from './setup-pandino.js';
import {setupWatch} from "./setup-chokidar.js";
import {fileURLToPath} from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const deploymentRoot = path.normalize(path.join(__dirname, 'deploy'));

(async () => {
  const app = express();
  const port = 3000;
  const pandino = setupPandino(deploymentRoot);

  await pandino.init();
  await pandino.start();

  const pandinoContext = pandino.getBundleContext();
  const loggerReference = pandinoContext.getServiceReference('@pandino/pandino/Logger');
  const logger = pandinoContext.getService(loggerReference);

  setupWatch(app, pandino, logger, deploymentRoot);

  app.get('/', (req, res) => {
    res.send('Hello World!');
  });

  app.listen(port, () => {
    logger.info(`Example app listening at http://localhost:${port}`);
  });
})();
