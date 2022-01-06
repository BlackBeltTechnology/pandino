export interface ImporterReturns {
  default: any;
  [key: string | symbol | number]: any;
}

/**
 * Generic JavaScript fetcher utility typically used to fetch actual {@see BundleActivator}s
 */
export interface BundleImporter {
  /**
   * Get a {@link ImporterReturns} Resource. The {@code deploymentRoot} path format is platform dependent, meaning it
   * can differ in e.g.: browser environments compared to NodeJS, etc... On the other hand, the {@code manifestLocation}
   * and {@code activatorLocation} MUST contain "/" as separators!
   *
   * Given all parameters could differ in format, it is the concrete implementation's job, to normalize the effective
   * path in the end.
   *
   * @param {string} deploymentRoot
   * @param {string} activatorLocation
   * @param {string} manifestLocation
   * @returns Promise<ImporterReturns>
   */
  import(deploymentRoot: string, activatorLocation: string, manifestLocation: string): Promise<ImporterReturns>;
}
