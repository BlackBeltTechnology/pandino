import Pandino from "@pandino/pandino";
import path from "path";
import fs from "fs";

export function setupPandino(deploymentRoot) {
  return new Pandino({
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
}
