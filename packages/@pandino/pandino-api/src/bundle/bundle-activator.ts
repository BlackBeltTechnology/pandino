import type { BundleContext } from './bundle-context';

/**
 * Customizes the starting and stopping of a bundle.
 * <p>
 * {@code BundleActivator} is an interface that may be implemented when a bundle is started or stopped. The Framework
 * can create instances of a bundle's {@code BundleActivator} as required. If an instance's
 * {@code BundleActivator.start} method executes successfully, it is guaranteed that the same instance's
 * {@code BundleActivator.stop} method will be called when the bundle is to be stopped.
 *
 * <p>
 * {@code BundleActivator} is specified through the {@code Bundle-Activator} Manifest header. A bundle can only specify
 * a single {@code BundleActivator} in the Manifest file. The form of the Manifest header is:
 *
 * <p>
 * {@code Bundle-Activator:} <i>path/to/activator/file.js</i>
 *
 * <p>
 * The specified {@code BundleActivator} class must have a public constructor that takes no parameters so that a
 * {@code BundleActivator} object can be created.
 */
export interface BundleActivator {
  /**
   * Called when this bundle is started so the Framework can perform the bundle-specific activities necessary to start
   * this bundle. This method can be used to register services or to allocate any resources that this bundle needs.
   *
   * <p>
   * This method must complete and return to its caller in a timely manner.
   *
   * @param {BundleContext} context The execution context of the bundle being started.
   * @returns {Promise<void>}
   */
  start(context: BundleContext): Promise<void>;

  /**
   * Called when this bundle is stopped so the Framework can perform the bundle-specific activities necessary to stop
   * the bundle. In general, this method should undo the work that the {@code BundleActivator.start} method started.
   * There should be no active threads that were started by this bundle when this bundle returns. A stopped bundle must
   * not call any Framework objects.
   *
   * <p>
   * This method must complete and return to its caller in a timely manner.
   *
   * @param {BundleContext} context The execution context of the bundle being stopped.
   * @returns {Promise<void>}
   */
  stop(context: BundleContext): Promise<void>;
}
