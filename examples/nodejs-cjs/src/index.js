const path = require("path");
const Pandino = require("@pandino/pandino");
const loaderConfiguration = require("@pandino/loader-configuration-nodejs");

const deploymentRoot = path.normalize(path.join(__dirname, 'deploy'));

const pandino = new Pandino({
  ...loaderConfiguration,
  'pandino.deployment.root': deploymentRoot,
});

(async () => {
  await pandino.init();
  await pandino.start();

  await pandino.getBundleContext().installBundle('./bundle-a-manifest.json');

  setTimeout(() => {
    pandino.getBundleContext().installBundle('./bundle-b-manifest.json');
  }, 2000);
})();
