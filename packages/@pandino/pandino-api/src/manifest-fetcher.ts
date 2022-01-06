/**
 * Generic retriever function typically used to get JSON content, e.g.: BundleManifest files.
 */
export interface ManifestFetcher {
  /**
   * Retrieves a Resource for the given {@code deploymentRoot} and {@code uri}.The format of {@code deploymentRoot} and
   * {@code uri} is platform dependent, meaning they can differ in e.g.: browser environments compared to NodeJS.
   *
   * Given all parameters could differ in format, it is the concrete implementation's job, to normalize the effective
   * path in the end.
   *
   * @param {string} deploymentRoot
   * @param {string} uri
   * @returns {Promise<any>} SHOULD return content similar to the RFC standard fetch() function's return type
   */
  fetch(deploymentRoot: string, uri: string): Promise<any>;
}
