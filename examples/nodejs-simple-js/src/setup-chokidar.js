import {watch} from "chokidar";

export function setupWatch(app, pandino, logger, deploymentRoot) {
  const pathBundleMap = new Map();

  const installFn = async (path) => {
    const bundle = await pandino.getBundleContext().installBundle(path);
    pathBundleMap.set(path, bundle);
  };

  const uninstallFn = (path) => {
    const toUninstall = pathBundleMap.get(path);
    if (!!toUninstall) {
      try {
        pandino.getBundleContext().getBundle(toUninstall.getBundleId()).uninstall();
      } catch (err) {
        logger.error(err);
      }
    }
  };

  watch('**/*-manifest.json', { cwd: deploymentRoot })
    .on('add', installFn)
    .on('change', installFn)
    .on('unlink', uninstallFn);

  pandino.getBundleContext().addServiceListener({
    serviceChanged: (event) => {
      if (event.getType() === 'REGISTERED') {
        const reference = event.getServiceReference();
        const factory = pandino.getBundleContext().getService(reference);
        factory.init(app);
      }
    }
  }, '(objectClass=@pandino/nodejs-simple-js/resource-manager)');
}
