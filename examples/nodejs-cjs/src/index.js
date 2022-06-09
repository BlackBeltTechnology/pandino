const Pandino = require("@pandino/pandino").default;
const path = require("path");
const fs = require("fs");

const deploymentRoot = path.normalize(path.join(__dirname, 'deploy'));

const pandino = new Pandino({
  'pandino.deployment.root': deploymentRoot,
  'pandino.bundle.importer': {
    import: (activatorLocation, manifestLocation, deploymentRoot) => {
      return require(path.normalize(path.join(deploymentRoot, activatorLocation)));
    },
  },
  'pandino.manifest.fetcher': {
    fetch: async (uri, deploymentRoot) => {
      const data = fs.readFileSync(path.normalize(path.join(deploymentRoot, uri)), { encoding: 'utf8' });
      return JSON.parse(data);
    },
  },
});

(async () => {
  await pandino.init();
  await pandino.start();

  await pandino.getBundleContext().installBundle('bundle-a-manifest.json');

  setTimeout(() => {
    pandino.getBundleContext().installBundle('bundle-b-manifest.json');
  }, 2000);
})();
