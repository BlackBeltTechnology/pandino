const path = require('path');

const getDeps = (dependencies, includeFlag = true) =>
  !dependencies || !includeFlag ? [] : Object.keys(dependencies);

const getExternal = (modules = [], peerDependenciesFlag = true, dependenciesFlag = false) => {
  const packageFilePath = path.resolve(process.cwd(), 'package.json');
  const packageFile = require(packageFilePath);

  const peerDependenciesKeys = getDeps(packageFile.peerDependencies, peerDependenciesFlag);
  const dependenciesKeys = getDeps(packageFile.dependencies, dependenciesFlag);

  const externalModules = [
    ...modules,
    ...peerDependenciesKeys,
    ...dependenciesKeys,
  ]
    .filter((module) => module)
    .map((externalModule) => new RegExp('^' + externalModule + '(\\/.+)*$'));

  return (module) => externalModules.some((regexp) => regexp.test(module));
};

module.exports = {
  getExternal,
};
