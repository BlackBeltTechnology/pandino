export interface ImporterReturns {
  default: any;
  [key: string | symbol | number]: any;
}

/**
 * Generic JavaScript fetcher utility typically used to fetch actual {@see BundleActivator}s
 */
export interface Importer {
  /**
   * Get a {@link ImporterReturns} Resource from the given {@code activator} path. The {@code activator} path format is
   * platform dependent, meaning it can differ in e.g.: browser environments compared to NodeJS, etc...
   *
   * @param {string} activator
   * @returns Promise<ImporterReturns>
   */
  import(activator: string): Promise<ImporterReturns>;
}
