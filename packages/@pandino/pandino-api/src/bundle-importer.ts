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
   * @param {string} activatorLocation
   * @param {string} manifestLocation
   * @param {string|undefined} deploymentRoot
   * @returns Promise<ImporterReturns>
   */
  import(activatorLocation: string, manifestLocation: string, deploymentRoot?: string): Promise<ImporterReturns>;
}
