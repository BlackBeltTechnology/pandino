import picomatch from 'picomatch';

export function globToRegExp(basePath: string, pattern: string): RegExp {
  const normalizedBasePath = basePath.endsWith('/') ? basePath : basePath + '/';
  const fullPattern = normalizedBasePath + pattern;

  return picomatch.makeRe(fullPattern);
}

export function matchesGlob(path: string, basePath: string, pattern: string): boolean {
  if (path.substring(basePath.length + 1).includes('/')) {
    return false;
  }

  const normalizedBasePath = basePath.endsWith('/') ? basePath : basePath + '/';
  const fullPattern = normalizedBasePath + pattern;

  return picomatch.isMatch(path, fullPattern);
}

export function filterByGlob(paths: string[], basePath: string, pattern: string): string[] {
  const directChildren = paths.filter(
    (path) => path.startsWith(basePath + '/') && !path.substring(basePath.length + 1).includes('/'),
  );

  const normalizedBasePath = basePath.endsWith('/') ? basePath : basePath + '/';
  const fullPattern = normalizedBasePath + pattern;

  const isMatch = picomatch(fullPattern);

  return directChildren.filter((path) => isMatch(path));
}
