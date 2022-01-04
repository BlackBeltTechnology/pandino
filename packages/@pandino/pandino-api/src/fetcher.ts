/**
 * Generic retriever function typically used to get JSON content, e.g.: BundleManifest files.
 */
export interface Fetcher {
  /**
   * Retrieves a Resource for the given {@code uri}
   *
   * @param {string} uri
   * @returns {Promise<any>} SHOULD return content similar to the RFC standard fetch() function's return type
   */
  fetch(uri: string): Promise<any>;
}
