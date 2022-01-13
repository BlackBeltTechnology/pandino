/**
 * Objects implementing this interface are able to directly install and uninstall supported Bundles.
 */
export interface BundleInstaller {
  /**
   * Install the artifact
   *
   * @param {string} path the Bundle to be installed
   * @returns {Promise<void>}
   */
  install(path: string): Promise<void>;

  /**
   * Install the artifact
   *
   * @param {string} path the Bundle to be installed
   * @returns {Promise<void>}
   */
  update(path: string): Promise<void>;

  /**
   * Install the artifact
   *
   * @param {string} path the Bundle to be installed
   * @returns {Promise<void>}
   */
  uninstall(path: string): Promise<void>;
}
