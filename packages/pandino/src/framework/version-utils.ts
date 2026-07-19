export function parseFragmentHost(fragmentHost: string): [string, string | null] {
  const parts = fragmentHost.split(';');
  const symbolicName = parts[0].trim();
  let versionRange = null;

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i].trim();
    if (part.startsWith('bundle-version=')) {
      // Extract the version range from the quoted string
      const match = part.match(/bundle-version="([^"]*)"/);
      if (match) {
        versionRange = match[1];
      }
    }
  }

  return [symbolicName, versionRange];
}

/**
 * Checks if a bundle version matches a version range.
 * Version ranges can be:
 * - Exact version: "1.0.0"
 * - Range: "[1.0.0,2.0.0)" (inclusive start, exclusive end)
 * - Range: "(1.0.0,2.0.0]" (exclusive start, inclusive end)
 * - Range: "[1.0.0,2.0.0]" (inclusive start, inclusive end)
 * - Range: "(1.0.0,2.0.0)" (exclusive start, exclusive end)
 *
 * @param bundleVersion The bundle version to check
 * @param versionRange The version range to check against
 * @returns True if the bundle version matches the version range, false otherwise
 */
export function versionMatches(bundleVersion: string, versionRange: string): boolean {
  if (!versionRange.startsWith('[') && !versionRange.startsWith('(')) {
    // Value-based exact match so equivalent versions across granularities
    // (e.g. '1.0' and '1.0.0') are treated as equal.
    return compareVersions(bundleVersion, versionRange) === 0;
  }

  const isStartInclusive = versionRange.startsWith('[');
  const isEndInclusive = versionRange.endsWith(']');
  const rangeContent = versionRange.substring(1, versionRange.length - 1);
  const [startVersion, endVersion] = rangeContent.split(',');

  if (startVersion) {
    const comparison = compareVersions(bundleVersion, startVersion);
    if (comparison < 0 || (comparison === 0 && !isStartInclusive)) {
      return false;
    }
  }

  if (endVersion) {
    const comparison = compareVersions(bundleVersion, endVersion);
    if (comparison > 0 || (comparison === 0 && !isEndInclusive)) {
      return false;
    }
  }

  return true;
}

/**
 * Compares two version strings.
 * Returns:
 * - negative if version1 < version2
 * - 0 if version1 == version2
 * - positive if version1 > version2
 *
 * @param version1 The first version to compare
 * @param version2 The second version to compare
 * @returns A number indicating the comparison result
 */
export function compareVersions(version1: string, version2: string): number {
  const parts1 = version1.split('.').map(Number);
  const parts2 = version2.split('.').map(Number);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = i < parts1.length ? parts1[i] : 0;
    const part2 = i < parts2.length ? parts2[i] : 0;

    if (part1 !== part2) {
      return part1 - part2;
    }
  }

  return 0;
}
